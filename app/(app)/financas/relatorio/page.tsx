import { notFound } from 'next/navigation'
import { getMovimentos, getSaldoFundoReserva } from '@/app/actions/financas'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { TipoMovimentoBadge } from '@/components/badges'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro, formatData, formatDataHora } from '@/lib/format'
import { Building2 } from 'lucide-react'

export default async function RelatorioMovimentosPage() {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()

  const [movimentos, condominio, fundoReserva] = await Promise.all([
    getMovimentos(),
    getCondominioAtual(membro.condominioId),
    getSaldoFundoReserva(),
  ])

  const movimentosGeral = movimentos.filter((m) => m.destino !== 'reserva')
  const receitas = movimentosGeral
    .filter((m) => m.tipo === 'receita')
    .reduce((s, m) => s + Number(m.valor), 0)
  const despesas = movimentosGeral
    .filter((m) => m.tipo === 'despesa')
    .reduce((s, m) => s + Number(m.valor), 0)
  const saldo = receitas - despesas

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-foreground">
                {condominio?.nome ?? 'Condomínio'}
              </p>
              {condominio?.morada && (
                <p className="text-xs text-muted-foreground">{condominio.morada}</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-serif text-xl font-bold text-foreground">
              Relatório de Movimentos
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerado em {formatDataHora(new Date())}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="font-serif font-bold text-emerald-600">{formatEuro(receitas)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="font-serif font-bold text-red-600">{formatEuro(despesas)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p
                className={`font-serif font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {formatEuro(saldo)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fundo de reserva</p>
              <p className="font-serif font-bold text-sky-600">{formatEuro(fundoReserva.saldo)}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Ainda não existem movimentos registados.
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
                    {m.destino === 'reserva' && ' (reserva)'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.descricao}</TableCell>
                  <TableCell>
                    <TipoMovimentoBadge tipo={m.tipo} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.tipo === 'receita' ? (m.pago ? 'Pago' : 'Pendente') : '—'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      m.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {m.tipo === 'receita' ? '+' : '−'}
                    {formatEuro(Number(m.valor))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo — não substitui
            documentos contabilísticos oficiais.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
