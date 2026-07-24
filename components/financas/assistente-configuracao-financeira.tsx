'use client'

import { useEffect, useState, useTransition } from 'react'
import { getExercicios, previsualizarAssociacaoExercicio } from '@/app/actions/exercicios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AssociarExercicioDialog } from '@/components/financas/associar-exercicio-dialog'
import { NovaContaFinanceiraDialog } from '@/components/financas/nova-conta-financeira-dialog'
import { NovoExercicioDialog } from '@/components/financas/novo-exercicio-dialog'
import { CheckCircle2 } from 'lucide-react'

type Passo = 1 | 2 | 3

/**
 * Assistente de primeira configuração das contas do condomínio — mostrado
 * em vez da lista normal enquanto não existir pelo menos um exercício
 * financeiro E pelo menos uma conta (ver ExerciciosTab). Guia o
 * administrador por passos sequenciais, reutilizando os mesmos diálogos
 * usados depois na gestão do dia a dia (sem duplicar lógica de criação).
 * Retomável: se o exercício já existir (sessão anterior interrompida entre
 * o passo 1 e o 2), começa diretamente no passo 2.
 */
export function AssistenteConfiguracaoFinanceira({
  exercicioExistente,
  onConcluido,
}: {
  exercicioExistente: { id: number; designacao: string } | null
  onConcluido: () => void
}) {
  const [passo, setPasso] = useState<Passo>(exercicioExistente ? 2 : 1)
  const [exercicioRecente, setExercicioRecente] = useState(exercicioExistente)
  const [movimentosPorAssociar, setMovimentosPorAssociar] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (passo !== 3 || !exercicioRecente) return
    previsualizarAssociacaoExercicio(exercicioRecente.id)
      .then((r) => setMovimentosPorAssociar(r.total))
      .catch(() => setMovimentosPorAssociar(0))
  }, [passo, exercicioRecente])

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <h2 className="font-serif text-xl font-semibold">Configuração inicial das contas do condomínio</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Antes de acompanhar contas e saldos por período, é preciso configurar algumas coisas
          simples: o exercício financeiro (o período, normalmente um ano, a que as contas
          pertencem), pelo menos uma conta do condomínio e, se já houver movimentos lançados,
          associá-los.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 text-left">
          <div className="flex items-center gap-3 rounded-md border border-border p-3">
            {passo > 1 ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-foreground text-xs font-medium">
                1
              </span>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">Criar o primeiro exercício financeiro</p>
              <p className="text-xs text-muted-foreground">O período a que as contas vão pertencer.</p>
            </div>
            {passo === 1 && (
              <NovoExercicioDialog
                trigger={<Button size="sm">Começar</Button>}
                onSucesso={() => {
                  startTransition(async () => {
                    const exercicios = await getExercicios()
                    const aberto = exercicios.find((e) => e.estado === 'aberto') ?? exercicios[0] ?? null
                    setExercicioRecente(aberto ? { id: aberto.id, designacao: aberto.designacao } : null)
                    setPasso(2)
                  })
                }}
              />
            )}
          </div>

          <div
            className={`flex items-center gap-3 rounded-md border border-border p-3 ${passo < 2 ? 'opacity-50' : ''}`}
          >
            {passo > 2 ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-foreground text-xs font-medium">
                2
              </span>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">Adicionar a primeira conta</p>
              <p className="text-xs text-muted-foreground">
                A conta bancária, a prazo ou de caixa do condomínio.
              </p>
            </div>
            {passo === 2 && (
              <NovaContaFinanceiraDialog
                exercicioAtivo={exercicioRecente}
                trigger={<Button size="sm">Adicionar conta</Button>}
                onCriada={() => setPasso(3)}
              />
            )}
          </div>

          <div
            className={`flex flex-col items-start gap-3 rounded-md border border-border p-3 ${passo < 3 ? 'opacity-50' : ''}`}
          >
            <div className="flex w-full items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-foreground text-xs font-medium">
                3
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Associar movimentos já existentes</p>
                <p className="text-xs text-muted-foreground">
                  Movimentos lançados antes desta configuração, para ficarem ligados ao exercício.
                </p>
              </div>
            </div>
            {passo === 3 && exercicioRecente && (
              <div className="flex w-full flex-col items-start gap-2 pl-8">
                {movimentosPorAssociar === null && (
                  <p className="text-xs text-muted-foreground">A verificar...</p>
                )}
                {movimentosPorAssociar === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Não há movimentos antigos por associar.
                  </p>
                )}
                {movimentosPorAssociar !== null && movimentosPorAssociar > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Encontrados {movimentosPorAssociar} movimento(s) sem exercício atribuído.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {movimentosPorAssociar !== null && movimentosPorAssociar > 0 && (
                    <AssociarExercicioDialog
                      exercicioId={exercicioRecente.id}
                      designacao={exercicioRecente.designacao}
                      onSucesso={onConcluido}
                    />
                  )}
                  <Button size="sm" variant="outline" onClick={onConcluido}>
                    {movimentosPorAssociar ? 'Fazer isto mais tarde' : 'Concluir configuração'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
