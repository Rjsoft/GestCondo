import { notFound } from 'next/navigation'
import { getLembretesCobranca } from '@/app/actions/financas'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { VoltarButton } from '@/components/voltar-button'
import { EnviarLembreteButton } from '@/components/financas/enviar-lembrete-button'
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
import { formatData, formatEuro } from '@/lib/format'

export default async function LembretesCobrancaPage() {
  const membro = await requireMembroPagina()
  if (!temPermissaoGestao(membro)) notFound()

  const linhas = await getLembretesCobranca()

  return (
    <div className="flex flex-col gap-6">
      <div className="self-start">
        <VoltarButton />
      </div>
      <PageHeader
        title="Lembretes de cobrança"
        description="Avisos informais por email às frações com quotas em atraso, sem valor legal — distintos da interpelação formal. Reenviar não é bloqueado."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fração</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead className="text-right">Em dívida</TableHead>
                <TableHead>Lembretes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Não há frações com quotas em atraso.
                  </TableCell>
                </TableRow>
              )}
              {linhas.map((l) => (
                <TableRow key={l.fracaoId}>
                  <TableCell className="font-medium whitespace-nowrap">{l.identificacao}</TableCell>
                  <TableCell className="text-muted-foreground">{l.proprietario}</TableCell>
                  <TableCell className="text-right text-red-600">{formatEuro(l.total)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {l.niveis.map((n) =>
                        n.disponivel ? (
                          <div key={n.chave} className="flex items-center gap-1">
                            <EnviarLembreteButton fracaoId={l.fracaoId} escalao={n.chave} label={n.label} />
                            {n.ultimoEnvio && (
                              <Badge variant="outline" className="text-xs">
                                último: {formatData(n.ultimoEnvio)}
                              </Badge>
                            )}
                          </div>
                        ) : null,
                      )}
                      {l.niveis.every((n) => !n.disponivel) && (
                        <span className="text-xs text-muted-foreground">
                          Sem escalão de 31+ dias — ver Antiguidade da dívida
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
