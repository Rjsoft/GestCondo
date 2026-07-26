'use client'

import { useState, useTransition } from 'react'
import { alterarEstadoSubscricao } from '@/app/actions/plataforma'
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
import { Lock } from 'lucide-react'
import { toast } from 'sonner'

export function SuspenderDialog({
  condominioId,
  nomeCondominio,
}: {
  condominioId: number
  nomeCondominio: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    const nota = String(formData.get('nota') || '')
    startTransition(async () => {
      try {
        await alterarEstadoSubscricao(condominioId, 'suspenso', nota)
        toast.success(`${nomeCondominio} suspenso`)
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao suspender')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Lock className="h-4 w-4" />
        Suspender
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspender {nomeCondominio}</DialogTitle>
          <DialogDescription>
            Bloqueia o acesso de todos os membros deste condomínio (incluindo
            administradores) até reativares. A cobrança em si não é afetada
            — trata-a à parte.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nota">Nota (opcional, só tua)</Label>
            <Textarea id="nota" name="nota" rows={3} placeholder="Ex: sem pagamento desde julho" />
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'A suspender...' : 'Suspender'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
