import { notFound } from 'next/navigation'
import { getAssembleiaDetalhe } from '@/app/actions/assembleias'
import { getCondominioAtual, requireMembroPagina } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImprimirButton } from '@/components/imprimir-button'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import { formatDataHora } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

const RESULTADO_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  adiado: 'Adiado',
}

export default async function AtaPage({
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

  const { assembleia, pontos, presencas, totalPermilagem, permilagemPresente } = detalhe
  // Ainda não há nada para mostrar antes de a assembleia acontecer.
  if (assembleia.estado === 'convocada') notFound()

  const condominio = await getCondominioAtual(membro.condominioId)
  const quorumPct = totalPermilagem > 0 ? (permilagemPresente / totalPermilagem) * 100 : 0

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-6 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo={`Ata de Assembleia ${TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo}`}
            subtitulo={`${formatDataHora(assembleia.dataPrimeiraConvocatoria)} — ${assembleia.local}`}
          />
          {assembleia.estado !== 'aprovada' && (
            <div className="-mt-4 text-center">
              <Badge
                variant="outline"
                className="border-amber-200 bg-amber-100 text-amber-800"
              >
                Rascunho — ata ainda não aprovada
              </Badge>
            </div>
          )}

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Presenças e quórum
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">
              Quórum: {quorumPct.toFixed(1)}% ({permilagemPresente.toFixed(2)}‰ de{' '}
              {totalPermilagem.toFixed(2)}‰)
            </p>
            <dl className="flex flex-col gap-2 text-sm">
              {presencas.length === 0 && (
                <p className="text-muted-foreground">Nenhuma presença registada.</p>
              )}
              {presencas.map((p) => (
                <div key={p.id} className="flex justify-between border-b border-border pb-1">
                  <dt className="text-foreground">
                    {p.identificacao}
                    {p.tipo === 'procuracao' && (
                      <span className="text-muted-foreground"> (procuração)</span>
                    )}
                  </dt>
                  <dd className="text-muted-foreground">{p.permilagem.toFixed(2)}‰</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Ordem de trabalhos e deliberações
            </h2>
            <div className="flex flex-col gap-3">
              {pontos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum ponto na ordem de trabalhos.
                </p>
              )}
              {pontos.map((p) => (
                <div key={p.id} className="border-b border-border pb-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {p.ordem}. {p.titulo}
                    </p>
                    {p.resultado && (
                      <span className="shrink-0 font-medium text-foreground">
                        {RESULTADO_LABEL[p.resultado] ?? p.resultado}
                      </span>
                    )}
                  </div>
                  {p.descricao && (
                    <p className="mt-1 text-muted-foreground">{p.descricao}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    A favor: {p.permilagemFavor.toFixed(2)}‰ · Contra:{' '}
                    {p.permilagemContra.toFixed(2)}‰ · Abstenção:{' '}
                    {p.permilagemAbstencao.toFixed(2)}‰
                  </p>
                </div>
              ))}
            </div>
          </div>

          {assembleia.textoAta && (
            <div>
              <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
                Texto da ata
              </h2>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {assembleia.textoAta}
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo a partir do
            registo de presenças e votação da assembleia.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
