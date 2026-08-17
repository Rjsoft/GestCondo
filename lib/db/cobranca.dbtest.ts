// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz a lógica de app/actions/cobranca.ts diretamente (as próprias
// server actions exigem sessão via requireAdmin/requireAcessoFinanceiro,
// não testáveis fora de um pedido — mesmo padrão já usado em
// lib/db/rubricas-orcamento-anterior.dbtest.ts e outros *.dbtest.ts).
import { createHash } from 'node:crypto'
import { and, asc, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import {
  condominio,
  documentoCobrancaEmitido,
  fracao,
  movimento,
  prestacao,
  processoCobranca,
  processoCobrancaTransicao,
} from './schema'

class RollbackDeTeste extends Error {}

async function rollback(fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>) {
  await expect(
    db.transaction(async (tx) => {
      await fn(tx)
      throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
    }),
  ).rejects.toThrow(RollbackDeTeste)
}

describe('processo de cobrança — nunca toca no motor financeiro', () => {
  it('abrir processo, criar plano prestacional e marcar prestação cumprida não alteram nenhum movimento', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste cobrança] Condomínio' })
        .returning({ id: condominio.id })
      const [frac] = await tx
        .insert(fracao)
        .values({ condominioId: condo.id, userId: 'user-admin', identificacao: 'T1', proprietario: 'Ana Teste', permilagem: '100' })
        .returning({ id: fracao.id })
      await tx.insert(movimento).values({
        condominioId: condo.id,
        fracaoId: frac.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Quota em atraso',
        valor: '300.00',
        data: new Date('2026-06-01'),
        destino: 'geral',
        pago: false,
      })

      const antes = await tx.select().from(movimento).where(eq(movimento.fracaoId, frac.id))

      const [processo] = await tx
        .insert(processoCobranca)
        .values({ condominioId: condo.id, fracaoId: frac.id, estado: 'em_atraso', abertoPorUserId: 'user-admin' })
        .returning({ id: processoCobranca.id })
      const [p1] = await tx
        .insert(prestacao)
        .values({ processoCobrancaId: processo.id, numero: 1, dataPrevista: new Date('2026-07-01'), valor: '100.00' })
        .returning({ id: prestacao.id })
      await tx.insert(prestacao).values({
        processoCobrancaId: processo.id,
        numero: 2,
        dataPrevista: new Date('2026-08-01'),
        valor: '100.00',
      })
      await tx.update(prestacao).set({ estado: 'cumprida', cumpridaEm: new Date() }).where(eq(prestacao.id, p1.id))
      await tx
        .update(processoCobranca)
        .set({ estado: 'acordo_prestacional' })
        .where(eq(processoCobranca.id, processo.id))

      const depois = await tx.select().from(movimento).where(eq(movimento.fracaoId, frac.id))
      expect(depois).toEqual(antes)
    })
  })

  it('cada transição fica registada no histórico, e as anteriores nunca desaparecem', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste cobrança] Condomínio' })
        .returning({ id: condominio.id })
      const [frac] = await tx
        .insert(fracao)
        .values({ condominioId: condo.id, userId: 'user-admin', identificacao: 'T1', proprietario: 'Ana Teste', permilagem: '100' })
        .returning({ id: fracao.id })
      const [processo] = await tx
        .insert(processoCobranca)
        .values({ condominioId: condo.id, fracaoId: frac.id, estado: 'em_atraso', abertoPorUserId: 'user-admin' })
        .returning({ id: processoCobranca.id })

      const cadeia: { anterior: string | null; novo: string }[] = [
        { anterior: null, novo: 'em_atraso' },
        { anterior: 'em_atraso', novo: 'interpelacao_formal' },
        { anterior: 'interpelacao_formal', novo: 'acordo_prestacional' },
      ]
      for (const t of cadeia) {
        await tx.insert(processoCobrancaTransicao).values({
          processoCobrancaId: processo.id,
          estadoAnterior: t.anterior,
          estadoNovo: t.novo,
          userId: 'user-admin',
          autorNome: 'Admin Teste',
        })
      }

      const historico = await tx
        .select()
        .from(processoCobrancaTransicao)
        .where(eq(processoCobrancaTransicao.processoCobrancaId, processo.id))
        .orderBy(asc(processoCobrancaTransicao.id))

      expect(historico).toHaveLength(3)
      expect(historico.map((h) => h.estadoNovo)).toEqual(['em_atraso', 'interpelacao_formal', 'acordo_prestacional'])
      expect(historico[0].estadoAnterior).toBeNull()
    })
  })

  it('documento emitido preserva o snapshot mesmo depois de o proprietário da fração mudar', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste cobrança] Condomínio' })
        .returning({ id: condominio.id })
      const [frac] = await tx
        .insert(fracao)
        .values({ condominioId: condo.id, userId: 'user-admin', identificacao: 'T1', proprietario: 'Ana Teste', permilagem: '100' })
        .returning({ id: fracao.id })

      const snapshot = { fracao: { identificacao: 'T1', proprietario: 'Ana Teste' }, totalDivida: 300 }
      const snapshotJson = JSON.stringify(snapshot)
      const snapshotHash = createHash('sha256').update(snapshotJson).digest('hex')

      const [doc] = await tx
        .insert(documentoCobrancaEmitido)
        .values({
          condominioId: condo.id,
          fracaoId: frac.id,
          tipo: 'interpelacao',
          userId: 'user-admin',
          autorNome: 'Admin Teste',
          destinatario: 'Ana Teste',
          valorDivida: '300.00',
          prazoDias: 15,
          templateVersao: 'interpelacao-v1',
          snapshotJson,
          snapshotHash,
        })
        .returning({ id: documentoCobrancaEmitido.id })

      // O proprietário "muda de mãos" depois do documento ter sido emitido.
      await tx.update(fracao).set({ proprietario: 'Bruno Novo' }).where(eq(fracao.id, frac.id))

      const [guardado] = await tx
        .select()
        .from(documentoCobrancaEmitido)
        .where(eq(documentoCobrancaEmitido.id, doc.id))
      const [fracaoAtual] = await tx.select({ proprietario: fracao.proprietario }).from(fracao).where(eq(fracao.id, frac.id))

      expect(fracaoAtual.proprietario).toBe('Bruno Novo')
      expect(guardado.destinatario).toBe('Ana Teste')
      expect(JSON.parse(guardado.snapshotJson).fracao.proprietario).toBe('Ana Teste')
      expect(guardado.snapshotHash).toBe(createHash('sha256').update(guardado.snapshotJson).digest('hex'))
    })
  })

  it('só permite um processo não terminal por fração de cada vez (índice único parcial)', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste cobrança] Condomínio' })
        .returning({ id: condominio.id })
      const [frac] = await tx
        .insert(fracao)
        .values({ condominioId: condo.id, userId: 'user-admin', identificacao: 'T1', proprietario: 'Ana Teste', permilagem: '100' })
        .returning({ id: fracao.id })

      const [processo1] = await tx
        .insert(processoCobranca)
        .values({ condominioId: condo.id, fracaoId: frac.id, estado: 'em_atraso', abertoPorUserId: 'user-admin' })
        .returning({ id: processoCobranca.id })

      // Savepoint próprio: a violação do índice único aborta a subtransação,
      // não a transação exterior (que continua a ser usada a seguir).
      await expect(
        tx.transaction(async (savepoint) =>
          savepoint.insert(processoCobranca).values({
            condominioId: condo.id,
            fracaoId: frac.id,
            estado: 'interpelacao_formal',
            abertoPorUserId: 'user-admin',
          }),
        ),
      ).rejects.toThrow()

      // Depois de terminar o primeiro, já é possível abrir um segundo.
      await tx.update(processoCobranca).set({ estado: 'encerrado' }).where(eq(processoCobranca.id, processo1.id))
      await expect(
        tx.insert(processoCobranca).values({
          condominioId: condo.id,
          fracaoId: frac.id,
          estado: 'em_atraso',
          abertoPorUserId: 'user-admin',
        }),
      ).resolves.not.toThrow()
    })
  })

  it('isolamento multi-tenant: processos de um condomínio nunca aparecem numa consulta de outro', async () => {
    await rollback(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste cobrança] Condomínio A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste cobrança] Condomínio B' })
        .returning({ id: condominio.id })
      const [fracA] = await tx
        .insert(fracao)
        .values({ condominioId: condoA.id, userId: 'user-admin', identificacao: 'A1', proprietario: 'Ana A', permilagem: '100' })
        .returning({ id: fracao.id })
      const [fracB] = await tx
        .insert(fracao)
        .values({ condominioId: condoB.id, userId: 'user-admin', identificacao: 'B1', proprietario: 'Bruno B', permilagem: '100' })
        .returning({ id: fracao.id })

      await tx
        .insert(processoCobranca)
        .values({ condominioId: condoA.id, fracaoId: fracA.id, estado: 'em_atraso', abertoPorUserId: 'user-admin' })
      await tx
        .insert(processoCobranca)
        .values({ condominioId: condoB.id, fracaoId: fracB.id, estado: 'em_atraso', abertoPorUserId: 'user-admin' })

      const processosDeA = await tx
        .select({ fracaoId: processoCobranca.fracaoId })
        .from(processoCobranca)
        .where(eq(processoCobranca.condominioId, condoA.id))

      expect(processosDeA).toHaveLength(1)
      expect(processosDeA[0].fracaoId).toBe(fracA.id)
    })
  })

  it('"regularizado" tem de se basear na dívida real (movimentos), não no total do plano prestacional', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste cobrança] Condomínio' })
        .returning({ id: condominio.id })
      const [frac] = await tx
        .insert(fracao)
        .values({ condominioId: condo.id, userId: 'user-admin', identificacao: 'T1', proprietario: 'Ana Teste', permilagem: '100' })
        .returning({ id: fracao.id })
      await tx.insert(movimento).values({
        condominioId: condo.id,
        fracaoId: frac.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Quota em atraso',
        valor: '300.00',
        data: new Date('2026-06-01'),
        destino: 'geral',
        pago: false,
      })
      const [processo] = await tx
        .insert(processoCobranca)
        .values({ condominioId: condo.id, fracaoId: frac.id, estado: 'acordo_prestacional', abertoPorUserId: 'user-admin' })
        .returning({ id: processoCobranca.id })
      // Plano "fecha as contas" na aparência (200 previstos, mas a dívida
      // real continua a ser 300 — a prestação em falta nunca foi criada).
      await tx
        .insert(prestacao)
        .values({ processoCobrancaId: processo.id, numero: 1, dataPrevista: new Date(), valor: '200.00', estado: 'cumprida' })

      const dividasNaoPagas = await tx
        .select({ valor: movimento.valor })
        .from(movimento)
        .where(and(eq(movimento.fracaoId, frac.id), eq(movimento.pago, false)))
      const dividaReal = dividasNaoPagas.reduce((s, m) => s + Number(m.valor), 0)

      // Reproduz exatamente a regra de app/actions/cobranca.ts:aplicarTransicao.
      const podeRegularizar = dividaReal === 0
      expect(podeRegularizar).toBe(false)
      expect(dividaReal).toBe(300)
    })
  })
})
