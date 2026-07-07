'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NovoMovimentoDialog } from '@/components/financas/novo-movimento-dialog'
import { MovimentoActions } from '@/components/financas/movimento-actions'
import { ExportarCsvButton } from '@/components/financas/exportar-csv-button'
import { NovoOrcamentoDialog } from '@/components/financas/novo-orcamento-dialog'
import { OrcamentoActions } from '@/components/financas/orcamento-actions'
import { TipoMovimentoBadge } from '@/components/badges'
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
import { formatEuro, formatData } from '@/lib/format'

type Movimento = {
  id: number
  data: Date
  categoria: string
  descricao: string
  tipo: string
  pago: boolean
  valor: string
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
  notas: string | null
}

export function FinancasTabs({
  movimentos,
  mapaSaldos,
  orcamentos,
  fracoes,
  isAdmin,
}: {
  movimentos: Movimento[]
  mapaSaldos: SaldoFracao[]
  orcamentos: Orcamento[]
  fracoes: { id: number; identificacao: string }[]
  isAdmin: boolean
}) {
  return (
    <Tabs defaultValue="movimentos" className="mt-4">
      <TabsList>
        <TabsTrigger value="movimentos">Movimentos</TabsTrigger>
        <TabsTrigger value="dividas">Dívidas por fração</TabsTrigger>
        <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
      </TabsList>

      <TabsContent value="movimentos" className="mt-4">
        <div className="mb-3 flex flex-wrap justify-end gap-2">
          <ExportarCsvButton movimentos={movimentos} />
          {isAdmin && <NovoMovimentoDialog fracoes={fracoes} />}
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
                      Ainda não existem movimentos registados.
                    </TableCell>
                  </TableRow>
                )}
                {movimentos.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatData(m.data)}
                    </TableCell>
                    <TableCell className="font-medium">{m.categoria}</TableCell>
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
      </TabsContent>

      <TabsContent value="dividas" className="mt-4">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapaSaldos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
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
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orcamentos.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 4 : 3}
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
                    {isAdmin && (
                      <TableCell>
                        <OrcamentoActions id={o.id} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
