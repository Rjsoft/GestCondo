'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { getBalancoPatrimonial } from '@/app/actions/contas-financeiras'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText } from 'lucide-react'
import { formatEuro } from '@/lib/format'
import type { ExercicioLinha } from '@/components/financas/exercicios-tab'

type Balanco = Awaited<ReturnType<typeof getBalancoPatrimonial>>

export function BalancoPatrimonialTab({
  exercicios,
  exercicioEmVistaIdInicial,
  balancoPatrimonialInicial,
}: {
  exercicios: ExercicioLinha[]
  exercicioEmVistaIdInicial: number | null
  balancoPatrimonialInicial: Balanco | null
}) {
  const [exercicioId, setExercicioId] = useState(exercicioEmVistaIdInicial)
  const [balanco, setBalanco] = useState<Balanco | null>(balancoPatrimonialInicial)
  const [pending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const mudarExercicio = (id: number) => {
    setExercicioId(id)
    setErro(null)
    startTransition(async () => {
      try {
        setBalanco(await getBalancoPatrimonial(id))
      } catch (e) {
        setBalanco(null)
        setErro(e instanceof Error ? e.message : 'Erro ao calcular o balanço')
      }
    })
  }

  if (exercicios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Configure primeiro um exercício financeiro (separador &quot;Exercícios e
        contas&quot;) para poder ver o balanço patrimonial.
      </p>
    )
  }

  const exercicioAtual = exercicios.find((e) => e.id === exercicioId) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">A ver o exercício:</span>
          <Select
            value={exercicioId ? String(exercicioId) : ''}
            onValueChange={(v) => v && mudarExercicio(Number(v))}
          >
            <SelectTrigger className="w-48">
              <SelectValue>{() => exercicioAtual?.designacao ?? 'Selecione'}</SelectValue>
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
        {exercicioId && (
          <Button
            variant="outline"
            render={<Link href={`/financas/balanco-patrimonial/${exercicioId}`} />}
          >
            <FileText className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        )}
      </div>

      {pending && <p className="text-sm text-muted-foreground">A calcular...</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {balanco && !pending && (
        <>
          <p className="text-xs text-muted-foreground">
            Não inclui adiantamentos de condóminos como passivo próprio — essa
            funcionalidade ainda não existe. Um condómino que pague
            antecipadamente aparece hoje só como uma quota futura já paga.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Ativo</p>
                <p className="font-serif text-xl font-bold text-emerald-600">
                  {formatEuro(balanco.ativo.total)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Disponibilidades: {formatEuro(balanco.ativo.disponibilidades)}
                  <br />
                  Dívidas de condóminos: {formatEuro(balanco.ativo.dividasCondominos)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Passivo</p>
                <p className="font-serif text-xl font-bold text-red-600">
                  {formatEuro(balanco.passivo.total)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dívidas a fornecedores: {formatEuro(balanco.passivo.dividasFornecedores)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Situação líquida</p>
                <p className="font-serif text-xl font-bold text-foreground">
                  {formatEuro(balanco.situacaoLiquida.total)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fundo de reserva: {formatEuro(balanco.situacaoLiquida.fundoReserva)}
                  <br />
                  Resultados acumulados: {formatEuro(balanco.situacaoLiquida.resultadosAcumulados)}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
