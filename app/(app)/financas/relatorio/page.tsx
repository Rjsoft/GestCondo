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
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import { formatEuro, formatData } from '@/lib/format'

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
    <div className="mx-auto max-w-4xl print:max-w-none">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Relatório de Movimentos"
          />

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
                <TableHead>Fornecedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
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
                  <TableCell className="text-muted-foreground">{m.fornecedorNome ?? '—'}</TableCell>
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
