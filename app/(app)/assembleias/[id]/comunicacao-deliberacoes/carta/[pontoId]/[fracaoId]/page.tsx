import { notFound } from 'next/navigation'
import { getDadosCartaComunicacao } from '@/app/actions/assembleias'
import { getCondominioAtual, requireMembroPagina } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { VoltarButton } from '@/components/voltar-button'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import { formatData } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

// Carta/email de comunicação de uma deliberação que exigiu unanimidade e
// foi aprovada provisoriamente por 2/3 do capital investido presente
// (art. 1432.º/8 CC) a uma fração ausente. Base legal verificada no texto
// integral em 2026-07-23 (ver app/(app)/assembleias/[id]/convocatoria) e
// confirmada em 2026-07-27: a comunicação tem de ser feita no prazo de 30
// dias após a assembleia; a fração dispõe de 90 dias após a receção para
// se pronunciar por escrito — o silêncio vale como aprovação
// (art. 1432.º, n.os 9 a 11 CC).
export default async function CartaComunicacaoDeliberacaoPage({
  params,
}: {
  params: Promise<{ id: string; pontoId: string; fracaoId: string }>
}) {
  const membro = await requireMembroPagina()
  const { pontoId, fracaoId } = await params
  const pId = Number(pontoId)
  const fId = Number(fracaoId)
  if (!Number.isInteger(pId) || !Number.isInteger(fId)) notFound()

  let dados: Awaited<ReturnType<typeof getDadosCartaComunicacao>>
  try {
    dados = await getDadosCartaComunicacao(pId, fId)
  } catch {
    notFound()
  }
  if (!dados) notFound()

  const condominio = await getCondominioAtual(membro.condominioId)
  const { assembleia, ponto, fracao } = dados
  const dataAssembleia = assembleia.dataSegundaConvocatoria ?? assembleia.dataPrimeiraConvocatoria

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex justify-between print:hidden">
        <VoltarButton />
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Comunicação de Deliberação a Condómino Ausente"
            notaLegal="Artigo 1432.º, n.os 8 a 11, do Código Civil"
          />

          <div className="flex flex-col gap-1 text-sm text-foreground">
            <p className="font-medium">Exmo.(a) Sr.(a) {fracao.proprietario}</p>
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
              vimos comunicar a V. Ex.ª, nos termos do artigo 1432.º, n.º 9,
              do Código Civil, que na assembleia{' '}
              {TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo}{' '}
              de {formatData(dataAssembleia)}, à qual V. Ex.ª não esteve
              presente nem se fez representar, foi tomada a seguinte
              deliberação, que exigia unanimidade e foi aprovada por
              unanimidade dos condóminos presentes ou representados,
              representando estes, pelo menos, dois terços do capital
              investido:
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Deliberação
            </h2>
            <p className="rounded-md border border-border p-3 text-sm text-foreground">
              {ponto.titulo}
              {ponto.descricao && (
                <span className="mt-1 block text-muted-foreground">{ponto.descricao}</span>
              )}
            </p>
          </div>

          <div className="flex flex-col gap-4 text-sm leading-7 text-foreground">
            <p>
              Nos termos do artigo 1432.º, n.os 9 a 11, do Código Civil,
              dispõe V. Ex.ª do prazo de <strong>90 dias</strong> a contar
              da receção da presente comunicação para manifestar, por
              escrito, o seu assentimento ou a sua discordância
              relativamente a esta deliberação. Decorrido esse prazo sem
              resposta, o silêncio é considerado como aprovação.
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
            Enviar por email ou por carta registada com aviso de receção (ou
            entregar com prova de receção), para valer como comunicação e
            como prova da data de receção — registar o método e a data de
            envio na aplicação GestCondo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
