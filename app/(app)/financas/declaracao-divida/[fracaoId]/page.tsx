import { notFound } from 'next/navigation'
import { getDeclaracaoDivida } from '@/app/actions/financas'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { EmitirDocumentoButton } from '@/components/financas/emitir-documento-button'
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
import { BlocoAssinaturaAdministracao } from '@/components/print/bloco-assinatura-administracao'
import { formatEuro, formatData } from '@/lib/format'

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
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex justify-between print:hidden">
        <VoltarButton />
        <EmitirDocumentoButton fracaoId={id} tipo="declaracao_divida" />
      </div>

      <div className="mb-4 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground print:hidden">
        <p className="font-medium text-foreground">
          Vai usar esta declaração numa escritura de compra e venda?
        </p>
        <p className="mt-1">
          A lei não exige que a assinatura do administrador seja reconhecida por um notário
          (não há essa previsão no artigo 1424º-A do Código Civil), mas alguns cartórios pedem
          esse reconhecimento na prática, mesmo sem essa exigência legal — confirme antes com o
          notário ou conservatória escolhidos. Uma alternativa hoje já válida é assinar o PDF
          gerado com a{' '}
          <strong>Assinatura Qualificada do Cartão de Cidadão ou da Chave Móvel Digital</strong>{' '}
          (disponível em autenticacao.gov.pt ou na app oficial &ldquo;gov.pt&rdquo;) — tem o
          mesmo valor legal de uma assinatura reconhecida (artigo 3º, n.os 2 e 5, do
          Decreto-Lei n.º 12/2021). Saiba mais em{' '}
          <a href="/ajuda?secao=financas" className="text-primary underline-offset-4 hover:underline">
            Ajuda
          </a>
          .
        </p>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Declaração de Encargos e Dívidas"
            notaLegal="Emitida nos termos do artigo 1424.º-A do Código Civil"
          />

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

          <BlocoAssinaturaAdministracao />

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
