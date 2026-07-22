// Confirma se a base de dados de produção tem todas as migrações já
// aplicadas em desenvolvimento — evita repetir o incidente de 2026-07-21
// (migração aplicada só a dev, /financas em baixo em produção durante
// horas até ser diagnosticado — ver TECHNICAL_DEBT.md D8).
//
// Só lê (nunca escreve). Não guarda nem imprime a connection string de
// produção. Uso:
//
//   PROD_DATABASE_URL="postgresql://...produção, sem pooling..." pnpm db:check-drift
//
// A connection string de produção obtém-se em https://console.neon.tech,
// branch "production" → Connect → sem "-pooler" (ver CLAUDE.md, gotcha
// conhecido: a ligação com pooling falha silenciosamente aqui).

import fs from 'fs'
import pg from 'pg'

function lerDatabaseUrlLocal() {
  const env = fs.readFileSync('.env.local', 'utf8').replace(/^﻿/, '')
  const match = env.match(/DATABASE_URL="?([^"\n]+)"?/)
  if (!match) throw new Error('DATABASE_URL não encontrado em .env.local')
  return match[1]
}

async function listarHashes(connectionString) {
  const client = new pg.Client({ connectionString })
  await client.connect()
  try {
    const { rows } = await client.query(
      'select hash from drizzle.__drizzle_migrations order by id',
    )
    return rows.map((r) => r.hash)
  } finally {
    await client.end()
  }
}

const prodUrl = process.env.PROD_DATABASE_URL
if (!prodUrl) {
  console.error(
    'Defina PROD_DATABASE_URL (connection string de produção, sem pooling) para correr esta verificação.',
  )
  console.error(
    'Exemplo: PROD_DATABASE_URL="postgresql://...prod-sem-pooler..." pnpm db:check-drift',
  )
  process.exit(1)
}

const devUrl = lerDatabaseUrlLocal()

const [hashesDev, hashesProd] = await Promise.all([
  listarHashes(devUrl),
  listarHashes(prodUrl),
])

const emFaltaEmProducao = hashesDev.filter((h) => !hashesProd.includes(h))
const soEmProducao = hashesProd.filter((h) => !hashesDev.includes(h))

console.log(`Dev: ${hashesDev.length} migração(ões) aplicada(s).`)
console.log(`Produção: ${hashesProd.length} migração(ões) aplicada(s).`)

if (emFaltaEmProducao.length === 0 && soEmProducao.length === 0) {
  console.log('OK — produção está alinhada com dev.')
  process.exit(0)
}

if (emFaltaEmProducao.length > 0) {
  console.log(
    `\nATENÇÃO: ${emFaltaEmProducao.length} migração(ões) aplicada(s) em dev mas NÃO em produção.`,
  )
  console.log('Corrigir com: DATABASE_URL="<produção>" pnpm db:migrate')
}

if (soEmProducao.length > 0) {
  console.log(
    `\nInvulgar: ${soEmProducao.length} migração(ões) em produção que não existem em dev — verificar manualmente.`,
  )
}

process.exit(1)
