import { getMembroAtual } from '@/lib/session'
import { getMovimentos } from '@/app/actions/financas'
import { PageHeader } from '@/components/page-header'
import { NovoMovimentoDialog } from '@/components/financas/novo-movimento-dialog'
import { MovimentoActions } from '@/components/financas/movimento-actions'
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
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export default async function FinancasPage() {
  const membro = (await getMembroAtual())!
  const isAdmin = membro.perfil === 'admin'
  const movimentos = await getMovimentos()

  const receitas = movimentos
    .filter((m) => m.tipo === 'receita')
    .reduce((s, m) => s + Number(m.valor), 0)
  const despesas = movimentos
    .filter((m) => m.tipo === 'despesa')
    .reduce((s, m) => s + Number(m.valor), 0)
  const saldo = receitas - despesas

  return (
    <div>
      <PageHeader
        title="Finanças"
        description="Quotas, despesas e saldo do condomínio."
      >
        {isAdmin && <NovoMovimentoDialog />}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Receitas</p>
              <p className="mt-1 font-serif text-2xl font-bold text-emerald-600">
                {formatEuro(receitas)}
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Despesas</p>
              <p className="mt-1 font-serif text-2xl font-bold text-red-600">
                {formatEuro(despesas)}
              </p>
            </div>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p
                className={`mt-1 font-serif text-2xl font-bold ${
                  saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatEuro(saldo)}
              </p>
            </div>
            <Wallet className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
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
                      <MovimentoActions
                        id={m.id}
                        pago={m.pago}
                        tipo={m.tipo}
                      />
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
