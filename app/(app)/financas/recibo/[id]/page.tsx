import { notFound } from 'next/navigation'
import { getMovimentoPorId } from '@/app/actions/financas'
import { getFracaoPorId } from '@/app/actions/fracoes'
import { getCondominioAtual, requireMembroPagina } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { formatEuro, formatData } from '@/lib/format'
import { Building2 } from 'lucide-react'

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membro = await requireMembroPagina()
  const { id } = await params
  const movimentoId = Number(id)
  if (!Number.isInteger(movimentoId)) notFound()

  const movimento = await getMovimentoPorId(movimentoId)
  if (!movimento || movimento.tipo !== 'receita') notFound()

  const [condominio, fracaoDoMovimento] = await Promise.all([
    getCondominioAtual(membro.condominioId),
    movimento.fracaoId ? getFracaoPorId(movimento.fracaoId) : null,
  ])

  return (
    <div className="mx-auto max-w-lg">
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
            <h1 className="font-serif text-xl font-bold text-foreground">Recibo</h1>
            <p className="text-sm text-muted-foreground">
              {movimento.pago ? 'Pagamento recebido' : 'Quota — por liquidar'}
            </p>
          </div>

          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Fração</dt>
              <dd className="font-medium text-foreground">
                {fracaoDoMovimento?.identificacao ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Proprietário</dt>
              <dd className="font-medium text-foreground">
                {fracaoDoMovimento?.proprietario ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Categoria</dt>
              <dd className="font-medium text-foreground">{movimento.categoria}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Descrição</dt>
              <dd className="max-w-[60%] text-right font-medium text-foreground">
                {movimento.descricao}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Data</dt>
              <dd className="font-medium text-foreground">{formatData(movimento.data)}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base">
              <dt className="font-semibold text-foreground">Valor</dt>
              <dd className="font-serif font-bold text-emerald-600">
                {formatEuro(Number(movimento.valor))}
              </dd>
            </div>
          </dl>

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo — não substitui
            fatura-recibo emitida nos termos legais, quando aplicável.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
