'use client'

import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { NovoMovimentoDialog } from '@/components/financas/novo-movimento-dialog'
import { MovimentoActions } from '@/components/financas/movimento-actions'
import { ExportarCsvButton } from '@/components/financas/exportar-csv-button'
import { NovoOrcamentoDialog } from '@/components/financas/novo-orcamento-dialog'
import { OrcamentoActions } from '@/components/financas/orcamento-actions'
import { NovoSeguroDialog } from '@/components/financas/novo-seguro-dialog'
import { SeguroActions } from '@/components/financas/seguro-actions'
import { LancarJurosDialog } from '@/components/financas/lancar-juros-dialog'
import { ConciliacaoTab } from '@/components/financas/conciliacao-tab'
import { TipoMovimentoBadge } from '@/components/badges'
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

type Movimento = {
  id: number
  data: Date
  categoria: string
  descricao: string
  tipo: string
  pago: boolean
  valor: string
  destino: string
  meioPagamento: string | null
  dataLiquidacao: Date | null
}

type SaldoFracao = {
  fracaoId: number
  identificacao: string
  proprietario: string
  totalLancado: number
  totalPago: number
  emDivida: number
}

type Orcamento = {
  id: number
  ano: number
  valorAnual: string
  valorAnualElevador: string | null
  notas: string | null
}

type Seguro = {
  id: number
  seguradora: string
  apolice: string
  tipo: string
  dataInicio: Date
  dataFim: Date
  valorPremio: string | null
  capitalSeguro: string | null
  notas: string | null
  anexoUrl: string | null
}

const TIPO_SEGURO_LABEL: Record<string, string> = {
  multirriscos: 'Multirriscos',
  incendio: 'Incêndio',
  outro: 'Outro',
}

type LinhaExtrato = { id: number; data: Date; descricao: string; valor: string }

type MovimentoConciliar = {
  id: number
  data: Date
  valor: string
  tipo: string
  categoria: string
  descricao: string
}

type LinhaConciliada = LinhaExtrato & {
  movimento: { id: number; categoria: string; descricao: string } | null
}

