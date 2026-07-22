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
import { formatEuro, formatDataHora } from '@/lib/format'
import { Building2 } from 'lucide-react'

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
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-foreground">
                {condominio?.nome ?? 'Condomínio'}
              </p>
              {condominio?.morada && (
                <p className="text-xs text-muted-foreground">{condominio.morada}</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-serif text-xl font-bold text-foreground">
              Balanço — Orçamento aprovado vs. contas reais de {orcamento.ano}
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerado em {formatDataHora(new Date())}
            </p>
          </div>

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
