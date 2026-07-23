import { notFound } from 'next/navigation'
import { getAssembleiaDetalhe } from '@/app/actions/assembleias'
import { getCondominioAtual, requireMembroPagina } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import { formatDataHora } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

// Campo de formulário: rótulo + linha que se estica até ao fim da largura
// disponível (imprime bem e evita quebras feias a meio do texto corrido).
// Com `valor`, o campo imprime-se já preenchido, mantendo a linha por baixo.
function Campo({
  rotulo,
  valor,
  children,
}: {
  rotulo: string
  valor?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-end gap-2 text-sm text-foreground">
      <span className="shrink-0">{rotulo}</span>
      {children ?? (
        <span className="min-w-16 flex-1 border-b border-foreground px-1">
          {valor ?? ' '}
        </span>
      )}
    </div>
  )
}

// Minuta de procuração para representação em assembleia de condóminos
// (arts. 1431.º/3 e 262.º/1 do Código Civil) — impressa em branco, para o
// condómino preencher e assinar. Os dados pessoais do outorgante e do
// procurador ficam fora da app de propósito: a procuração é um documento
// entre condómino e representante. Texto revisto com o utilizador e
// comparado com minutas publicadas em 2026-07-23.
export default async function ProcuracaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ fracao?: string }>
}) {
  const membro = await requireMembroPagina()
  const { id } = await params
  const assembleiaId = Number(id)
  if (!Number.isInteger(assembleiaId)) notFound()

  const detalhe = await getAssembleiaDetalhe(assembleiaId)
  if (!detalhe) notFound()

  const { assembleia, fracoes } = detalhe
  if (assembleia.estado === 'cancelada') notFound()

  // Pré-preenchimento opcional com os dados de uma fração (?fracao=<id>) —
  // getAssembleiaDetalhe já garante que só devolve frações do condomínio do
  // membro autenticado. O n.º de documento de identificação fica sempre em
  // branco: a app não guarda (nem deve guardar) esses dados.
  const { fracao: fracaoParam } = await searchParams
  const fracaoSelecionada = fracaoParam
    ? fracoes.find((f: { id: number }) => f.id === Number(fracaoParam))
    : undefined

  const condominio = await getCondominioAtual(membro.condominioId)
  const tipoLabel = TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Pré-preencher com a fração:</span>
          <a
            href={`/assembleias/${assembleiaId}/procuracao`}
            className={`rounded-md border px-2 py-1 ${!fracaoSelecionada ? 'border-primary font-medium text-primary' : 'border-border text-foreground'}`}
          >
            Em branco
          </a>
          {fracoes.map((f: { id: number; identificacao: string }) => (
            <a
              key={f.id}
              href={`/assembleias/${assembleiaId}/procuracao?fracao=${f.id}`}
              className={`rounded-md border px-2 py-1 ${fracaoSelecionada?.id === f.id ? 'border-primary font-medium text-primary' : 'border-border text-foreground'}`}
            >
              {f.identificacao}
            </a>
          ))}
        </div>
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Procuração — Representação em Assembleia de Condóminos"
            notaLegal="Artigos 1431.º, n.º 3, e 262.º, n.º 1 (representação voluntária), do Código Civil"
          />

          <div>
            <h2 className="mb-3 font-serif text-sm font-bold text-foreground">
              Condómino(a) (quem confere os poderes)
            </h2>
            <div className="flex flex-col gap-4">
              <Campo rotulo="Nome completo:" valor={fracaoSelecionada?.proprietario} />
              <div className="grid grid-cols-2 gap-6">
                <Campo rotulo="Documento de identificação n.º" />
                <Campo rotulo="Válido até:" />
              </div>
              <p className="text-sm text-foreground">
                Na qualidade de{' '}
                <em>
                  proprietário(a) / comproprietário(a) / representante legal
                  do(a) proprietário(a)
                </em>{' '}
                <span className="text-xs text-muted-foreground">
                  (riscar o que não se aplica)
                </span>
              </p>
              <div className="grid grid-cols-3 gap-6">
                <Campo rotulo="Fração:" valor={fracaoSelecionada?.identificacao} />
                <Campo rotulo="Permilagem:">
                  <span className="min-w-16 flex-1 border-b border-foreground px-1">
                    {fracaoSelecionada ? Number(fracaoSelecionada.permilagem).toFixed(2) : ' '}
                  </span>
                  <span className="shrink-0">‰</span>
                </Campo>
                <Campo rotulo="Piso/uso:" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-sm font-bold text-foreground">
              Procurador(a) (quem representa)
            </h2>
            <div className="flex flex-col gap-4">
              <Campo rotulo="Nome completo:" />
              <Campo rotulo="Documento de identificação n.º" />
            </div>
          </div>

          <div className="flex flex-col gap-4 text-sm leading-7 text-foreground">
            <p>
              Pelo presente documento, o(a) condómino(a) acima
              identificado(a), titular da fração autónoma indicada, integrada
              no prédio constituído em propriedade horizontal acima
              identificado, constitui seu/sua procurador(a) a pessoa acima
              indicada, conferindo-lhe poderes para o(a) representar na{' '}
              <strong>Assembleia {tipoLabel} de Condóminos</strong> convocada
              para o dia{' '}
              <strong>{formatDataHora(assembleia.dataPrimeiraConvocatoria)}</strong>,
              em <strong>{assembleia.local}</strong>
              {assembleia.dataSegundaConvocatoria && (
                <>
                  , ou, caso se verifiquem os respetivos pressupostos legais,
                  na segunda convocatória marcada para{' '}
                  <strong>{formatDataHora(assembleia.dataSegundaConvocatoria)}</strong>,
                  no mesmo local
                </>
              )}
              .
            </p>

            <div>
              <p className="mb-1">O(A) procurador(a) fica mandatado(a) para:</p>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                <li>participar na reunião e intervir na discussão;</li>
                <li>
                  votar, em nome do(a) condómino(a), sobre todos os assuntos
                  constantes da ordem de trabalhos;
                </li>
                <li>
                  apresentar declarações, propostas ou requerimentos e
                  solicitar informações e esclarecimentos relacionados com os
                  assuntos em apreciação;
                </li>
                <li>
                  assinar a lista de presenças, a ata, quando aplicável, e os
                  demais documentos necessários ao exercício da presente
                  representação;
                </li>
                <li>
                  representar o(a) condómino(a) em eventual continuação,
                  suspensão, adiamento ou retomada da mesma assembleia, desde
                  que respeitante à ordem de trabalhos constante da
                  convocatória.
                </li>
              </ul>
            </div>

            <p>
              A presente procuração é válida exclusivamente para a assembleia
              acima identificada e respetiva segunda convocatória,
              continuação ou retomada.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Instruções ou limitações ao mandato
            </h2>
            <p className="mb-4 text-sm text-foreground">
              O(A) procurador(a) deverá observar as seguintes instruções de
              voto:
            </p>
            <div className="flex flex-col gap-7 py-1">
              <div className="border-b border-foreground" />
              <div className="border-b border-foreground" />
              <div className="border-b border-foreground" />
            </div>
            <p className="mt-4 text-sm text-foreground">
              Na ausência de instruções expressas neste espaço, o(a)
              procurador(a) poderá votar segundo o seu livre entendimento
              relativamente aos assuntos constantes da ordem de trabalhos.
            </p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-6">
            <Campo rotulo="Local:" />
            <Campo rotulo="Data:" />
          </div>

          <div className="mt-6">
            <div className="h-14" />
            <div className="w-80 border-b border-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">
              Nome legível e assinatura do(a) condómino(a) ou representante
              legal (assinatura conforme consta do documento de
              identificação)
            </p>
          </div>

          <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            A presente procuração deverá ser entregue à administração do
            condomínio no início da assembleia. O(A) procurador(a) deverá
            fazer-se acompanhar de documento de identificação válido, para
            exibição caso seja solicitada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
