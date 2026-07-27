import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getComunicacoesDeliberacao } from '@/app/actions/assembleias'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { VoltarButton } from '@/components/voltar-button'
import { SituacaoComunicacaoBadge } from '@/components/badges'
import { RegistarEnvioComunicacaoDialog } from '@/components/assembleias/registar-envio-comunicacao-dialog'
import { RespostaComunicacaoBotoes } from '@/components/assembleias/resposta-comunicacao-botoes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatData } from '@/lib/format'
import { FileText } from 'lucide-react'

export default async function ComunicacaoDeliberacoesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temPermissaoGestao(membro)) notFound()
  const { id } = await params
  const assembleiaId = Number(id)
  if (!Number.isInteger(assembleiaId)) notFound()

  const detalhe = await getComunicacoesDeliberacao(assembleiaId)
  if (!detalhe) notFound()
  const { pontos } = detalhe

  return (
    <div className="flex flex-col gap-6">
      <div className="self-start">
        <VoltarButton />
      </div>
      <PageHeader
        title="Comunicação de deliberações aos ausentes"
        description="Pontos aprovados por unanimidade dos presentes (art. 1432.º/8 CC) — as frações ausentes têm de ser notificadas e dispõem de 90 dias para responder por escrito; o silêncio vale como aprovação."
      />

      {pontos.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Não há, nesta assembleia, nenhum ponto que exija unanimidade e
            que tenha sido aprovado com frações ausentes por comunicar.
          </CardContent>
        </Card>
      )}

      {pontos.map((ponto) => (
        <Card key={ponto.id}>
          <CardHeader>
            <CardTitle className="font-serif text-base">{ponto.titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            {ponto.fracoesAusentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma fração esteve ausente neste ponto.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fração</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead>Prazo de resposta</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ponto.fracoesAusentes.map((f) => (
                    <TableRow key={f.fracaoId}>
                      <TableCell className="font-medium">{f.identificacao}</TableCell>
                      <TableCell>
                        <SituacaoComunicacaoBadge situacao={f.situacao} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {f.comunicacao
                          ? `${f.comunicacao.metodo === 'email' ? 'Email' : 'Carta'} — ${formatData(f.comunicacao.dataEnvio)}`
                          : `Prazo: ${formatData(f.prazoEnvio)}`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {f.prazoResposta ? formatData(f.prazoResposta) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            render={
                              <Link
                                href={`/assembleias/${assembleiaId}/comunicacao-deliberacoes/carta/${ponto.id}/${f.fracaoId}`}
                              />
                            }
                          >
                            <FileText className="h-4 w-4" />
                            Carta
                          </Button>
                          <RegistarEnvioComunicacaoDialog
                            pontoId={ponto.id}
                            fracaoId={f.fracaoId}
                            identificacao={f.identificacao}
                            jaEnviado={Boolean(f.comunicacao)}
                          />
                          {f.comunicacao && !f.comunicacao.resposta && (
                            <RespostaComunicacaoBotoes comunicacaoId={f.comunicacao.id} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
