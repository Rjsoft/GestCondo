import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { getFornecedores } from '@/app/actions/fornecedores'
import { PageHeader } from '@/components/page-header'
import { NovoFornecedorDialog } from '@/components/fornecedores/novo-fornecedor-dialog'
import { EditarFornecedorDialog } from '@/components/fornecedores/editar-fornecedor-dialog'
import { FornecedorActions } from '@/components/fornecedores/fornecedor-actions'
import { Card, CardContent } from '@/components/ui/card'
import { SearchInput } from '@/components/ui/search-input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const membro = await requireMembroPagina()
  const isAdmin = temPermissaoGestao(membro)
  const search = ((await searchParams).q ?? '').trim().toLowerCase()

  const todos = await getFornecedores()
  // Pesquisa em memória: lista tipicamente pequena por condomínio, mesma
  // decisão já tomada para /fracoes/condominos.
  const fornecedores = search
    ? todos.filter(
        (f) =>
          f.nome.toLowerCase().includes(search) ||
          (f.categoria ?? '').toLowerCase().includes(search),
      )
    : todos

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Contactos de fornecedores e prestadores de serviços do condomínio."
      >
        {isAdmin && <NovoFornecedorDialog />}
      </PageHeader>

      <div className="mb-4">
        <SearchInput placeholder="Pesquisar por nome ou categoria..." />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Contacto</TableHead>
                <TableHead className="hidden sm:table-cell">NIF</TableHead>
                {isAdmin && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4 + (isAdmin ? 1 : 0)}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {search
                      ? 'Nenhum fornecedor encontrado.'
                      : 'Ainda não existem fornecedores registados.'}
                  </TableCell>
                </TableRow>
              )}
              {fornecedores.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    {f.nome}
                    {f.notas && (
                      <span className="block text-xs text-muted-foreground">{f.notas}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {f.categoria || '—'}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {f.contactoEmail || f.contactoTelefone ? (
                      <span>
                        {f.contactoEmail}
                        {f.contactoEmail && f.contactoTelefone ? ' · ' : ''}
                        {f.contactoTelefone}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {f.nif || '—'}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditarFornecedorDialog
                          id={f.id}
                          nome={f.nome}
                          nif={f.nif}
                          categoria={f.categoria}
                          contactoEmail={f.contactoEmail}
                          contactoTelefone={f.contactoTelefone}
                          notas={f.notas}
                        />
                        <FornecedorActions id={f.id} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
