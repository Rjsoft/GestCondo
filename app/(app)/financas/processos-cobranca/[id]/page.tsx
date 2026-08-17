import { notFound } from 'next/navigation'
import { getProcessoCobranca } from '@/app/actions/cobranca'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { ESTADO_LABELS, type EstadoCobranca } from '@/lib/cobranca'
import { PageHeader } from '@/components/page-header'
import { VoltarButton } from '@/components/voltar-button'
import { TransitarEstadoDialog } from '@/components/financas/transitar-estado-dialog'
import { CriarPlanoPrestacionalDialog } from '@/components/financas/criar-plano-prestacional-dialog'
import { MarcarPrestacaoCumpridaButton } from '@/components/financas/marcar-prestacao-cumprida-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatData, formatEuro } from '@/lib/format'

export default async function ProcessoCobrancaPage({ params }: { params: Promise<{ id: string }> }) {
  const membro = await requireMembroPagina()
  if (!temPermissaoGestao(membro)) notFound()

  const { id } = await params
  const processoId = Number(id)
  if (!Number.isInteger(processoId)) notFound()

  let dados: Awaited<ReturnType<typeof getProcessoCobranca>>
  try {
    dados = await getProcessoCobranca(processoId)
  } catch {
    notFound()
  }

  const { processo, fracao, prestacoes, transicoes, documentos, dividaReal, divergenciaPlano } = dados
  const estado = processo.estado as EstadoCobranca
  const totalPlano = prestacoes.reduce((s, p) => s + Number(p.valor), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="self-start">
        <VoltarButton />
      </div>
      <PageHeader
        title={`Processo de cobrança — ${fracao?.identificacao ?? 'fração'}`}
        description={fracao?.proprietario}
      >
        <TransitarEstadoDialog processoId={processo.id} estadoAtual={estado} />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Estado atual:</span>
        <Badge variant={estado === 'regularizado' ? 'default' : 'outline'}>{ESTADO_LABELS[estado]}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Dívida financeira atual (movimentos/saldos)</p>
            <p className="mt-1 font-serif text-xl font-bold text-red-600">{formatEuro(dividaReal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total do plano prestacional</p>
            <p className="mt-1 font-serif text-xl font-bold text-foreground">
              {prestacoes.length > 0 ? formatEuro(totalPlano) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Diferença</p>
            <p
              className={`mt-1 font-serif text-xl font-bold ${
                divergenciaPlano?.temDivergencia ? 'text-amber-600' : 'text-foreground'
              }`}
            >
              {divergenciaPlano ? formatEuro(divergenciaPlano.diferenca) : '—'}
            </p>
            {divergenciaPlano?.temDivergencia && (
              <p className="mt-1 text-xs text-amber-600">
                O plano não corresponde à dívida real — justifique nas notas do processo, se necessário.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plano prestacional</CardTitle>
          <CriarPlanoPrestacionalDialog processoId={processo.id} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Data prevista</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestacoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Sem plano prestacional para este processo.
                  </TableCell>
                </TableRow>
              )}
              {prestacoes.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.numero}</TableCell>
                  <TableCell>{formatData(p.dataPrevista)}</TableCell>
                  <TableCell className="text-right">{formatEuro(Number(p.valor))}</TableCell>
                  <TableCell>
                    <Badge variant={p.estado === 'cumprida' ? 'default' : 'outline'}>
                      {p.estado === 'cumprida' ? 'Cumprida' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.estado === 'pendente' && <MarcarPrestacaoCumpridaButton prestacaoId={p.id} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos emitidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Emitido em</TableHead>
                <TableHead>Por</TableHead>
                <TableHead className="text-right">Valor apresentado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Nenhum documento emitido a partir deste processo.
                  </TableCell>
                </TableRow>
              )}
              {documentos.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.tipo === 'interpelacao' ? 'Interpelação' : 'Declaração de dívida'}</TableCell>
                  <TableCell>{formatData(d.emitidoEm)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.autorNome}</TableCell>
                  <TableCell className="text-right">{formatEuro(Number(d.valorDivida))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de estados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Transição</TableHead>
                <TableHead>Por</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transicoes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap">{formatData(t.data)}</TableCell>
                  <TableCell>
                    {t.estadoAnterior ? (
                      <>
                        {ESTADO_LABELS[t.estadoAnterior as EstadoCobranca]} →{' '}
                        {ESTADO_LABELS[t.estadoNovo as EstadoCobranca]}
                      </>
                    ) : (
                      <>Processo aberto — {ESTADO_LABELS[t.estadoNovo as EstadoCobranca]}</>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.autorNome}</TableCell>
                  <TableCell className="text-muted-foreground">{t.nota ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
