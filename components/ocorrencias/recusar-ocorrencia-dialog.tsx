'use client'

import { useState, useTransition } from 'react'
import { recusarOcorrenciaFornecedor } from '@/app/actions/ocorrencias'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function RecusarOcorrenciaDialog({
  id,
  open,
  onOpenChange,
}: {
  id: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [motivo, setMotivo] = useState('')
  const [pending, startTransition] = useTransition()

  const confirmar = () => {
    startTransition(async () => {
      try {
        await recusarOcorrenciaFornecedor(id, motivo)
        toast.success('Trabalho recusado')
        setMotivo('')
        onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recusar trabalho</DialogTitle>
          <DialogDescription>
            A ocorrência volta a ficar aberta e sem fornecedor atribuído. Indique o motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo">Motivo</Label>
          <Textarea
            id="motivo"
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: Sem disponibilidade esta semana"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={pending || !motivo.trim()}>
            {pending ? 'A recusar...' : 'Recusar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
