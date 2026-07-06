import Link from 'next/link'
import { getMembroAtual, temAcessoFinanceiro } from '@/lib/session'
import { db } from '@/lib/db'
import { aviso, fracao, movimento, ocorrencia } from '@/lib/db/schema'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PrioridadeBadge, EstadoBadge } from '@/components/badges'
import { formatEuro, formatData } from '@/lib/format'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Wrench,
  Megaphone,
  ArrowRight,
  Building2,
} from 'lucide-react'

export default async function DashboardPage() {
  const membro = (await getMembroAtual())!
  // Inquilinos e fornecedores não têm acesso a dados financeiros/patrimoniais
  // (ver lib/session.ts) — o painel só lhes mostra avisos e ocorrências.
  const veFinancas = temAcessoFinanceiro(membro)

  const [movimentos, avisos, ocorrencias, fracoes] = await Promise.all([
    veFinancas
      ? db
          .select()
          .from(movimento)
          .where(
            and(
              eq(movimento.condominioId, membro.condominioId),
              isNull(movimento.deletedAt),
            ),
          )
      : Promise.resolve([] as (typeof movimento.$inferSelect)[]),
    db
      .select()
      .from(aviso)
      .where(eq(aviso.condominioId, membro.condominioId))
      .orderBy(desc(aviso.createdAt))
      .limit(4),
    db
      .select()
      .from(ocorrencia)
      .where(eq(ocorrencia.condominioId, membro.condominioId))
      .orderBy(desc(ocorrencia.createdAt))
      .limit(5),
    veFinancas
      ? db.select().from(fracao).where(eq(fracao.condominioId, membro.condominioId))
      : Promise.resolve([] as (typeof fracao.$inferSelect)[]),
  ])

  const receitas = movimentos
    .filter((m) => m.tipo === 'receita')
    .reduce((s, m) => s + Number(m.valor), 0)
  const despesas = movimentos
    .filter((m) => m.tipo === 'despesa')
    .reduce((s, m) => s + Number(m.valor), 0)
  const saldo = receitas - despesas
  const porPagar = movimentos
    .filter((m) => m.tipo === 'receita' && !m.pago)
    .reduce((s, m) => s + Number(m.valor), 0)

  const ocorrenciasAbertas = ocorrencias.filter(
    (o) => o.estado !== 'resolvida',
  ).length

  return (
    <div>
      <PageHeader
        title={`Bem-vindo, ${membro.nome.split(' ')[0]}`}
        description="Visão geral do estado atual do condomínio."
      />

      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${veFinancas ? 'lg:grid-cols-4' : ''}`}
      >
        {veFinancas && (
          <>
            <StatCard
              title="Saldo atual"
              value={formatEuro(saldo)}
              icon={Wallet}
              accent={saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
            <StatCard
              title="Receitas"
              value={formatEuro(receitas)}
              icon={TrendingUp}
              accent="text-emerald-600"
            />
            <StatCard
              title="Despesas"
              value={formatEuro(despesas)}
              icon={TrendingDown}
              accent="text-red-600"
            />
          </>
        )}
        <StatCard
          title="Ocorrências abertas"
          value={String(ocorrenciasAbertas)}
          icon={Wrench}
          accent="text-blue-600"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className={veFinancas ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-primary" />
              Avisos recentes
            </CardTitle>
            <Link
              href="/avisos"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Ver todos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {avisos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ainda não existem avisos.
              </p>
            )}
            {avisos.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{a.titulo}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                    {a.conteudo}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.autorNome} · {formatData(a.createdAt)}
                  </p>
                </div>
                <PrioridadeBadge prioridade={a.prioridade} />
              </div>
            ))}
          </CardContent>
        </Card>

        {veFinancas && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" />
                  Condomínio
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Resumo label="Frações registadas" value={String(fracoes.length)} />
                <Resumo
                  label="Permilagem total"
                  value={`${fracoes
                    .reduce((s, f) => s + Number(f.permilagem), 0)
                    .toFixed(1)} ‰`}
                />
                <Resumo
                  label="Quotas por receber"
                  value={formatEuro(porPagar)}
                  valueClass="text-amber-600"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-primary" />
            Ocorrências recentes
          </CardTitle>
          <Link
            href="/ocorrencias"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {ocorrencias.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sem ocorrências registadas.
            </p>
          )}
          {ocorrencias.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {o.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {o.local ? `${o.local} · ` : ''}
                  {formatData(o.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PrioridadeBadge prioridade={o.prioridade} />
                <EstadoBadge estado={o.estado} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`mt-1 font-serif text-2xl font-bold ${accent ?? ''}`}>
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <Icon className={`h-5 w-5 ${accent ?? 'text-foreground'}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function Resumo({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClass ?? 'text-foreground'}`}>
        {value}
      </span>
    </div>
  )
}
