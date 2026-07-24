'use client'

import { useState, useTransition } from 'react'
import { getExercicios } from '@/app/actions/exercicios'
import { getSaldosContas } from '@/app/actions/contas-financeiras'
import { AssistenteConfiguracaoFinanceira } from '@/components/financas/assistente-configuracao-financeira'
import { AssociarExercicioDialog } from '@/components/financas/associar-exercicio-dialog'
import { ContaFinanceiraActions } from '@/components/financas/conta-financeira-actions'
import { FecharExercicioDialog } from '@/components/financas/fechar-exercicio-dialog'
import { NovaContaFinanceiraDialog } from '@/components/financas/nova-conta-financeira-dialog'
import { NovoExercicioDialog } from '@/components/financas/novo-exercicio-dialog'
import { ReabrirExercicioDialog } from '@/components/financas/reabrir-exercicio-dialog'
import { TransporteSaldosDialog } from '@/components/financas/transporte-saldos-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TIPO_CONTA_LABEL } from '@/lib/financas'
import { formatData, formatEuro } from '@/lib/format'

export type ExercicioLinha = {
  id: number
  designacao: string
  anoPrincipal: number
  dataInicio: Date
  dataFim: Date
  estado: string
  fechadoEm: Date | null
}

export type ContaComSaldo = {
  id: number
  nome: string
  tipo: string
  moeda: string
  estado: string
  banco: string | null
  iban: string | null
  notaTransitoria: string | null
  saldoInicial: number
  saldoInicialOrigem: string | null
  saldo: number
  movimentosSemDataLiquidacao: number
}

export function ExerciciosTab({
  exerciciosIniciais,
  contasIniciais,
  exercicioEmVistaIdInicial,
  isAdmin,
}: {
  exerciciosIniciais: ExercicioLinha[]
  contasIniciais: ContaComSaldo[]
  exercicioEmVistaIdInicial: number | null
  isAdmin: boolean
}) {
  const [exercicios, setExercicios] = useState(exerciciosIniciais)
  const [contas, setContas] = useState(contasIniciais)
  const [exercicioEmVistaId, setExercicioEmVistaId] = useState(exercicioEmVistaIdInicial)
  const [, startTransition] = useTransition()

  const recarregar = (verId?: number | null) => {
    const idParaVer = verId !== undefined ? verId : exercicioEmVistaId
    startTransition(async () => {
      const novosExercicios = await getExercicios()
      setExercicios(novosExercicios)
      const idFinal = idParaVer ?? novosExercicios.find((e) => e.estado === 'aberto')?.id ?? novosExercicios[0]?.id ?? null
      setExercicioEmVistaId(idFinal)
      setContas(idFinal ? await getSaldosContas(idFinal) : [])
    })
  }

  const mudarExercicioEmVista = (id: number) => {
    setExercicioEmVistaId(id)
    startTransition(async () => {
      setContas(await getSaldosContas(id))
    })
  }

  if (exercicios.length === 0 || contas.length === 0) {
    if (!isAdmin) {
      return (
        <p className="text-sm text-muted-foreground">
          Ainda não existe nenhuma conta financeira configurada.
        </p>
      )
    }
    return (
      <AssistenteConfiguracaoFinanceira
        exercicioExistente={exercicios.find((e) => e.estado === 'aberto') ?? exercicios[0] ?? null}
        onConcluido={() => recarregar()}
      />
    )
  }

  const exercicioAberto = exercicios.find((e) => e.estado === 'aberto') ?? null
  const exercicioEmVista = exercicios.find((e) => e.id === exercicioEmVistaId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">A ver o exercício:</span>
          <Select
            value={exercicioEmVistaId ? String(exercicioEmVistaId) : ''}
            onValueChange={(v) => v && mudarExercicioEmVista(Number(v))}
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {() => exercicioEmVista?.designacao ?? 'Selecione'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {exercicios.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.designacao} {e.estado === 'fechado' ? '(fechado)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && <NovoExercicioDialog onSucesso={() => recarregar()} />}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold">Contas do condomínio</h3>
          {isAdmin && (
            <NovaContaFinanceiraDialog exercicioAtivo={exercicioAberto} onCriada={() => recarregar()} />
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Banco / IBAN</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Saldo inicial</TableHead>
                  <TableHead className="text-right">Saldo atual</TableHead>
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="py-10 text-center text-muted-foreground">
                      Ainda não existem contas registadas.
                    </TableCell>
                  </TableRow>
                )}
                {contas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {TIPO_CONTA_LABEL[c.tipo] ?? c.tipo}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {c.banco ?? '—'}
                      {c.iban ? ` · ${c.iban}` : ''}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          c.estado === 'ativa'
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                            : 'border-muted bg-muted text-muted-foreground'
                        }
                      >
                        {c.estado === 'ativa' ? 'Ativa' : 'Encerrada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatEuro(c.saldoInicial)}
                      {c.saldoInicialOrigem === 'transportado' && (
                        <span className="ml-1 text-xs">(transportado)</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${c.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {formatEuro(c.saldo)}
                      {c.movimentosSemDataLiquidacao > 0 && (
                        <span className="ml-1 text-xs text-amber-700" title="Há movimentos pagos sem data de liquidação">
                          ⚠
                        </span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <ContaFinanceiraActions
                          conta={c}
                          exercicioAtivo={exercicioEmVista?.estado === 'aberto' ? exercicioEmVista : null}
                          saldoInicial={c.saldoInicial}
                          saldoAtual={c.saldo}
                          onSucesso={() => recarregar()}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-2 font-serif text-lg font-semibold">Exercícios financeiros</h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Designação</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercicios.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.designacao}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatData(e.dataInicio)} – {formatData(e.dataFim)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          e.estado === 'aberto'
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                            : 'border-muted bg-muted text-muted-foreground'
                        }
                      >
                        {e.estado === 'aberto' ? 'Aberto' : 'Fechado'}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {e.estado === 'aberto' ? (
                            <>
                              <AssociarExercicioDialog
                                exercicioId={e.id}
                                designacao={e.designacao}
                                onSucesso={() => recarregar(e.id)}
                              />
                              <TransporteSaldosDialog
                                exercicioId={e.id}
                                designacao={e.designacao}
                                onSucesso={() => recarregar(e.id)}
                              />
                              <FecharExercicioDialog
                                exercicioId={e.id}
                                designacao={e.designacao}
                                onSucesso={() => recarregar()}
                              />
                            </>
                          ) : (
                            <ReabrirExercicioDialog
                              exercicioId={e.id}
                              designacao={e.designacao}
                              onSucesso={() => recarregar(e.id)}
                            />
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
