'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NovoFornecedorDialog } from '@/components/fornecedores/novo-fornecedor-dialog'
import { EditarFornecedorDialog } from '@/components/fornecedores/editar-fornecedor-dialog'
import { FornecedorActions } from '@/components/fornecedores/fornecedor-actions'
import { NovoOrcamentoObraDialog } from '@/components/fornecedores/novo-orcamento-obra-dialog'
import { OrcamentoObraActions } from '@/components/fornecedores/orcamento-obra-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { PaginationControls } from '@/components/ui/pagination-controls'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro, formatData } from '@/lib/format'

type Fornecedor = {
  id: number
  nome: string
  categoria: string | null
  contactoEmail: string | null
  contactoTelefone: string | null
  nif: string | null
  notas: string | null
}

type OrcamentoObra = {
  id: number
  assunto: string
  fornecedorId: number | null
  fornecedorNome: string | null
  valor: string
  descricao: string | null
  anexoUrl: string | null
  anexoNomeFicheiro: string | null
  vencedor: boolean
  createdAt: Date
}

export function FornecedoresTabs({
  fornecedores,
  fornecedoresFiltrados,
  search,
  isAdmin,
  orcamentos,
  orcamentosPage,
  orcamentosTotalPages,
  orcamentosSearch,
  ocorrencias,
}: {
  fornecedores: Fornecedor[]
  fornecedoresFiltrados: Fornecedor[]
  search: string
  isAdmin: boolean
  orcamentos: OrcamentoObra[]
  orcamentosPage: number
  orcamentosTotalPages: number
  orcamentosSearch: string
  ocorrencias: { id: number; titulo: string }[]
}) {
  return (
    <Tabs defaultValue="fornecedores" className="mt-4">
      <TabsList>
        <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        <TabsTrigger value="orcamentosObra">Orçamentos de obra</TabsTrigger>
      </TabsList>

      <TabsContent value="fornecedores" className="mt-4">
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
                {fornecedoresFiltrados.length === 0 && (
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
                {fornecedoresFiltrados.map((f) => (
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
        <div className="mt-4 flex justify-end">
          {isAdmin && <NovoFornecedorDialog />}
        </div>
      </TabsContent>

      <TabsContent value="orcamentosObra" className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SearchInput placeholder="Pesquisar por assunto ou fornecedor..." paramName="qOrcamentos" />
          {isAdmin && (
            <NovoOrcamentoObraDialog
              fornecedores={fornecedores.map((f) => ({ id: f.id, nome: f.nome }))}
              ocorrencias={ocorrencias}
            />
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden md:table-cell">Anexo</TableHead>
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamentos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5 + (isAdmin ? 1 : 0)}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Ainda não existem orçamentos de obra registados.
                    </TableCell>
                  </TableRow>
                )}
                {orcamentos.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      {o.assunto}
                      {o.vencedor && (
                        <Badge variant="outline" className="ml-2 border-emerald-200 bg-emerald-100 text-emerald-800">
                          Vencedor
                        </Badge>
                      )}
                      {o.descricao && (
                        <span className="block text-xs text-muted-foreground">{o.descricao}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.fornecedorNome ?? 'Fornecedor removido'}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatData(o.createdAt)}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatEuro(Number(o.valor))}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {o.anexoUrl ? (
                        <a
                          href={`/api/ficheiros?url=${encodeURIComponent(o.anexoUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {o.anexoNomeFicheiro || 'Ver anexo'}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <OrcamentoObraActions id={o.id} vencedor={o.vencedor} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <PaginationControls
          page={orcamentosPage}
          totalPages={orcamentosTotalPages}
          buildHref={(p) =>
            `/fornecedores?${new URLSearchParams({
              ...(orcamentosSearch ? { qOrcamentos: orcamentosSearch } : {}),
              page: String(p),
            }).toString()}`
          }
        />
      </TabsContent>
    </Tabs>
  )
}
