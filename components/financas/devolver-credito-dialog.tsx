'use client'

import { useTransition } from 'react'
import { devolverCreditoFracao } from '@/app/actions/creditos'
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
import { Textarea } from '@/components/ui/textarea'
import { formatEuro } from '@/lib/format'
import { toast } from 'sonner'

export function DevolverCreditoDialog({
  fracaoId,
  saldo,
  open,
  onOpenChange,
}: {
  fracaoId: number
  saldo: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('fracaoId', String(fracaoId))
    startTransition(async () => {
      try {
        await devolverCreditoFracao(formData)
        toast.success('Devolução registada')
        onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar devolução')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolver crédito</DialogTitle>
          <DialogDescription>
            Crédito disponível: <strong>{formatEuro(saldo)}</strong>. Regista que o dinheiro foi
            devolvido ao condómino (fora da aplicação — não gera uma transferência real).
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="valor">Valor a devolver (€)</Label>
            <Input
              id="valor"
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              max={saldo}
              required
              placeholder="0,00"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" name="data" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Ex: devolvido por transferência bancária" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A registar...' : 'Registar devolução'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
