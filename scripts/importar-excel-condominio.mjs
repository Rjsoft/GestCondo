// Importa dados extraídos de um Excel real de condomínio (modelo GAC) para
// um condomínio da GestCondo já criado (condominio + admin) pela forma
// normal (onboarding) — este script nunca cria contas nem condomínios,
// só escreve dados de negócio num condomínio que já existe e está vazio.
//
// Entrada: um JSON produzido por um script de extração próprio (não faz
// parte deste repositório — o Excel de origem tem dados pessoais reais e
// nunca deve ser commitado). O JSON tem a forma:
//   { condominio, fracoes[], movimentos[], orcamentos[], patrimonio[],
//     fornecedores[], avisos[] }
//
// Segurança:
// - Modo simulação por omissão — só escreve com --confirmo.
// - Por omissão liga-se à BD de DESENVOLVIMENTO (.env.local). Para
//   produção, exige --producao E a variável PROD_DATABASE_URL — nunca por
//   omissão, mesmo padrão de scripts/check-migration-drift.mjs.
// - Recusa-se a continuar se o condomínio tiver frações que não sejam
//   exatamente a exceção documentada em --fracao-existente=<letra> (evita
//   duplicar por engano ao correr duas vezes, mas permite o caso real de o
//   próprio administrador já ter criado a sua fração antes de importar o
//   resto). Nesse caso, essa fração NUNCA é inserida — só é atualizada com
//   nif/contactoTelefone do Excel, o resto (identificação, proprietário,
//   permilagem já inseridos à mão) fica intocado.
// - Tudo dentro de uma única transação SQL — ou tudo ou nada.
//
// Uso:
//   node scripts/importar-excel-condominio.mjs <condominioId> <userId> <caminho-json>
//   node scripts/importar-excel-condominio.mjs <condominioId> <userId> <caminho-json> --confirmo
//   node scripts/importar-excel-condominio.mjs <condominioId> <userId> <caminho-json> --confirmo --producao
//   node scripts/importar-excel-condominio.mjs <condominioId> <userId> <caminho-json> --confirmo --producao --fracao-existente=O

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
const fracaoExistenteArg = process.argv.find((a) => a.startsWith('--fracao-existente='))
const letraFracaoExistente = fracaoExistenteArg ? fracaoExistenteArg.split('=')[1] : null

const [condominioIdArg, userId, caminhoJson] = args
const condominioId = Number(condominioIdArg)

if (!condominioId || !userId || !caminhoJson) {
  console.error('Uso: node scripts/importar-excel-condominio.mjs <condominioId> <userId> <caminho-json> [--confirmo] [--producao]')
  process.exit(1)
}

if (producao && !process.env.PROD_DATABASE_URL) {
  console.error('--producao exige a variável PROD_DATABASE_URL (connection string de produção, sem pooling).')
  process.exit(1)
}

const connectionString = producao ? process.env.PROD_DATABASE_URL : lerDatabaseUrlLocal()
const dados = JSON.parse(fs.readFileSync(caminhoJson, 'utf8'))

console.log(`Alvo: ${mascarar(connectionString)} (${producao ? 'PRODUÇÃO' : 'desenvolvimento'})`)
console.log(`Condomínio: ${condominioId} | Utilizador (admin): ${userId}`)
console.log(`Ficheiro: ${caminhoJson}`)
console.log(`Frações: ${dados.fracoes.length} | Movimentos: ${dados.movimentos.length} | Orçamentos: ${dados.orcamentos.length} | Património: ${dados.patrimonio.length} | Fornecedores: ${dados.fornecedores.length}`)
if (dados.avisos?.length) {
  console.log(`\nAvisos da extração (${dados.avisos.length}):`)
  for (const a of dados.avisos) console.log(`  - ${a}`)
}

const client = new pg.Client({ connectionString })
await client.connect()

