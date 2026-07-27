'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NovoFornecedorDialog } from '@/components/fornecedores/novo-fornecedor-dialog'
import { EditarFornecedorDialog } from '@/components/fornecedores/editar-fornecedor-dialog'
import { FornecedorActions } from '@/components/fornecedores/fornecedor-actions'
import { NovoOrcamentoObraDialog } from '@/components/fornecedores/novo-orcamento-obra-dialog'
import { OrcamentoObraActions } from '@/components/fornecedores/orcamento-obra-actions'
import { NovoContratoDialog } from '@/components/fornecedores/novo-contrato-dialog'
import { EditarContratoDialog } from '@/components/fornecedores/editar-contrato-dialog'
import { ContratoActions } from '@/components/fornecedores/contrato-actions'
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
import { PERIODICIDADE_LABEL } from '@/lib/fornecedores'

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

type Contrato = {
  id: number
  fornecedorId: number | null
  fornecedorNome: string | null
  objeto: string
  categoria: string | null
  valor: string | null
  periodicidade: string
  dataInicio: Date
  dataFim: Date | null
  renovacaoAutomatica: boolean
  prazoDenunciaDias: number | null
  notas: string | null
  anexoUrl: string | null
  anexoNomeFicheiro: string | null
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
  contratos,
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
  contratos: Contrato[]
}) {
  return (
    <Tabs defaultValue="fornecedores" className="mt-4">
      <TabsList>
        <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        <TabsTrigger value="orcamentosObra">Orçamentos de obra</TabsTrigger>
        <TabsTrigger value="contratos">Contratos</TabsTrigger>
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

      <TabsContent value="contratos" className="mt-4">
        <div className="mb-4 flex justify-end">
          {isAdmin && (
            <NovoContratoDialog fornecedores={fornecedores.map((f) => ({ id: f.id, nome: f.nome }))} />
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objeto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="hidden sm:table-cell">Periodicidade</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {isAdmin && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5 + (isAdmin ? 1 : 0)}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Ainda não existem contratos registados.
                    </TableCell>
                  </TableRow>
                )}
                {contratos.map((c) => {
                  const hoje = new Date()
                  const diasParaExpirar = c.dataFim
                    ? Math.ceil((c.dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  const expirado = diasParaExpirar !== null && diasParaExpirar < 0
                  const aExpirar = diasParaExpirar !== null && !expirado && diasParaExpirar <= 30
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.objeto}
                        {c.categoria && (
                          <span className="block text-xs text-muted-foreground">{c.categoria}</span>
                        )}
                        {c.anexoUrl && (
                          <a
                            href={`/api/ficheiros?url=${encodeURIComponent(c.anexoUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-primary underline-offset-4 hover:underline"
                          >
                            {c.anexoNomeFicheiro || 'Ver contrato'}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.fornecedorNome ?? (c.fornecedorId ? 'Fornecedor removido' : '—')}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {PERIODICIDADE_LABEL[c.periodicidade as keyof typeof PERIODICIDADE_LABEL] ?? c.periodicidade}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="whitespace-nowrap text-muted-foreground">
                            {formatData(c.dataInicio)}
                            {c.dataFim ? ` – ${formatData(c.dataFim)}` : ' – sem fim definido'}
                          </span>
                          {expirado && (
                            <Badge variant="outline" className="w-fit border-red-200 bg-red-100 text-red-800">
                              Expirado
                            </Badge>
                          )}
                          {aExpirar && (
                            <Badge variant="outline" className="w-fit border-amber-200 bg-amber-100 text-amber-800">
                              Expira em breve
                            </Badge>
                          )}
                          {c.renovacaoAutomatica && (
                            <Badge variant="outline" className="w-fit border-sky-200 bg-sky-100 text-sky-800">
                              Renovação automática
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {c.valor ? formatEuro(Number(c.valor)) : '—'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <EditarContratoDialog
                              id={c.id}
                              fornecedorId={c.fornecedorId}
                              objeto={c.objeto}
                              categoria={c.categoria}
                              valor={c.valor}
                              periodicidade={c.periodicidade}
                              dataInicio={c.dataInicio}
                              dataFim={c.dataFim}
                              renovacaoAutomatica={c.renovacaoAutomatica}
                              prazoDenunciaDias={c.prazoDenunciaDias}
                              notas={c.notas}
                              fornecedores={fornecedores.map((f) => ({ id: f.id, nome: f.nome }))}
                            />
                            <ContratoActions id={c.id} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
