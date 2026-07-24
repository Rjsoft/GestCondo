'use client'

import { useTransition } from 'react'
import { definirSaldoInicial } from '@/app/actions/contas-financeiras'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function DefinirSaldoInicialDialog({
  open,
  onOpenChange,
  contaFinanceiraId,
  nomeConta,
  exercicioId,
  designacaoExercicio,
  valorAtual,
  onSucesso,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contaFinanceiraId: number
  nomeConta: string
  exercicioId: number
  designacaoExercicio: string
  valorAtual: number
  onSucesso?: () => void
}) {
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('contaFinanceiraId', String(contaFinanceiraId))
    formData.set('exercicioId', String(exercicioId))
    startTransition(async () => {
      try {
        await definirSaldoInicial(formData)
        toast.success('Saldo inicial atualizado')
        onOpenChange(false)
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Saldo inicial — {nomeConta}</DialogTitle>
          <DialogDescription>
            Valor com que esta conta começa no exercício &quot;{designacaoExercicio}&quot;.
            Alterar este valor fica registado no histórico de auditoria (valor anterior →
            novo valor).
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="valor-saldo-inicial">Saldo inicial (€)</Label>
            <Input
              id="valor-saldo-inicial"
              name="valor"
              type="number"
              step="0.01"
              required
              defaultValue={valorAtual.toFixed(2)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar saldo inicial'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
