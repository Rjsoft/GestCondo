import { notFound } from 'next/navigation'
import { getAntiguidadeDivida } from '@/app/actions/financas'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { VoltarButton } from '@/components/voltar-button'
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
import { ESCALOES_ANTIGUIDADE } from '@/lib/antiguidade-divida'

export default async function AntiguidadeDividaPage() {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()

  const [linhas, condominio] = await Promise.all([
    getAntiguidadeDivida(),
    getCondominioAtual(membro.condominioId),
  ])

  const totalGeral = linhas.reduce((s, l) => s + l.total, 0)
  const totalPorEscalao = Object.fromEntries(
    ESCALOES_ANTIGUIDADE.map((e) => [
      e.chave,
      linhas.reduce((s, l) => s + l.escaloes[e.chave], 0),
    ]),
  )

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <div className="mb-4 flex justify-between print:hidden">
        <VoltarButton />
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Antiguidade da Dívida"
            subtitulo="Quotas em atraso, por escalão de dias"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Fração</TableHead>
                {ESCALOES_ANTIGUIDADE.map((e) => (
                  <TableHead key={e.chave} className="text-right text-xs">
                    {e.label}
                  </TableHead>
                ))}
                <TableHead className="text-right text-xs">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Ainda não existem frações registadas.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((l) => (
                <TableRow key={l.fracaoId}>
                  <TableCell className="p-1 text-xs font-medium whitespace-nowrap">
                    {l.identificacao}
                    {l.proprietario && (
                      <span className="block font-normal text-muted-foreground">
                        {l.proprietario}
                      </span>
                    )}
                  </TableCell>
                  {ESCALOES_ANTIGUIDADE.map((e) => (
                    <TableCell key={e.chave} className="p-1 text-right text-xs">
                      {l.escaloes[e.chave] > 0 ? formatEuro(l.escaloes[e.chave]) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="p-1 text-right text-xs font-medium">
                    {l.total > 0 ? formatEuro(l.total) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {linhas.length > 0 && (
                <TableRow>
                  <TableCell className="p-1 text-xs font-bold">Total</TableCell>
                  {ESCALOES_ANTIGUIDADE.map((e) => (
                    <TableCell key={e.chave} className="p-1 text-right text-xs font-bold">
                      {formatEuro(totalPorEscalao[e.chave])}
                    </TableCell>
                  ))}
                  <TableCell className="p-1 text-right text-xs font-bold">
                    {formatEuro(totalGeral)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <p className="text-center text-xs text-muted-foreground">
            Só inclui quotas com data de vencimento já passada e por pagar —
            documento gerado automaticamente pelo GestCondo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
