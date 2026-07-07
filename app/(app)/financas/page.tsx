import { notFound } from 'next/navigation'
import { requireMembroPagina, temAcessoFinanceiro, temPermissaoGestao } from '@/lib/session'
import { getMapaSaldos, getMovimentos } from '@/app/actions/financas'
import { getOrcamentos } from '@/app/actions/orcamentos'
import { getFracoes } from '@/app/actions/fracoes'
import { PageHeader } from '@/components/page-header'
import { FinancasTabs } from '@/components/financas/financas-tabs'
import { Card, CardContent } from '@/components/ui/card'
import { formatEuro } from '@/lib/format'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

export default async function FinancasPage() {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()
  const isAdmin = temPermissaoGestao(membro)

  const [movimentos, mapaSaldos, orcamentos, fracoes] = await Promise.all([
    getMovimentos(),
    getMapaSaldos(),
    getOrcamentos(),
    getFracoes(),
  ])

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
        description="Quotas, despesas, dívidas por fração e orçamento do condomínio."
      />

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

      <FinancasTabs
        movimentos={movimentos}
        mapaSaldos={mapaSaldos}
        orcamentos={orcamentos}
        fracoes={fracoes.map((f) => ({ id: f.id, identificacao: f.identificacao }))}
        isAdmin={isAdmin}
      />
    </div>
  )
}
