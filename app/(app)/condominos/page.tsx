import { notFound } from 'next/navigation'
import {
  getMembroAtual,
  temConsultaGestao,
  temPermissaoGestao,
} from '@/lib/session'
import { getMembros } from '@/app/actions/fracoes'
import { PageHeader } from '@/components/page-header'
import { PerfilSelect } from '@/components/condominos/perfil-select'
import { EditarMembroDialog } from '@/components/condominos/editar-membro-dialog'
import { MembroStatusActions } from '@/components/condominos/membro-status-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatData } from '@/lib/format'
import { PERFIL_LABEL, type Perfil } from '@/lib/session'
import { UserCheck } from 'lucide-react'

export default async function CondominosPage() {
  const membro = (await getMembroAtual())!
  if (!temConsultaGestao(membro)) notFound()
  const podeGerir = temPermissaoGestao(membro)

  const todos = await getMembros()
  const pendentes = todos.filter((m) => m.estado === 'pendente')
  const membros = todos.filter((m) => m.estado === 'aprovado')

  return (
    <div>
      <PageHeader
        title="Condóminos"
        description="Membros do condomínio e respetivos perfis de acesso."
      />

      {pendentes.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-4 w-4 text-primary" />
              Pedidos de acesso pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendentes.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{m.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.email} · registado em {formatData(m.createdAt)}
                  </p>
                </div>
                {podeGerir && <MembroStatusActions id={m.id} />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Fração</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Membro desde
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {membros.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Ainda não existem condóminos aprovados.
                  </TableCell>
                </TableRow>
              )}
              {membros.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {m.email}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {m.fracao || '—'}
                  </TableCell>
                  <TableCell>
                    {podeGerir ? (
                      <PerfilSelect id={m.id} perfil={m.perfil} />
                    ) : (
                      PERFIL_LABEL[m.perfil as Perfil]
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatData(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    {podeGerir && (
                      <EditarMembroDialog
                        id={m.id}
                        nome={m.nome}
                        fracao={m.fracao}
                        telefone={m.telefone}
                      />
                    )}
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
