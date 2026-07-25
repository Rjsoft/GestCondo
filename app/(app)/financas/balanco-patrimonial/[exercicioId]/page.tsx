import { notFound } from 'next/navigation'
import { getBalancoPatrimonial } from '@/app/actions/contas-financeiras'
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

export default async function BalancoPatrimonialPage({
  params,
}: {
  params: Promise<{ exercicioId: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()
  const { exercicioId } = await params
  const id = Number(exercicioId)
  if (!Number.isInteger(id)) notFound()

  let balanco: Awaited<ReturnType<typeof getBalancoPatrimonial>>
  try {
    balanco = await getBalancoPatrimonial(id)
  } catch {
    notFound()
  }

  const condominio = await getCondominioAtual(membro.condominioId)
  const { exercicio, ativo, passivo, situacaoLiquida } = balanco

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Balanço patrimonial"
            subtitulo={`Exercício: ${exercicio.designacao}`}
          />

          <div className="grid grid-cols-1 gap-3 border-b border-border pb-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Ativo</p>
              <p className="font-serif text-lg font-bold text-emerald-600">
                {formatEuro(ativo.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Passivo</p>
              <p className="font-serif text-lg font-bold text-red-600">
                {formatEuro(passivo.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Situação líquida</p>
              <p className="font-serif text-lg font-bold text-foreground">
                {formatEuro(situacaoLiquida.total)}
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-sm font-bold text-foreground">Ativo</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ativo.contas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>Disponibilidades — {c.nome}</TableCell>
                    <TableCell className="text-right">{formatEuro(c.saldo)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>Dívidas de condóminos (quotas por receber)</TableCell>
                  <TableCell className="text-right">{formatEuro(ativo.dividasCondominos)}</TableCell>
                </TableRow>
                <TableRow className="font-semibold">
                  <TableCell>Total do Ativo</TableCell>
                  <TableCell className="text-right">{formatEuro(ativo.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-sm font-bold text-foreground">Passivo</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Dívidas a fornecedores</TableCell>
                  <TableCell className="text-right">{formatEuro(passivo.dividasFornecedores)}</TableCell>
                </TableRow>
                <TableRow className="font-semibold">
                  <TableCell>Total do Passivo</TableCell>
                  <TableCell className="text-right">{formatEuro(passivo.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-sm font-bold text-foreground">Situação líquida</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Fundo de reserva</TableCell>
                  <TableCell className="text-right">{formatEuro(situacaoLiquida.fundoReserva)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Resultados acumulados</TableCell>
                  <TableCell className="text-right">
                    {formatEuro(situacaoLiquida.resultadosAcumulados)}
                  </TableCell>
                </TableRow>
                <TableRow className="font-semibold">
                  <TableCell>Total da Situação Líquida</TableCell>
                  <TableCell className="text-right">{formatEuro(situacaoLiquida.total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo — não substitui
            documentos contabilísticos oficiais. Não inclui adiantamentos de
            condóminos como passivo próprio.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
