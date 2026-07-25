// Bloqueia o build da Vercel se existir uma migração no repositório ainda
// não aplicada à base de dados do ambiente que está a ser implantado —
// evita repetir o incidente de 2026-07-25 (Fase B em produção antes da
// migração 0027, /financas em baixo — ver TECHNICAL_DEBT.md D8, 3ª
// ocorrência desta classe de incidente).
//
// Compara CONTAGEM de migrações (jornal do repositório vs.
// drizzle.__drizzle_migrations), não hash. Testado contra a BD de dev
// desta sessão: a migração 0026 tem lá um hash gravado que já não bate
// certo com o hash atual do ficheiro (mesma deriva de fim-de-linha já
// vista antes na 0025) — comparar por hash bloquearia deploys legítimos
// por causa disto. A contagem não sofre desse problema e continua a
// apanhar o cenário real do incidente: uma migração nova no repositório
// que nunca chegou a ser aplicada ao alvo.
//
// Só lê (nunca aplica nem escreve nada). Não substitui o procedimento
// manual de docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md — só impede que uma
// versão incompatível com o schema atual chegue a servir tráfego.
//
// Corre automaticamente em cada build da Vercel via "vercel-build" no
// package.json. Localmente, `pnpm run build` continua a não o executar.

import fs from 'fs'
import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn(
    'check-pending-migrations: DATABASE_URL não definida — a saltar verificação.',
  )
  process.exit(0)
}

const journal = JSON.parse(
  fs.readFileSync('drizzle/meta/_journal.json', 'utf8'),
)
const tagsEsperadas = journal.entries.map((e) => e.tag)

const client = new pg.Client({ connectionString: databaseUrl })

let aplicadas
try {
  await client.connect()
  const { rows } = await client.query(
    'select count(*)::int as n from drizzle.__drizzle_migrations',
  )
  aplicadas = rows[0].n
} catch (erro) {
  console.warn(
    'check-pending-migrations: não foi possível verificar o estado das migrações na base de dados — a saltar verificação.',
  )
  console.warn(`  (${erro.message})`)
  process.exit(0)
} finally {
  await client.end().catch(() => {})
}

const esperadas = tagsEsperadas.length

if (aplicadas >= esperadas) {
  console.log(
    `check-pending-migrations: OK — ${aplicadas} migração(ões) aplicada(s) nesta base de dados (${esperadas} no repositório).`,
  )
  process.exit(0)
}

const emFalta = esperadas - aplicadas
console.error(
  `check-pending-migrations: ${aplicadas} migração(ões) aplicada(s) nesta base de dados, mas o repositório tem ${esperadas}.`,
)
console.error(
  `Provavelmente em falta (últimas ${emFalta} do jornal, assumindo aplicação por ordem):`,
)
for (const tag of tagsEsperadas.slice(-emFalta)) {
  console.error(`  - ${tag}`)
}
console.error('')
console.error(
  'A aplicar antes de continuar este deploy — ver docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md.',
)
console.error(
  'Build bloqueado deliberadamente: publicar código que espera este schema sem a migração aplicada quebraria a aplicação em produção.',
)
process.exit(1)
