'use client'

import { useState, useTransition } from 'react'
import { reabrirExercicio } from '@/app/actions/exercicios'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Unlock } from 'lucide-react'
import { toast } from 'sonner'

export function ReabrirExercicioDialog({
  exercicioId,
  designacao,
  onSucesso,
}: {
  exercicioId: number
  designacao: string
  onSucesso?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [pending, startTransition] = useTransition()

  const confirmar = () => {
    startTransition(async () => {
      try {
        await reabrirExercicio(exercicioId, motivo)
        toast.success('Exercício reaberto')
        setOpen(false)
        setMotivo('')
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao reabrir')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Unlock className="h-4 w-4" />
        Reabrir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reabrir exercício &quot;{designacao}&quot;</DialogTitle>
          <DialogDescription>
            Volta a permitir alterações a movimentos deste período. Indique o motivo — fica
            registado no histórico de auditoria.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo">Motivo da reabertura</Label>
          <Textarea
            id="motivo"
            rows={3}
            required
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: correção de um movimento lançado no exercício errado"
          />
        </div>
        <DialogFooter>
          <Button onClick={confirmar} disabled={pending || !motivo.trim()}>
            {pending ? 'A reabrir...' : 'Reabrir exercício'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
