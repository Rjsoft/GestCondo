import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProcessosCobranca } from '@/app/actions/cobranca'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { ESTADO_LABELS, type EstadoCobranca } from '@/lib/cobranca'
import { PageHeader } from '@/components/page-header'
import { VoltarButton } from '@/components/voltar-button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro } from '@/lib/format'

export default async function ProcessosCobrancaPage() {
  const membro = await requireMembroPagina()
  if (!temPermissaoGestao(membro)) notFound()

  const processos = await getProcessosCobranca()

  return (
    <div className="flex flex-col gap-6">
      <div className="self-start">
        <VoltarButton />
      </div>
      <PageHeader
        title="Processos de cobrança"
        description="Acompanhamento administrativo do estado de cobrança por fração — lembretes, interpelação, plano prestacional, até regularizar ou encerrar. Nunca altera movimentos nem saldos."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fração</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Dívida real</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Não há processos de cobrança em curso. Pode abrir um a partir da tab
                    &quot;Dívidas por fração&quot;.
                  </TableCell>
                </TableRow>
              )}
              {processos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium whitespace-nowrap">{p.identificacao}</TableCell>
                  <TableCell className="text-muted-foreground">{p.proprietario}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      render={<Link href={`/financas/processos-cobranca/${p.id}`} />}
                    >
                      {ESTADO_LABELS[p.estado as EstadoCobranca]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-red-600">{formatEuro(p.dividaReal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
