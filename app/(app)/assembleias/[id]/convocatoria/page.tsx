import { notFound } from 'next/navigation'
import { getAssembleiaDetalhe } from '@/app/actions/assembleias'
import { getCondominioAtual, requireMembroPagina } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { formatData, formatDataHora } from '@/lib/format'
import { Building2 } from 'lucide-react'

const TIPO_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

// Minuta formal da convocatória (art. 1432.º do Código Civil, na redação da
// Lei n.º 8/2022), para impressão/afixação ou envio por carta registada aos
// condóminos sem email. O conteúdo obrigatório por lei: dia, hora, local,
// ordem de trabalhos e identificação dos assuntos que exigem unanimidade.
export default async function ConvocatoriaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membro = await requireMembroPagina()
  const { id } = await params
  const assembleiaId = Number(id)
  if (!Number.isInteger(assembleiaId)) notFound()

  const detalhe = await getAssembleiaDetalhe(assembleiaId)
  if (!detalhe) notFound()

  const { assembleia, pontos } = detalhe
  // Depois de cancelada não faz sentido emitir a convocatória.
  if (assembleia.estado === 'cancelada') notFound()

  const condominio = await getCondominioAtual(membro.condominioId)

  // Art. 1432.º/1-3 CC: a convocatória deve ser expedida com 10 dias de
  // antecedência (carta registada, aviso com recibo, ou email consentido em
  // assembleia anterior). Aviso só no ecrã — nunca impresso.
  const DEZ_DIAS_MS = 10 * 24 * 60 * 60 * 1000
  const agora = new Date()
  const antecedenciaInsuficiente =
    assembleia.dataPrimeiraConvocatoria.getTime() - agora.getTime() < DEZ_DIAS_MS &&
    assembleia.estado === 'convocada'

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      {antecedenciaInsuficiente && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">
          Atenção: faltam menos de 10 dias para a assembleia. A lei exige que
          a convocatória seja expedida com, pelo menos, 10 dias de
          antecedência (art. 1432.º, n.º 2 do Código Civil) — uma convocatória
          irregular pode levar à anulação das deliberações.
        </p>
      )}

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
                <p className="text-xs text-muted-foreground">NIF {condominio.nif}</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-serif text-xl font-bold text-foreground">
              Convocatória — Assembleia {TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo} de
              Condóminos
            </h1>
          </div>

          <p className="text-sm text-foreground">
            Nos termos do artigo 1432.º do Código Civil, convocam-se todos os
            condóminos do prédio acima identificado para a Assembleia{' '}
            {(TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo).toLowerCase()} de
            condóminos, a realizar em <strong>{assembleia.local}</strong>, no
            dia <strong>{formatDataHora(assembleia.dataPrimeiraConvocatoria)}</strong>,
            com a ordem de trabalhos abaixo indicada.
          </p>

          {assembleia.dataSegundaConvocatoria && (
            <p className="text-sm text-foreground">
              Caso não compareça o número de condóminos suficiente para se
              obter quórum (mais de metade do valor total do prédio), a
              assembleia reunirá em <strong>segunda convocatória</strong> em{' '}
              <strong>{formatDataHora(assembleia.dataSegundaConvocatoria)}</strong>,
              no mesmo local, podendo então deliberar por maioria dos votos
              dos condóminos presentes, desde que representem, pelo menos, um
              quarto do valor total do prédio (art. 1432.º, n.º 7 do Código
              Civil).
            </p>
          )}

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Ordem de trabalhos
            </h2>
            {pontos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não existem pontos na ordem de trabalhos — adicione-os
                antes de emitir a convocatória.
              </p>
            ) : (
              <ol className="flex flex-col gap-2 text-sm text-foreground">
                {pontos.map((p) => (
                  <li key={p.id} className="border-b border-border pb-2">
                    <span className="font-medium">
                      {p.ordem}. {p.titulo}
                    </span>
                    {p.exigeUnanimidade && (
                      <span className="font-medium">
                        {' '}
                        — assunto que só pode ser aprovado por unanimidade
                        (art. 1432.º, n.º 4 do Código Civil)
                      </span>
                    )}
                    {p.descricao && (
                      <p className="mt-1 text-muted-foreground">{p.descricao}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="text-sm text-foreground">
            <h2 className="mb-2 font-serif text-sm font-bold">Notas legais</h2>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>
                Os condóminos podem fazer-se representar por procurador,
                mediante procuração (art. 1431.º, n.º 3 do Código Civil).
              </li>
              <li>
                Em primeira convocatória, a assembleia delibera por maioria
                dos votos representativos do capital investido (art. 1432.º,
                n.º 5 do Código Civil).
              </li>
              <li>
                As deliberações sobre assuntos identificados como sujeitos a
                unanimidade podem ser aprovadas por dois terços dos condóminos
                presentes, ficando sujeitas a confirmação pelos condóminos
                ausentes no prazo de 90 dias (art. 1432.º, n.os 8 a 11 do
                Código Civil).
              </li>
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-8 text-sm text-foreground">
            <p>{formatData(agora)}</p>
            <div>
              <div className="w-64 border-b border-foreground" />
              <p className="mt-1 text-xs text-muted-foreground">
                O Administrador do Condomínio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
