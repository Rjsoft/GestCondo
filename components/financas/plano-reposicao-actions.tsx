'use client'

import { useState, useTransition } from 'react'
import { cancelarPlanoReposicao, concluirPlanoReposicao } from '@/app/actions/fundo-reserva'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'

export function PlanoReposicaoActions({
  id,
  onSucesso,
}: {
  id: number
  onSucesso: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [concluirOpen, setConcluirOpen] = useState(false)
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const [motivo, setMotivo] = useState('')

  const concluir = () => {
    startTransition(async () => {
      try {
        await concluirPlanoReposicao(id)
        toast.success('Plano de reposição concluído')
        setConcluirOpen(false)
        onSucesso()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao concluir')
      }
    })
  }

  const cancelar = () => {
    startTransition(async () => {
      try {
        await cancelarPlanoReposicao(id, motivo)
        toast.success('Plano de reposição cancelado')
        setCancelarOpen(false)
        setMotivo('')
        onSucesso()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao cancelar')
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={() => setConcluirOpen(true)}>
        <Check className="h-4 w-4" />
        Concluir
      </Button>
      <Dialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <X className="h-4 w-4" />
          Cancelar
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar plano de reposição</DialogTitle>
            <DialogDescription>
              Indique o motivo — fica registado no histórico de auditoria. Não elimina o plano,
              só marca como cancelado (continua visível no histórico).
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo-cancelamento">Motivo</Label>
            <Textarea
              id="motivo-cancelamento"
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: valor entretanto reposto de outra forma, sem necessidade de plano formal"
            />
          </div>
          <DialogFooter>
            <Button onClick={cancelar} disabled={pending || !motivo.trim()}>
              {pending ? 'A cancelar...' : 'Cancelar plano'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={concluirOpen}
        onOpenChange={setConcluirOpen}
        title="Concluir plano de reposição"
        description="Marca o plano como concluído, com o valor reposto até agora. Use quando o fundo já estiver reposto (mesmo que o valor não bata certo — a diferença fica registada)."
        confirmLabel="Concluir"
        onConfirm={concluir}
        pending={pending}
      />
    </div>
  )
}
