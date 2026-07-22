import { notFound } from 'next/navigation'
import { getDeclaracaoDivida } from '@/app/actions/financas'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
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

export default async function DeclaracaoDividaPage({
  params,
}: {
  params: Promise<{ fracaoId: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()
  const { fracaoId } = await params
  const id = Number(fracaoId)
  if (!Number.isInteger(id)) notFound()

  let declaracao: Awaited<ReturnType<typeof getDeclaracaoDivida>>
  try {
    declaracao = await getDeclaracaoDivida(id)
  } catch {
    notFound()
  }

  const condominio = await getCondominioAtual(membro.condominioId)
  const { fracao, anoOrcamento, quotaMensalAtual, dividas, totalDivida } = declaracao

  return (
    <div className="mx-auto max-w-2xl">
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
              {condominio?.nif && (
                <p className="text-xs text-muted-foreground">NIF: {condominio.nif}</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-serif text-xl font-bold text-foreground">
              Declaração de Encargos e Dívidas
            </h1>
            <p className="text-xs text-muted-foreground">
              Emitida nos termos do artigo 1424º-A do Código Civil
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerada em {formatDataHora(new Date())}
            </p>
          </div>

          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Fração</dt>
              <dd className="font-medium text-foreground">{fracao.identificacao}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Proprietário</dt>
              <dd className="font-medium text-foreground">{fracao.proprietario}</dd>
            </div>
            {fracao.nif && (
              <div className="flex justify-between border-b border-border pb-2">
                <dt className="text-muted-foreground">NIF do proprietário</dt>
                <dd className="font-medium text-foreground">{fracao.nif}</dd>
              </div>
            )}
          </dl>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              1. Encargos correntes
            </h2>
            <p className="text-sm text-muted-foreground">
              {quotaMensalAtual !== null ? (
                <>
                  Quota mensal atual, calculada a partir do orçamento aprovado de{' '}
                  {anoOrcamento}: <strong className="text-foreground">{formatEuro(quotaMensalAtual)}</strong>
                  , com vencimento mensal.
                </>
              ) : (
                'Sem orçamento aprovado registado — sem encargo corrente a declarar.'
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              2. Dívidas existentes
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Natureza</TableHead>
                  <TableHead>Data de constituição / vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                      Sem dívidas registadas para esta fração.
                    </TableCell>
                  </TableRow>
                )}
                {dividas.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.categoria}
                      <span className="block text-xs text-muted-foreground">{d.descricao}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatData(d.data)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatEuro(Number(d.valor))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-base">
              <span className="font-semibold text-foreground">Total em dívida</span>
              <span className="font-serif font-bold text-red-600">{formatEuro(totalDivida)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Declaração emitida pelo administrador do condomínio a pedido do condómino, nos termos
            do artigo 1424º-A do Código Civil. A responsabilidade pelas dívidas aqui identificadas
            determina-se pelo momento em que deveriam ter sido pagas, salvo renúncia expressa do
            adquirente a esta declaração.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
