// Segunda fase da importação de scripts/importar-excel-condominio.mjs:
// cria as contas financeiras reais identificadas na folha BANCOS do Excel
// de origem e liga a elas os movimentos já importados, usando o
// `meioPagamento` já derivado nessa altura (transferencia -> Millennium
// BCP, numerario -> Caixa/Tesouraria) — não volta a ler o Excel.
//
// Só corre sobre um condomínio que já tenha sido importado pelo script
// principal (tem de já ter movimentos) e que ainda não tenha nenhuma
// conta financeira criada (evita duplicar por engano).
//
// Segurança: mesmo padrão dos restantes scripts — simulação por omissão,
// só escreve com --confirmo; produção exige --producao + PROD_DATABASE_URL.
//
// Uso:
//   node scripts/importar-excel-contas-bancarias.mjs <condominioId> <userId>
//   node scripts/importar-excel-contas-bancarias.mjs <condominioId> <userId> --confirmo [--producao]

import fs from 'fs'
import pg from 'pg'

function lerDatabaseUrlLocal() {
  const env = fs.readFileSync('.env.local', 'utf8').replace(/^﻿/, '')
  const match = env.match(/DATABASE_URL="?([^"\n]+)"?/)
  if (!match) throw new Error('DATABASE_URL não encontrado em .env.local')
  return match[1]
}

function mascarar(connectionString) {
  try {
    const url = new URL(connectionString)
    return `${url.hostname}${url.pathname}`
  } catch {
    return '(não foi possível interpretar a connection string)'
  }
}

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const confirmado = process.argv.includes('--confirmo')
const producao = process.argv.includes('--producao')
const [condominioIdArg, userId] = args
const condominioId = Number(condominioIdArg)

if (!condominioId || !userId) {
  console.error('Uso: node scripts/importar-excel-contas-bancarias.mjs <condominioId> <userId> [--confirmo] [--producao]')
  process.exit(1)
}
if (producao && !process.env.PROD_DATABASE_URL) {
  console.error('--producao exige a variável PROD_DATABASE_URL (connection string de produção, sem pooling).')
  process.exit(1)
}

const connectionString = producao ? process.env.PROD_DATABASE_URL : lerDatabaseUrlLocal()
console.log(`Alvo: ${mascarar(connectionString)} (${producao ? 'PRODUÇÃO' : 'desenvolvimento'})`)
console.log(`Condomínio: ${condominioId} | Utilizador (admin): ${userId}`)

const client = new pg.Client({ connectionString })
await client.connect()

try {
  const { rows: nMov } = await client.query(
    'select count(*)::int as n from movimento where "condominioId" = $1',
    [condominioId],
  )
  if (nMov[0].n === 0) throw new Error(`Condomínio ${condominioId} não tem movimentos — corre primeiro importar-excel-condominio.mjs.`)

  const { rows: nConta } = await client.query(
    'select count(*)::int as n from conta_financeira where "condominioId" = $1',
    [condominioId],
  )
  if (nConta[0].n > 0) {
    throw new Error(`O condomínio ${condominioId} já tem ${nConta[0].n} conta(s) financeira(s) — este script só corre uma vez.`)
  }

  const { rows: porMeio } = await client.query(
    `select "meioPagamento", count(*)::int as n from movimento where "condominioId" = $1 group by "meioPagamento"`,
    [condominioId],
  )
  console.log('Movimentos por meio de pagamento:', porMeio.map((r) => `${r.meioPagamento}=${r.n}`).join(', '))

  if (!confirmado) {
    console.log('\nModo simulação — nada foi alterado.')
    console.log('Criaria: conta "Millennium BCP" (ordem) e conta "Caixa / Tesouraria" (caixa),')
    console.log('e ligaria os movimentos "transferencia" à primeira e "numerario" à segunda.')
    console.log('Para executar de facto: acrescentar --confirmo ao comando.')
    process.exit(0)
  }

  await client.query('BEGIN')

  const { rows: bcp } = await client.query(
    `insert into conta_financeira ("condominioId", nome, banco, iban, tipo, moeda, estado)
     values ($1, 'Millennium BCP', 'Millennium bcp', 'PT50 0033 0000 4546 5994 9100 5', 'ordem', 'EUR', 'ativa')
     returning id`,
    [condominioId],
  )
  const { rows: caixa } = await client.query(
    `insert into conta_financeira ("condominioId", nome, tipo, moeda, estado)
     values ($1, 'Caixa / Tesouraria', 'caixa', 'EUR', 'ativa')
     returning id`,
    [condominioId],
  )
  const bcpId = bcp[0].id
  const caixaId = caixa[0].id
  console.log(`Conta "Millennium BCP" criada (id ${bcpId}). Conta "Caixa / Tesouraria" criada (id ${caixaId}).`)

  const { rowCount: nBcp } = await client.query(
    `update movimento set "contaFinanceiraId" = $1 where "condominioId" = $2 and "meioPagamento" = 'transferencia'`,
    [bcpId, condominioId],
  )
  const { rowCount: nCaixa } = await client.query(
    `update movimento set "contaFinanceiraId" = $1 where "condominioId" = $2 and "meioPagamento" = 'numerario'`,
    [caixaId, condominioId],
  )
  console.log(`Movimentos ligados: ${nBcp} a Millennium BCP, ${nCaixa} a Caixa/Tesouraria.`)

  const { rows: actorRows } = await client.query('select name from "user" where id = $1', [userId])
  const actorNome = actorRows[0]?.name ?? 'Importação'
  await client.query(
    `insert into audit_log ("condominioId", "actorUserId", "actorNome", acao, entidade, "entidadeId", detalhes)
     values ($1,$2,$3,'criar','contaFinanceira',$4,$5)`,
    [condominioId, userId, actorNome, bcpId, 'Importação: conta Millennium BCP + ligação de movimentos existentes'],
  )
  await client.query(
    `insert into audit_log ("condominioId", "actorUserId", "actorNome", acao, entidade, "entidadeId", detalhes)
     values ($1,$2,$3,'criar','contaFinanceira',$4,$5)`,
    [condominioId, userId, actorNome, caixaId, 'Importação: conta Caixa/Tesouraria + ligação de movimentos existentes'],
  )

  await client.query('COMMIT')
  console.log('\nOK — contas criadas e movimentos ligados (COMMIT).')
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('\nERRO — nada foi alterado (ROLLBACK):', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
