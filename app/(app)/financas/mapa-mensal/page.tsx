import { notFound } from 'next/navigation'
import { getMapaMensalQuotas } from '@/app/actions/financas'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro } from '@/lib/format'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default async function MapaMensalPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()

  const anoParam = Number((await searchParams).ano)
  const ano = Number.isInteger(anoParam) && anoParam > 2000 ? anoParam : new Date().getFullYear()

  const [linhas, condominio] = await Promise.all([
    getMapaMensalQuotas(ano),
    getCondominioAtual(membro.condominioId),
  ])

  const totalAno = linhas.reduce((s, l) => s + l.totalAno, 0)

  return (
    <div className="mx-auto max-w-5xl print:max-w-none">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Mapa Mensal de Quotas"
            subtitulo={`Ano de ${ano}`}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Fração</TableHead>
                {MESES.map((mes) => (
                  <TableHead key={mes} className="text-right text-xs">
                    {mes}
                  </TableHead>
                ))}
                <TableHead className="text-right text-xs">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="py-10 text-center text-muted-foreground">
                    Ainda não existem frações registadas.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((l) => (
                <TableRow key={l.fracaoId}>
                  <TableCell className="p-1 text-xs font-medium whitespace-nowrap">
                    {l.letra ? `${l.letra} — ${l.identificacao}` : l.identificacao}
                  </TableCell>
                  {l.meses.map((c) => (
                    <TableCell key={c.mes} className="p-1 text-right text-xs">
                      {c.valor > 0 ? formatEuro(c.valor) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="p-1 text-right text-xs font-medium">
                    {formatEuro(l.totalAno)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="p-1 text-xs font-bold">Total</TableCell>
                {MESES.map((_, mes) => (
                  <TableCell key={mes} className="p-1 text-right text-xs font-bold">
                    {formatEuro(linhas.reduce((s, l) => s + (l.meses[mes]?.valor ?? 0), 0))}
                  </TableCell>
                ))}
                <TableCell className="p-1 text-right text-xs font-bold">{formatEuro(totalAno)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo — não substitui
            documentos contabilísticos oficiais.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
