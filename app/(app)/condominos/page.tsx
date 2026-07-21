import { notFound } from 'next/navigation'
import {
  requireMembroPagina,
  temConsultaGestao,
  temPermissaoGestao,
} from '@/lib/session'
import { getFracoes, getMembros } from '@/app/actions/fracoes'
import { PageHeader } from '@/components/page-header'
import { PerfilSelect } from '@/components/condominos/perfil-select'
import { EditarMembroDialog } from '@/components/condominos/editar-membro-dialog'
import { MembroStatusActions } from '@/components/condominos/membro-status-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchInput } from '@/components/ui/search-input'
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

export default async function CondominosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temConsultaGestao(membro)) notFound()
  const podeGerir = temPermissaoGestao(membro)
  const search = ((await searchParams).q ?? '').trim().toLowerCase()

  const [todos, fracoes] = await Promise.all([getMembros(), getFracoes()])
  const pendentes = todos.filter((m) => m.estado === 'pendente')
  const aprovados = todos.filter((m) => m.estado === 'aprovado')
  // Pesquisa em memória: número de condóminos por condomínio é tipicamente
  // pequeno (dezenas), não justifica paginação no servidor. Não filtra os
  // pedidos pendentes, para não esconder acidentalmente uma aprovação por fazer.
  const membros = search
    ? aprovados.filter(
        (m) => m.nome.toLowerCase().includes(search) || m.email.toLowerCase().includes(search),
      )
    : aprovados
  const fracaoPorId = new Map(fracoes.map((f) => [f.id, f.identificacao]))

  return (
    <div>
      <PageHeader
        title="Condóminos"
        description="Membros do condomínio e respetivos perfis de acesso."
      />

      <div className="mb-4">
        <SearchInput placeholder="Pesquisar por nome ou email..." />
      </div>

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
                    {search ? 'Nenhum condómino encontrado.' : 'Ainda não existem condóminos aprovados.'}
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
                    {m.fracaoId ? (fracaoPorId.get(m.fracaoId) ?? '—') : '—'}
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
                        fracaoId={m.fracaoId}
                        telefone={m.telefone}
                        fracoes={fracoes.map((f) => ({ id: f.id, identificacao: f.identificacao }))}
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
