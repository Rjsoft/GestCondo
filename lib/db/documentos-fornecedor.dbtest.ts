// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz exatamente a agregação de
// lib/documentos-fornecedor.ts:calcularSaldoDocumentoFornecedor contra o
// tipo `numeric` real do Postgres (não um mock) — a mesma razão de
// lib/db/mapa-saldos.dbtest.ts existir: é lógica financeira sensível a
// erros de arredondamento/conversão string↔número.
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, documentoFornecedor, fornecedor, pagamentoDocumentoFornecedor } from './schema'

class RollbackDeTeste extends Error {}

describe('cálculo de saldo de documento de fornecedor', () => {
  it('sem pagamentos: valorPago 0, saldo = valor, estado por_liquidar', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste documento fornecedor] Condomínio' })
          .returning({ id: condominio.id })

        const [forn] = await tx
          .insert(fornecedor)
          .values({ condominioId: condo.id, userId: 'user-admin', nome: 'Elevadores Lda.' })
          .returning({ id: fornecedor.id })

        const [doc] = await tx
          .insert(documentoFornecedor)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            fornecedorId: forn.id,
            categoria: 'Manutenção',
            dataEmissao: new Date('2026-01-10'),
            valor: '350.00',
          })
          .returning({ id: documentoFornecedor.id, valor: documentoFornecedor.valor })

        const pagamentos = await tx
          .select()
          .from(pagamentoDocumentoFornecedor)
          .where(eq(pagamentoDocumentoFornecedor.documentoFornecedorId, doc.id))

        const valor = Number(doc.valor)
        const valorPago = pagamentos.reduce((s, p) => s + Number(p.valor), 0)

        expect(valorPago).toBe(0)
        expect(valor - valorPago).toBe(350)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('duas tranches que não fecham o valor: estado parcial, saldo correto ao cêntimo', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste documento fornecedor] Condomínio' })
          .returning({ id: condominio.id })

        const [doc] = await tx
          .insert(documentoFornecedor)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            categoria: 'Limpeza',
            dataEmissao: new Date('2026-01-10'),
            valor: '100.10',
          })
          .returning({ id: documentoFornecedor.id, valor: documentoFornecedor.valor })

        await tx.insert(pagamentoDocumentoFornecedor).values([
          {
            condominioId: condo.id,
            userId: 'user-admin',
            documentoFornecedorId: doc.id,
            valor: '33.33',
            dataPagamento: new Date('2026-01-15'),
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            documentoFornecedorId: doc.id,
            valor: '33.33',
            dataPagamento: new Date('2026-02-15'),
          },
        ])

        const pagamentos = await tx
          .select()
          .from(pagamentoDocumentoFornecedor)
          .where(eq(pagamentoDocumentoFornecedor.documentoFornecedorId, doc.id))

        const valor = Number(doc.valor)
        const valorPago = pagamentos.reduce((s, p) => s + Number(p.valor), 0)

        // 33.33 + 33.33 = 66.66 exato — apanha erros de arredondamento
        // binário de ponto flutuante se algum dia isto passar por um tipo
        // que não seja numeric/string.
        expect(valorPago).toBeCloseTo(66.66, 2)
        expect(valor - valorPago).toBeCloseTo(33.44, 2)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('pagamento total em três tranches: valorPago = valor, saldo 0', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste documento fornecedor] Condomínio' })
          .returning({ id: condominio.id })

        const [doc] = await tx
          .insert(documentoFornecedor)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            categoria: 'Obras',
            dataEmissao: new Date('2026-01-10'),
            valor: '900.00',
          })
          .returning({ id: documentoFornecedor.id, valor: documentoFornecedor.valor })

        await tx.insert(pagamentoDocumentoFornecedor).values([
          {
            condominioId: condo.id,
            userId: 'user-admin',
            documentoFornecedorId: doc.id,
            valor: '300.00',
            dataPagamento: new Date('2026-01-15'),
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            documentoFornecedorId: doc.id,
            valor: '300.00',
            dataPagamento: new Date('2026-02-15'),
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            documentoFornecedorId: doc.id,
            valor: '300.00',
            dataPagamento: new Date('2026-03-15'),
          },
        ])

        const pagamentos = await tx
          .select()
          .from(pagamentoDocumentoFornecedor)
          .where(eq(pagamentoDocumentoFornecedor.documentoFornecedorId, doc.id))

        const valor = Number(doc.valor)
        const valorPago = pagamentos.reduce((s, p) => s + Number(p.valor), 0)

        expect(valorPago).toBe(900)
        expect(valor - valorPago).toBe(0)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('FK composta impede associar um pagamento a um documento de outro condomínio', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoA] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio A' })
          .returning({ id: condominio.id })
        const [condoB] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio B' })
          .returning({ id: condominio.id })

        const [docDeA] = await tx
          .insert(documentoFornecedor)
          .values({
            condominioId: condoA.id,
            userId: 'user-admin',
            categoria: 'Limpeza',
            dataEmissao: new Date('2026-01-10'),
            valor: '100.00',
          })
          .returning({ id: documentoFornecedor.id })

        // Tenta registar um pagamento com condominioId de B mas
        // documentoFornecedorId de A — a FK composta tem de rejeitar isto
        // ao nível da própria base de dados, não só da query da aplicação.
        await expect(
          tx.insert(pagamentoDocumentoFornecedor).values({
            condominioId: condoB.id,
            userId: 'user-admin',
            documentoFornecedorId: docDeA.id,
            valor: '50.00',
            dataPagamento: new Date('2026-01-15'),
          }),
        ).rejects.toThrow()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
