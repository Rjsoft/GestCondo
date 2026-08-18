'use client'

import { useState, useTransition } from 'react'
import {
  getHistoricoPlanosReposicao,
  getPlanoReposicaoAtual,
  getRetiradasFundoReserva,
  getSaldoFundoReservaPorExercicio,
} from '@/app/actions/fundo-reserva'
import { CriarPlanoReposicaoDialog } from '@/components/financas/criar-plano-reposicao-dialog'
import { PlanoReposicaoActions } from '@/components/financas/plano-reposicao-actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatData, formatEuro } from '@/lib/format'

export type SaldoPorExercicio = {
  exercicioId: number | null
  designacao: string
  receitas: number
  despesas: number
  saldo: number
}

export type Retirada = {
  id: number
  descricao: string
  categoria: string
  valor: string
  data: Date
  assembleiaPontoId: number | null
}

export type PlanoReposicao = {
  id: number
  descricao: string
  valorAReposicao: string
  dataInicio: Date
  dataLimite: Date | null
  estado: string
  valorRepostoFinal: string | null
  notas: string | null
}

export type PlanoReposicaoAtual = PlanoReposicao & { valorReposto: number }

type PontoAssembleiaOpcao = { id: number; titulo: string; assembleiaData: string }

export function ReservaTab({
  saldoPorExercicioInicial,
  retiradasIniciais,
  planoAtualInicial,
  historicoInicial,
  pontosAssembleia,
  isAdmin,
}: {
  saldoPorExercicioInicial: SaldoPorExercicio[]
  retiradasIniciais: Retirada[]
  planoAtualInicial: PlanoReposicaoAtual | null
  historicoInicial: PlanoReposicao[]
  pontosAssembleia: PontoAssembleiaOpcao[]
  isAdmin: boolean
}) {
  const [saldoPorExercicio, setSaldoPorExercicio] = useState(saldoPorExercicioInicial)
  const [retiradas, setRetiradas] = useState(retiradasIniciais)
  const [planoAtual, setPlanoAtual] = useState(planoAtualInicial)
  const [historico, setHistorico] = useState(historicoInicial)
  const [, startTransition] = useTransition()

  const recarregar = () => {
    startTransition(async () => {
      const [novoSaldo, novasRetiradas, novoPlano, novoHistorico] = await Promise.all([
        getSaldoFundoReservaPorExercicio(),
        getRetiradasFundoReserva(),
        getPlanoReposicaoAtual(),
        getHistoricoPlanosReposicao(),
      ])
      setSaldoPorExercicio(novoSaldo)
      setRetiradas(novasRetiradas)
      setPlanoAtual(novoPlano)
      setHistorico(novoHistorico)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 font-serif text-lg font-semibold">Saldo por exercício</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercício</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saldoPorExercicio.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Ainda não há movimentos no fundo de reserva.
                    </TableCell>
                  </TableRow>
                )}
                {saldoPorExercicio.map((s) => (
                  <TableRow key={s.exercicioId ?? 'sem-exercicio'}>
                    <TableCell className="font-medium">{s.designacao}</TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatEuro(s.receitas)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatEuro(s.despesas)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${s.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {formatEuro(s.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold">Plano de reposição</h3>
          {isAdmin && !planoAtual && (
            <CriarPlanoReposicaoDialog pontosAssembleia={pontosAssembleia} onSucesso={recarregar} />
          )}
        </div>
        {planoAtual ? (
          <Card>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{planoAtual.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    Em curso desde {formatData(planoAtual.dataInicio)}
                    {planoAtual.dataLimite
                      ? ` — prazo até ${formatData(planoAtual.dataLimite)}`
                      : ''}
                  </p>
                </div>
                {isAdmin && <PlanoReposicaoActions id={planoAtual.id} onSucesso={recarregar} />}
              </div>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{formatEuro(planoAtual.valorReposto)}</span>{' '}
                repostos de {formatEuro(Number(planoAtual.valorAReposicao))}
              </p>
              {planoAtual.notas && (
                <p className="text-xs text-muted-foreground">{planoAtual.notas}</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">Sem plano de reposição em curso.</p>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-serif text-lg font-semibold">Retiradas do fundo de reserva</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria / descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Deliberação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retiradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Ainda não houve retiradas do fundo de reserva.
                    </TableCell>
                  </TableRow>
                )}
                {retiradas.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{formatData(r.data)}</TableCell>
                    <TableCell className="font-medium">
                      {r.categoria}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {r.descricao}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatEuro(Number(r.valor))}
                    </TableCell>
                    <TableCell>
                      {r.assembleiaPontoId ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-100 text-emerald-800"
                        >
                          Ligada a deliberação
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-100 text-amber-800"
                        >
                          Sem deliberação
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {historico.length > 0 && (
        <div>
          <h3 className="mb-2 font-serif text-lg font-semibold">Planos de reposição anteriores</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Reposto / a repor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.descricao}
                        {p.notas && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {p.notas}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.estado === 'concluido'
                              ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                              : 'border-muted bg-muted text-muted-foreground'
                          }
                        >
                          {p.estado === 'concluido' ? 'Concluído' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatEuro(Number(p.valorRepostoFinal ?? 0))} /{' '}
                        {formatEuro(Number(p.valorAReposicao))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
