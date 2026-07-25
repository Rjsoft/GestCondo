import { notFound } from 'next/navigation'
import { getBalancoOrcamento } from '@/app/actions/orcamentos'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { VoltarButton } from '@/components/voltar-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import { formatEuro } from '@/lib/format'

export default async function BalancoOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()
  const { id } = await params
  const orcamentoId = Number(id)
  if (!Number.isInteger(orcamentoId)) notFound()

  let balanco: Awaited<ReturnType<typeof getBalancoOrcamento>>
  try {
    balanco = await getBalancoOrcamento(orcamentoId)
  } catch {
    notFound()
  }

  const condominio = await getCondominioAtual(membro.condominioId)
  const {
    orcamento,
    receitasReais,
    despesasReais,
    saldoReal,
    desvio,
    desvioPercent,
    rubricas,
  } = balanco
  const temRubricas = rubricas.some((r) => r.valorOrcamentado !== null)

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <div className="mb-4 flex justify-between print:hidden">
        <VoltarButton />
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Balanço — Orçamento aprovado vs. contas reais"
            subtitulo={`Exercício de ${orcamento.ano}`}
          />

          <div className="grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Orçamento aprovado</p>
              <p className="font-serif font-bold text-foreground">
                {formatEuro(orcamento.valorAnual)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Receitas reais</p>
              <p className="font-serif font-bold text-emerald-600">{formatEuro(receitasReais)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas reais</p>
              <p className="font-serif font-bold text-red-600">{formatEuro(despesasReais)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo real</p>
              <p
                className={`font-serif font-bold ${saldoReal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {formatEuro(saldoReal)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-b border-border pb-6">
            <p className="text-xs text-muted-foreground">
              Desvio (despesas reais − orçamento aprovado)
            </p>
            <p
              className={`font-serif text-lg font-bold ${desvio > 0 ? 'text-red-600' : 'text-emerald-600'}`}
            >
              {desvio > 0 ? '+' : ''}
              {formatEuro(desvio)}
              {desvioPercent !== null && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({desvio > 0 ? '+' : ''}
                  {desvioPercent.toFixed(1)}%)
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {desvio > 0
                ? 'As despesas reais ultrapassaram o orçamento aprovado.'
                : 'As despesas reais ficaram dentro do orçamento aprovado.'}
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-sm font-bold text-foreground">
              {temRubricas ? 'Rubricas — orçado vs. real' : 'Despesas reais por categoria'}
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  {temRubricas && <TableHead className="text-right">Orçamentado</TableHead>}
                  <TableHead className="text-right">Real</TableHead>
                  {temRubricas && <TableHead className="text-right">Desvio</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubricas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={temRubricas ? 4 : 2} className="py-6 text-center text-muted-foreground">
                      Sem despesas lançadas em {orcamento.ano}.
                    </TableCell>
                  </TableRow>
                )}
                {rubricas.map((r) => (
                  <TableRow key={r.categoria}>
                    <TableCell className="font-medium">
                      {r.categoria}
                      {temRubricas && r.valorOrcamentado === null && (
                        <span className="ml-2 text-xs text-muted-foreground">(sem rubrica)</span>
                      )}
                    </TableCell>
                    {temRubricas && (
                      <TableCell className="text-right text-muted-foreground">
                        {r.valorOrcamentado !== null ? formatEuro(r.valorOrcamentado) : '—'}
                      </TableCell>
                    )}
                    <TableCell className="text-right text-red-600">{formatEuro(r.valorReal)}</TableCell>
                    {temRubricas && (
                      <TableCell
                        className={`text-right ${
                          r.desvio !== null && r.desvio > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {r.desvio !== null ? (
                          <>
                            {r.desvio > 0 ? '+' : ''}
                            {formatEuro(r.desvio)}
                          </>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo — não substitui
            documentos contabilísticos oficiais.
            {!temRubricas &&
              ' O orçamento aprovado é comparado como um valor único; não discrimina ainda por rubrica.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
