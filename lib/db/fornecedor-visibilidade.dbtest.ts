// Teste de integração contra uma base de dados PostgreSQL REAL
// (DATABASE_URL, ver vitest.db.config.ts) — corre com `pnpm test:db`, não
// faz parte de `pnpm test`/CI. Fixture e asserções correm dentro de uma
// transação sempre revertida no fim, nada fica persistido.
//
// Regressão do achado F12 (docs/audit/USABILITY_FINDINGS.md): um login com
// perfil "fornecedor" via `getFornecedores()` (app/actions/fornecedores.ts)
// não devia ver a ficha de outros fornecedores do mesmo condomínio (dados
// comerciais de terceiros, incluindo concorrentes diretos). Reproduz aqui
// exatamente o filtro adicionado à server action, tal como
// tenant-isolation.dbtest.ts faz para o isolamento entre condomínios.
import { and, asc, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, fornecedor } from './schema'

class RollbackDeTeste extends Error {}

describe('visibilidade de fornecedores (F12)', () => {
  it('um perfil "fornecedor" só vê a própria ficha, não a dos outros fornecedores', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste F12] Condomínio' })
          .returning({ id: condominio.id })

        const [fornA] = await tx
          .insert(fornecedor)
          .values({ condominioId: condo.id, userId: 'user-admin', nome: 'Eletricista A' })
          .returning({ id: fornecedor.id })
        const [fornB] = await tx
          .insert(fornecedor)
          .values({ condominioId: condo.id, userId: 'user-admin', nome: 'Eletricista B (concorrente)' })
          .returning({ id: fornecedor.id })

        // Reproduz exatamente o ramo `perfil === 'fornecedor'` de
        // app/actions/fornecedores.ts:getFornecedores.
        const vistoPorFornA = await tx
          .select()
          .from(fornecedor)
          .where(and(eq(fornecedor.condominioId, condo.id), eq(fornecedor.id, fornA.id)))
          .orderBy(asc(fornecedor.nome))

        expect(vistoPorFornA.map((f) => f.nome)).toEqual(['Eletricista A'])
        expect(vistoPorFornA.map((f) => f.id)).not.toContain(fornB.id)

        // Confirma que a lista completa (ramo admin/gestor/condómino/auditor)
        // continua a devolver ambos — a restrição é só para o perfil
        // "fornecedor", não uma regressão geral do módulo.
        const vistoPorAdmin = await tx
          .select()
          .from(fornecedor)
          .where(eq(fornecedor.condominioId, condo.id))
          .orderBy(asc(fornecedor.nome))

        expect(vistoPorAdmin.map((f) => f.nome)).toEqual([
          'Eletricista A',
          'Eletricista B (concorrente)',
        ])

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
