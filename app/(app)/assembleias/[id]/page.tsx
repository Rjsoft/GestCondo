import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAssembleiaDetalhe } from '@/app/actions/assembleias'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { AssembleiaStatusBadge } from '@/components/badges'
import { AssembleiaActions } from '@/components/assembleias/assembleia-actions'
import { AprovarAtaDialog } from '@/components/assembleias/aprovar-ata-dialog'
import { NovoPontoDialog } from '@/components/assembleias/novo-ponto-dialog'
import { RegistarPresencaDialog } from '@/components/assembleias/registar-presenca-dialog'
import { RegistarVotoDialog } from '@/components/assembleias/registar-voto-dialog'
import { ResultadoBotoesClient } from '@/components/assembleias/resultado-botoes'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

export default async function AssembleiaDetalhePage({
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

  const isAdmin = temPermissaoGestao(membro)
  const { assembleia, pontos, presencas, fracoes, totalPermilagem, permilagemPresente } = detalhe
  const editavel = assembleia.estado === 'convocada' || assembleia.estado === 'realizada'
  const quorumPct = totalPermilagem > 0 ? (permilagemPresente / totalPermilagem) * 100 : 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Assembleia ${TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo}`}
        description={`${formatDataHora(assembleia.dataPrimeiraConvocatoria)} — ${assembleia.local}`}
      >
        <div className="flex items-center gap-2">
          <AssembleiaStatusBadge estado={assembleia.estado} />
          {assembleia.estado !== 'cancelada' && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/assembleias/${assembleia.id}/convocatoria`} />}
            >
              Convocatória (PDF)
            </Button>
          )}
          {isAdmin && assembleia.estado === 'realizada' && (
            <AprovarAtaDialog assembleiaId={assembleia.id} textoAtaAtual={assembleia.textoAta} />
          )}
          {isAdmin && <AssembleiaActions assembleiaId={assembleia.id} estado={assembleia.estado} />}
        </div>
      </PageHeader>

      <Card>
        <CardContent className="flex flex-col gap-2 p-5">
          <p className="text-sm text-muted-foreground">
            Quórum (permilagem presente / total)
          </p>
          <p className="font-serif text-2xl font-bold text-foreground">
            {quorumPct.toFixed(1)}%{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({permilagemPresente.toFixed(2)}‰ de {totalPermilagem.toFixed(2)}‰)
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            A app calcula e mostra o quórum; a qualificação de maioria legal
            para cada deliberação cabe ao administrador.
          </p>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-foreground">
            Presenças e procurações
          </h2>
          {isAdmin && editavel && (
            <RegistarPresencaDialog assembleiaId={assembleia.id} fracoes={fracoes} />
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fração</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Representante</TableHead>
                  <TableHead className="text-right">Permilagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presencas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Ainda não há presenças registadas.
                    </TableCell>
                  </TableRow>
                )}
                {presencas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.identificacao}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.tipo === 'procuracao' ? 'Procuração' : 'Presencial'}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {p.representante || '—'}
                    </TableCell>
                    <TableCell className="text-right">{p.permilagem.toFixed(2)}‰</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-foreground">Ordem de trabalhos</h2>
          {isAdmin && editavel && <NovoPontoDialog assembleiaId={assembleia.id} />}
        </div>
        <div className="flex flex-col gap-4">
          {pontos.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Ainda não existem pontos na ordem de trabalhos.
              </CardContent>
            </Card>
          )}
          {pontos.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Ponto {p.ordem}</p>
                    <p className="font-medium text-foreground">
                      {p.titulo}
                      {p.exigeUnanimidade && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (exige unanimidade)
                        </span>
                      )}
                    </p>
                    {p.descricao && (
                      <p className="mt-1 text-sm text-muted-foreground">{p.descricao}</p>
                    )}
                  </div>
                  {p.resultado && (
                    <Badge
                      variant="outline"
                      className={
                        p.resultado === 'aprovado'
                          ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                          : p.resultado === 'reprovado'
                            ? 'border-red-200 bg-red-100 text-red-800'
                            : 'border-amber-200 bg-amber-100 text-amber-800'
                      }
                    >
                      {RESULTADO_LABEL[p.resultado] ?? p.resultado}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-md bg-emerald-50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">A favor</p>
                    <p className="font-medium text-emerald-700">
                      {p.permilagemFavor.toFixed(2)}‰
                    </p>
                  </div>
                  <div className="rounded-md bg-red-50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">Contra</p>
                    <p className="font-medium text-red-700">{p.permilagemContra.toFixed(2)}‰</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2 text-center">
                    <p className="text-xs text-muted-foreground">Abstenção</p>
                    <p className="font-medium text-foreground">
                      {p.permilagemAbstencao.toFixed(2)}‰
                    </p>
                  </div>
                </div>

                {isAdmin && editavel && (
                  <div className="flex flex-wrap items-center gap-2">
                    <RegistarVotoDialog pontoId={p.id} titulo={p.titulo} fracoes={fracoes} />
                    {!p.resultado && <ResultadoBotoesClient pontoId={p.id} />}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {(assembleia.estado === 'realizada' || assembleia.estado === 'aprovada') &&
        assembleia.textoAta && (
          <div>
            <h2 className="mb-3 font-serif text-lg font-bold text-foreground">Texto da ata</h2>
            <Card>
              <CardContent className="whitespace-pre-wrap p-5 text-sm text-foreground">
                {assembleia.textoAta}
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  )
}
