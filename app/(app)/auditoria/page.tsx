import { notFound } from 'next/navigation'
import { getMembroAtual, temConsultaGestao } from '@/lib/session'
import { getAuditLog } from '@/app/actions/auditoria'
import { PageHeader } from '@/components/page-header'
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
import { formatDataHora } from '@/lib/format'

const ACAO_LABEL: Record<string, string> = {
  criar: 'Criou',
  atualizar: 'Atualizou',
  eliminar: 'Eliminou',
  aprovar: 'Aprovou',
  rejeitar: 'Rejeitou',
}

const ENTIDADE_LABEL: Record<string, string> = {
  movimento: 'Movimento financeiro',
  aviso: 'Aviso',
  documento: 'Documento',
  fracao: 'Fração',
  membro: 'Condómino',
  ocorrencia: 'Ocorrência',
}

export default async function AuditoriaPage() {
  const membro = (await getMembroAtual())!
  if (!temConsultaGestao(membro)) notFound()

  const registos = await getAuditLog()

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Registo de ações sensíveis realizadas no condomínio (últimos 200 registos)."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="hidden sm:table-cell">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Ainda não existem registos de auditoria.
                  </TableCell>
                </TableRow>
              )}
              {registos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDataHora(r.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{r.actorNome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ACAO_LABEL[r.acao] ?? r.acao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ENTIDADE_LABEL[r.entidade] ?? r.entidade} #{r.entidadeId}
                  </TableCell>
                  <TableCell className="hidden max-w-sm truncate text-muted-foreground sm:table-cell">
                    {r.detalhes || '—'}
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
