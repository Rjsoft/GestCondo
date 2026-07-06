import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'node:path'

// Config separada dos testes unitários normais (vitest.config.ts) porque
// estes testes precisam de uma ligação real a PostgreSQL (DATABASE_URL).
// Corridos via `pnpm test:db` — nunca fazem parte de `pnpm test`/CI, para
// não obrigar a ter uma base de dados disponível só para correr o lint/
// build. Ver lib/db/tenant-isolation.dbtest.ts.
export default defineConfig(({ mode }) => {
  // Carrega .env/.env.local (onde fica o DATABASE_URL real de
  // desenvolvimento) para process.env, tal como o Next.js faz.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    test: {
      environment: 'node',
      include: ['**/*.dbtest.ts'],
      exclude: ['node_modules/**', '.next/**'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  }
})
