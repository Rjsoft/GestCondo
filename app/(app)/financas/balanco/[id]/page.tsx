import { notFound } from 'next/navigation'
import { getBalancoOrcamento } from '@/app/actions/orcamentos'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import { formatEuro } from '@/lib/format'

export default async function BalancoOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()
  const { id } = await params
  const orcamentoId = Number(id)
  if (!Number.isInteger(orcamentoId)) notFound()

  let balanco: Awaited<ReturnType<typeof getBalancoOrcamento>>
  try {
    balanco = await getBalancoOrcamento(orcamentoId)
  } catch {
    notFound()
  }

  const condominio = await getCondominioAtual(membro.condominioId)
  const { orcamento, receitasReais, despesasReais, saldoReal, despesasPorCategoria, desvio, desvioPercent } =
    balanco

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Balanço — Orçamento aprovado vs. contas reais"
            subtitulo={`Exercício de ${orcamento.ano}`}
          />

          <div className="grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Orçamento aprovado</p>
              <p className="font-serif font-bold text-foreground">
                {formatEuro(orcamento.valorAnual)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receitas reais</p>
              <p className="font-serif font-bold text-emerald-600">{formatEuro(receitasReais)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas reais</p>
              <p className="font-serif font-bold text-red-600">{formatEuro(despesasReais)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo real</p>
              <p
                className={`font-serif font-bold ${saldoReal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {formatEuro(saldoReal)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-b border-border pb-6">
            <p className="text-xs text-muted-foreground">
              Desvio (despesas reais − orçamento aprovado)
            </p>
            <p
              className={`font-serif text-lg font-bold ${desvio > 0 ? 'text-red-600' : 'text-emerald-600'}`}
            >
              {desvio > 0 ? '+' : ''}
              {formatEuro(desvio)}
              {desvioPercent !== null && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({desvio > 0 ? '+' : ''}
                  {desvioPercent.toFixed(1)}%)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {desvio > 0
                ? 'As despesas reais ultrapassaram o orçamento aprovado.'
                : 'As despesas reais ficaram dentro do orçamento aprovado.'}
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-sm font-bold text-foreground">
              Despesas reais por categoria
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesasPorCategoria.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                      Sem despesas lançadas em {orcamento.ano}.
                    </TableCell>
                  </TableRow>
                )}
                {despesasPorCategoria.map((d) => (
                  <TableRow key={d.categoria}>
                    <TableCell className="font-medium">{d.categoria}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatEuro(d.valor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo — não substitui
            documentos contabilísticos oficiais. O orçamento aprovado é
            comparado como um valor único; não discrimina ainda por rubrica.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