try {
  const { rows: condRows } = await client.query('select id, nome from condominio where id = $1', [condominioId])
  if (condRows.length === 0) throw new Error(`Condomínio ${condominioId} não existe.`)

  const { rows: membroRows } = await client.query(
    'select id from membro where "userId" = $1 and "condominioId" = $2',
    [userId, condominioId],
  )
  if (membroRows.length === 0) throw new Error(`Utilizador ${userId} não é membro do condomínio ${condominioId}.`)

  const { rows: fracoesExistentes } = await client.query(
    'select id, letra from fracao where "condominioId" = $1',
    [condominioId],
  )
  if (fracoesExistentes.length > 0) {
    const excecaoValida =
      letraFracaoExistente &&
      fracoesExistentes.length === 1 &&
      fracoesExistentes[0].letra === letraFracaoExistente
    if (!excecaoValida) {
      throw new Error(
        `O condomínio ${condominioId} já tem ${fracoesExistentes.length} fração(ões) (${fracoesExistentes.map((f) => f.letra).join(', ')}) — ` +
          `este script só corre em condomínios vazios, ou com exatamente a fração indicada em --fracao-existente=<letra>, para nunca duplicar por engano.`,
      )
    }
    console.log(`Fração "${letraFracaoExistente}" já existe (criada manualmente) — não será recriada, só atualizada com nif/contactoTelefone.`)
  }

  console.log(`\nCondomínio confirmado: "${condRows[0].nome}".`)

  if (!confirmado) {
    console.log('\nModo simulação — nada foi alterado.')
    console.log('Para executar de facto: acrescentar --confirmo ao comando.')
    process.exit(0)
  }

  await client.query('BEGIN')

  // 1. Condomínio — atualiza campos vazios com os dados do Excel
  await client.query(
    `update condominio set morada = $1, "numeroMatricial" = $2, "conservatoriaRegistoPredial" = $3,
     "licencaHabitacao" = $4, "projetoArquiteto" = $5, "areaConstrucao" = $6 where id = $7`,
    [
      dados.condominio.morada,
      dados.condominio.numeroMatricial,
      dados.condominio.conservatoriaRegistoPredial,
      dados.condominio.licencaHabitacao,
      dados.condominio.projetoArquiteto,
      dados.condominio.areaConstrucao,
      condominioId,
    ],
  )

  // 2. Frações — a letra em --fracao-existente nunca é inserida (já existe,
  // criada manualmente); só é enriquecida com nif/contactoTelefone do Excel.
  const fracaoIdPorLetra = new Map()
  if (letraFracaoExistente) {
    const fExistente = fracoesExistentes.find((f) => f.letra === letraFracaoExistente)
    const fExcel = dados.fracoes.find((f) => f.letra === letraFracaoExistente)
    if (fExcel) {
      await client.query(`update fracao set nif = $1, "contactoTelefone" = $2 where id = $3`, [
        fExcel.nif,
        fExcel.contactoTelefone,
        fExistente.id,
      ])
      fracaoIdPorLetra.set(letraFracaoExistente, fExistente.id)
      console.log(`Fração "${letraFracaoExistente}" (id ${fExistente.id}) atualizada com nif/contactoTelefone.`)
    }
  }
  for (const f of dados.fracoes) {
    if (f.letra === letraFracaoExistente) continue
    const { rows } = await client.query(
      `insert into fracao ("condominioId", "userId", letra, identificacao, proprietario, "tipoTitular", nif, permilagem, "areaPrivativa", "areaComum", "contactoTelefone")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning id`,
      [condominioId, userId, f.letra, f.identificacao, f.proprietario, f.tipoTitular, f.nif, f.permilagem, f.areaPrivativa, f.areaComum, f.contactoTelefone],
    )
    fracaoIdPorLetra.set(f.letra, rows[0].id)
  }
  console.log(`Frações criadas: ${fracaoIdPorLetra.size}`)

  // 3. Fornecedores
  const fornecedorIdPorNome = new Map()
  for (const nome of dados.fornecedores) {
    const { rows } = await client.query(
      `insert into fornecedor ("condominioId", "userId", nome) values ($1,$2,$3) returning id`,
      [condominioId, userId, nome],
    )
    fornecedorIdPorNome.set(nome.toLowerCase(), rows[0].id)
  }
  console.log(`Fornecedores criados: ${fornecedorIdPorNome.size}`)

  // 4. Movimentos
  let nReceitas = 0
  let nDespesas = 0
  for (const m of dados.movimentos) {
    const fracaoId = m.fracaoLetra ? fracaoIdPorLetra.get(m.fracaoLetra) ?? null : null
    const fornecedorId = m.fornecedorNome ? fornecedorIdPorNome.get(m.fornecedorNome.toLowerCase()) ?? null : null
    await client.query(
      `insert into movimento ("condominioId", "userId", tipo, categoria, descricao, valor, "fracaoId", data, pago, "meioPagamento", "fornecedorId")
       values ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10)`,
      [condominioId, userId, m.tipo, m.categoria, m.descricao, m.valor, fracaoId, m.data, m.meioPagamento, fornecedorId],
    )
    if (m.tipo === 'receita') nReceitas++
    else nDespesas++
  }
  console.log(`Movimentos criados: ${nReceitas} receitas + ${nDespesas} despesas`)

  // 5. Orçamentos
  for (const o of dados.orcamentos) {
    await client.query(
      `insert into orcamento ("condominioId", "userId", ano, "valorAnual", notas) values ($1,$2,$3,$4,$5)`,
      [condominioId, userId, o.ano, o.valorAnual, o.notas],
    )
  }
  console.log(`Orçamentos criados: ${dados.orcamentos.length}`)

  // 6. Património
  for (const p of dados.patrimonio) {
    await client.query(
      `insert into patrimonio ("condominioId", "userId", nome, categoria, "dataAquisicao", "valorAquisicao", "valorAtual", notas)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [condominioId, userId, p.nome, p.categoria, p.dataAquisicao, p.valorAquisicao, p.valorAtual, p.notas],
    )
  }
  console.log(`Bens de património criados: ${dados.patrimonio.length}`)

  // 7. Auditoria — um registo-resumo por tipo de entidade (não um por cada
  // linha, para não inundar /auditoria com centenas de entradas idênticas)
  const { rows: actorRows } = await client.query('select name from "user" where id = $1', [userId])
  const actorNome = actorRows[0]?.name ?? 'Importação'
  const resumos = [
    ['condominio', condominioId, `Importação de dados do edifício a partir de Excel (${caminhoJson.split(/[\\/]/).pop()})`],
    ['fracao', condominioId, `Importação em massa: ${fracaoIdPorLetra.size} frações`],
    ['fornecedor', condominioId, `Importação em massa: ${fornecedorIdPorNome.size} fornecedores`],
    ['movimento', condominioId, `Importação em massa: ${nReceitas} receitas + ${nDespesas} despesas`],
    ['orcamento', condominioId, `Importação em massa: ${dados.orcamentos.length} orçamento(s)`],
    ['patrimonio', condominioId, `Importação em massa: ${dados.patrimonio.length} bens`],
  ]
  for (const [entidade, entidadeId, detalhes] of resumos) {
    await client.query(
      `insert into audit_log ("condominioId", "actorUserId", "actorNome", acao, entidade, "entidadeId", detalhes)
       values ($1,$2,$3,'criar',$4,$5,$6)`,
      [condominioId, userId, actorNome, entidade, entidadeId, detalhes],
    )
  }

  await client.query('COMMIT')
  console.log('\nOK — importação concluída e confirmada (COMMIT).')
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('\nERRO — nada foi alterado (ROLLBACK):', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
