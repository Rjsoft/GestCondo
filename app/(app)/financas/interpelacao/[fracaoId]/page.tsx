import { notFound } from 'next/navigation'
import { getDeclaracaoDivida } from '@/app/actions/financas'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro, formatData } from '@/lib/format'

const PRAZOS_DIAS = [8, 15, 30]

// Carta de interpelação para pagamento de quotas em atraso, para envio por
// carta registada com aviso de receção (ou entrega com prova de receção).
// Base legal, verificada no texto integral em 2026-07-23:
// - arts. 805.º e 806.º CC — mora e juros de mora à taxa legal;
// - art. 6.º do DL n.º 268/94 (redação da Lei n.º 8/2022) — a ata que fixa
//   as contribuições e o seu vencimento constitui título executivo,
//   abrangendo juros de mora e sanções pecuniárias aprovadas; o
//   administrador deve instaurar ação de cobrança no prazo de 90 dias após
//   o primeiro incumprimento quando a dívida atinja o valor do IAS.
export default async function InterpelacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ fracaoId: string }>
  searchParams: Promise<{ prazo?: string }>
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
  const { fracao, dividas, totalDivida } = declaracao

  // Prazo de pagamento concedido na carta (?prazo=8|15|30, por omissão 15).
  const { prazo: prazoParam } = await searchParams
  const prazoDias = PRAZOS_DIAS.includes(Number(prazoParam)) ? Number(prazoParam) : 15

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Prazo de pagamento:</span>
          {PRAZOS_DIAS.map((p) => (
            <a
              key={p}
              href={`/financas/interpelacao/${id}?prazo=${p}`}
              className={`rounded-md border px-2 py-1 ${prazoDias === p ? 'border-primary font-medium text-primary' : 'border-border text-foreground'}`}
            >
              {p} dias
            </a>
          ))}
        </div>
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Interpelação para Pagamento de Quotas em Atraso"
            notaLegal="Artigos 805.º e 806.º do Código Civil e artigo 6.º do Decreto-Lei n.º 268/94, de 25 de outubro"
          />

          <div className="flex flex-col gap-1 text-sm text-foreground">
            <p className="font-medium">
              Exmo.(a) Sr.(a) {fracao.proprietario}
            </p>
            <p className="text-muted-foreground">
              Proprietário(a) da fração {fracao.identificacao}
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="shrink-0 text-muted-foreground">Morada:</span>
              <span className="min-w-16 flex-1 border-b border-foreground" />
            </div>
          </div>

          <div className="flex flex-col gap-4 text-sm leading-7 text-foreground">
            <p>
              Na qualidade de administração do condomínio acima identificado,
              vimos interpelar V. Ex.ª, nos termos dos artigos 805.º e 806.º
              do Código Civil, para proceder ao pagamento das quantias em
              atraso relativas à fração de que é proprietário(a), abaixo
              discriminadas, no prazo máximo de{' '}
              <strong>{prazoDias} dias</strong> a contar da receção da
              presente comunicação.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Quantias em dívida
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
                      Sem dívidas registadas para esta fração — esta carta só
                      deve ser emitida quando existam quantias em atraso.
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
              <span className="font-serif font-bold text-red-600">
                {formatEuro(totalDivida)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-sm leading-7 text-foreground">
            <p>
              Ao valor em dívida acrescem juros de mora, à taxa legal,
              contados desde a data de vencimento de cada prestação até
              integral pagamento (artigo 806.º do Código Civil).
            </p>
            <p>
              Informamos que, decorrido o prazo acima indicado sem que se
              mostre efetuado o pagamento, a administração procederá à
              cobrança judicial das quantias em dívida, servindo de título
              executivo a ata da assembleia de condóminos que fixou as
              contribuições devidas e o respetivo vencimento, a qual abrange
              igualmente os juros de mora e as sanções pecuniárias
              aplicáveis (artigo 6.º do Decreto-Lei n.º 268/94, de 25 de
              outubro, na redação da Lei n.º 8/2022). Nesse caso, acrescerão
              ainda os encargos com a cobrança, incluindo custas judiciais.
            </p>
            <p>
              O pagamento pode ser efetuado pelos meios habituais do
              condomínio. Caso o pagamento já tenha sido efetuado à data da
              receção desta carta, solicitamos que nos remeta o respetivo
              comprovativo, considerando-se a mesma sem efeito.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-8 text-sm text-foreground">
            <p>{formatData(new Date())}</p>
            <div>
              <div className="h-10" />
              <div className="w-64 border-b border-foreground" />
              <p className="mt-1 text-xs text-muted-foreground">
                A Administração do Condomínio
              </p>
            </div>
          </div>

          <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Enviar por carta registada com aviso de receção (ou entregar com
            prova de receção), para valer como interpelação e como prova da
            comunicação.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
