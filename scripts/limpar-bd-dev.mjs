// Limpa todos os dados de condomínio (frações, membros, movimentos,
// avisos, assembleias, documentos, auditoria, etc.) da base de dados de
// DESENVOLVIMENTO, deixando-a pronta para recomeçar do zero — mantém o
// schema, as migrações e as contas de autenticação (user/session/account)
// intactas, para continuar a poder iniciar sessão depois de limpar.
//
// TRUNCATE ... CASCADE em `condominio` arrasta consigo, por FK, todas as
// tabelas de negócio do condomínio (membro, fracao, movimento, aviso,
// assembleia, auditoria, etc. — ver lib/db/schema.ts, todas referenciam
// condominio.id com onDelete cascade, direta ou transitivamente). Não há
// FK real de nenhuma tabela de autenticação do better-auth
// (user/session/account/twoFactor/verification) para `condominio` — por
// isso ficam sempre intactas, incluindo a tua conta e sessão.
//
// Só lê DATABASE_URL de .env.local — nunca aceita outra ligação por
// parâmetro, para nunca correr por engano contra produção (essa exige
// sempre PROD_DATABASE_URL explícito noutros scripts deste projeto, nunca
// usado aqui).
//
// Ação IRREVERSÍVEL — por isso não faz nada sem a flag --confirmo. Uso:
//
//   node scripts/limpar-bd-dev.mjs            (mostra o que faria, não altera nada)
//   node scripts/limpar-bd-dev.mjs --confirmo (executa mesmo)

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

const confirmado = process.argv.includes('--confirmo')
const connectionString = lerDatabaseUrlLocal()

console.log('Isto vai APAGAR todos os dados de condomínio (frações, membros,')
console.log('movimentos, avisos, assembleias, documentos, auditoria, etc.) em:')
console.log(`  ${mascarar(connectionString)}`)
console.log('Mantém o schema, as migrações e as contas de login intactas.')
console.log('Ação IRREVERSÍVEL.\n')

if (!confirmado) {
  console.log('Modo simulação — nada foi alterado.')
  console.log('Para executar de facto: node scripts/limpar-bd-dev.mjs --confirmo')
  process.exit(0)
}

const client = new pg.Client({ connectionString })
await client.connect()
try {
  await client.query('TRUNCATE TABLE condominio RESTART IDENTITY CASCADE')
  console.log('OK — base de dados de desenvolvimento limpa. As tuas contas de login continuam válidas; ao voltar a entrar, o onboarding pede para criar ou entrar num condomínio, como uma conta nova.')
} finally {
  await client.end()
}