export function FinancasTabs({
  movimentos,
  movimentosCsv,
  paginaMovimentos,
  totalPaginasMovimentos,
  pesquisaMovimentos,
  mapaSaldos,
  orcamentos,
  seguros,
  fracoes,
  quotasEmAtraso,
  linhasExtrato,
  movimentosPorConciliar,
  linhasConciliadas,
  isAdmin,
}: {
  movimentos: Movimento[]
  movimentosCsv: Movimento[]
  paginaMovimentos: number
  totalPaginasMovimentos: number
  pesquisaMovimentos: string
  mapaSaldos: SaldoFracao[]
  orcamentos: Orcamento[]
  seguros: Seguro[]
  fracoes: {
    id: number
    identificacao: string
    permilagem: number
    isentaElevador: boolean
  }[]
  quotasEmAtraso: { fracaoId: number | null; valor: string; data: Date }[]
  linhasExtrato: LinhaExtrato[]
  movimentosPorConciliar: MovimentoConciliar[]
  linhasConciliadas: LinhaConciliada[]
  isAdmin: boolean
}) {
  return (
    <Tabs defaultValue="movimentos" className="mt-4">
      <TabsList>
        <TabsTrigger value="movimentos">Movimentos</TabsTrigger>
        <TabsTrigger value="dividas">Dívidas por fração</TabsTrigger>
        <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
        <TabsTrigger value="seguro">Seguro</TabsTrigger>
        <TabsTrigger value="conciliacao">Conciliação bancária</TabsTrigger>
      </TabsList>

      <TabsContent value="movimentos" className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SearchInput placeholder="Pesquisar movimentos..." />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<Link href="/financas/relatorio" />}>
              <FileText className="h-4 w-4" />
              Relatório (PDF)
            </Button>
            <ExportarCsvButton movimentos={movimentosCsv} />
            {isAdmin && <NovoMovimentoDialog fracoes={fracoes} />}
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 7 : 6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {pesquisaMovimentos
                        ? 'Nenhum movimento encontrado.'
                        : 'Ainda não existem movimentos registados.'}
                    </TableCell>
                  </TableRow>
                )}
                {movimentos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatData(m.data)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.categoria}
                      {m.destino === 'reserva' && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-sky-200 bg-sky-100 text-sky-800"
                        >
                          Reserva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground sm:table-cell">
                      {m.descricao}
                    </TableCell>
                    <TableCell>
                      <TipoMovimentoBadge tipo={m.tipo} />
                    </TableCell>
                    <TableCell>
                      {m.tipo === 'receita' ? (
                        m.pago ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-100 text-emerald-800"
                          >
                            Pago
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-100 text-amber-800"
                          >
                            Pendente
                          </Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        m.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {m.tipo === 'receita' ? '+' : '−'}
                      {formatEuro(Number(m.valor))}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <MovimentoActions id={m.id} pago={m.pago} tipo={m.tipo} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <PaginationControls
          page={paginaMovimentos}
          totalPages={totalPaginasMovimentos}
          buildHref={(p) =>
            `/financas?${new URLSearchParams({ ...(pesquisaMovimentos ? { q: pesquisaMovimentos } : {}), page: String(p) }).toString()}`
          }
        />
      </TabsContent>

      <TabsContent value="dividas" className="mt-4">
        {isAdmin && (
          <div className="mb-3 flex justify-end">
            <LancarJurosDialog quotasEmAtraso={quotasEmAtraso} fracoes={fracoes} />
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fração</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead className="text-right">Quotas lançadas</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Em dívida</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapaSaldos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Ainda não existem frações registadas.
                    </TableCell>
                  </TableRow>
                )}
                {mapaSaldos.map((s) => (
                  <TableRow key={s.fracaoId}>
                    <TableCell className="font-medium">{s.identificacao}</TableCell>
                    <TableCell className="text-muted-foreground">{s.proprietario}</TableCell>
                    <TableCell className="text-right">{formatEuro(s.totalLancado)}</TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatEuro(s.totalPago)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        s.emDivida > 0 ? 'text-red-600' : 'text-muted-foreground'
                      }`}
                    >
                      {formatEuro(s.emDivida)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/financas/declaracao-divida/${s.fracaoId}`} />}
                      >
                        <FileText className="h-4 w-4" />
                        Declaração
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orcamentos" className="mt-4">
        {isAdmin && (
          <div className="mb-3 flex justify-end">
            <NovoOrcamentoDialog />
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ano</TableHead>
                  <TableHead className="text-right">Valor anual</TableHead>
                  <TableHead className="hidden sm:table-cell">Notas</TableHead>
                  <TableHead className="w-10" />
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamentos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 5 : 4}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Ainda não existem orçamentos registados.
                    </TableCell>
                  </TableRow>
                )}
                {orcamentos.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.ano}</TableCell>
                    <TableCell className="text-right">
                      {formatEuro(Number(o.valorAnual))}
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground sm:table-cell">
                      {o.notas || '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/financas/balanco/${o.id}`} />}
                      >
                        <FileText className="h-4 w-4" />
                        Balanço
                      </Button>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <OrcamentoActions
                          id={o.id}
                          ano={o.ano}
                          valorAnual={Number(o.valorAnual)}
                          valorAnualElevador={
                            o.valorAnualElevador ? Number(o.valorAnualElevador) : 0
                          }
                          fracoes={fracoes}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seguro" className="mt-4">
        {isAdmin && (
          <div className="mb-3 flex justify-end">
            <NovoSeguroDialog />
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seguradora</TableHead>
                  <TableHead>Apólice</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Prémio anual</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Capital seguro</TableHead>
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {seguros.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 7 : 6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Ainda não existe nenhum seguro registado. O seguro do
                      edifício é obrigatório por lei.
                    </TableCell>
                  </TableRow>
                )}
                {seguros.map((s) => {
                  const hoje = new Date()
                  const diasParaExpirar = Math.ceil(
                    (s.dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
                  )
                  const expirado = diasParaExpirar < 0
                  const aExpirar = !expirado && diasParaExpirar <= 30
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.seguradora}</TableCell>
                      <TableCell className="text-muted-foreground">{s.apolice}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {TIPO_SEGURO_LABEL[s.tipo] ?? s.tipo}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="whitespace-nowrap text-muted-foreground">
                            {formatData(s.dataInicio)} – {formatData(s.dataFim)}
                          </span>
                          {expirado && (
                            <Badge
                              variant="outline"
                              className="w-fit border-red-200 bg-red-100 text-red-800"
                            >
                              Expirado
                            </Badge>
                          )}
                          {aExpirar && (
                            <Badge
                              variant="outline"
                              className="w-fit border-amber-200 bg-amber-100 text-amber-800"
                            >
                              Expira em breve
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.valorPremio ? formatEuro(Number(s.valorPremio)) : '—'}
                      </TableCell>
                      <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                        {s.capitalSeguro ? formatEuro(Number(s.capitalSeguro)) : '—'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <SeguroActions id={s.id} anexoUrl={s.anexoUrl} />
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

      <TabsContent value="conciliacao" className="mt-4">
        <ConciliacaoTab
          linhas={linhasExtrato}
          movimentos={movimentosPorConciliar}
          conciliadas={linhasConciliadas}
          isAdmin={isAdmin}
        />
      </TabsContent>
    </Tabs>
  )
}
