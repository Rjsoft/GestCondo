// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Fixture dentro de uma transação sempre revertida.
//
// Verifica a correção de SECURITY_AUDIT.md S13: contactos pessoais
// (email/telefone) de uma fração só são devolvidos a quem gere o
// condomínio ou audita — reproduz exatamente a lógica de pós-processamento
// de app/actions/fracoes.ts:getFracoes.
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, fracao } from './schema'
import { temConsultaGestao } from '../perfis'
import type { MembroSessao } from '../perfis'

class RollbackDeTeste extends Error {}

function esconderContactosSeNecessario<
  T extends { contactoEmail: string | null; contactoTelefone: string | null },
>(linhas: T[], m: MembroSessao) {
  if (temConsultaGestao(m)) return linhas
  return linhas.map((f) => ({ ...f, contactoEmail: null, contactoTelefone: null }))
}

function membro(perfil: MembroSessao['perfil'], condominioId: number): MembroSessao {
  return {
    id: 1,
    condominioId,
    userId: 'user-1',
    nome: 'Teste',
    email: 'teste@exemplo.pt',
    perfil,
    estado: 'aprovado',
    fracaoId: null,
    isSuperAdmin: false,
  }
}

describe('privacidade de contactos das frações', () => {
  it('condómino comum não vê contactos de outros proprietários; admin/gestor/auditor veem', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste privacidade] Condomínio' })
          .returning({ id: condominio.id })

        await tx.insert(fracao).values({
          condominioId: condo.id,
          userId: 'user-admin',
          identificacao: '1ºEsq',
          proprietario: 'Maria Silva',
          permilagem: '500',
          contactoEmail: 'maria@exemplo.pt',
          contactoTelefone: '912345678',
        })

        const linhas = await tx.select().from(fracao).where(eq(fracao.condominioId, condo.id))

        for (const perfil of ['admin', 'gestor', 'auditor'] as const) {
          const resultado = esconderContactosSeNecessario(linhas, membro(perfil, condo.id))
          expect(resultado[0].contactoEmail).toBe('maria@exemplo.pt')
          expect(resultado[0].contactoTelefone).toBe('912345678')
        }

        for (const perfil of ['condomino', 'inquilino', 'fornecedor'] as const) {
          const resultado = esconderContactosSeNecessario(linhas, membro(perfil, condo.id))
          expect(resultado[0].contactoEmail).toBeNull()
          expect(resultado[0].contactoTelefone).toBeNull()
          // O resto da linha (identificação, proprietário, permilagem)
          // continua visível — só os contactos pessoais são escondidos.
          expect(resultado[0].identificacao).toBe('1ºEsq')
          expect(resultado[0].proprietario).toBe('Maria Silva')
        }

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
