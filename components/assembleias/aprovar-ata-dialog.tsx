'use client'

import { useState, useTransition } from 'react'
import { aprovarAta } from '@/app/actions/assembleias'
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
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function AprovarAtaDialog({
  assembleiaId,
  textoAtaAtual,
}: {
  assembleiaId: number
  textoAtaAtual: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    const textoAta = String(formData.get('textoAta') || '')
    startTransition(async () => {
      try {
        await aprovarAta(assembleiaId, textoAta)
        toast.success('Ata aprovada — a assembleia está agora encerrada')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao aprovar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <CheckCircle2 className="h-4 w-4" />
        Aprovar ata
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprovar ata</DialogTitle>
          <DialogDescription>
            Depois de aprovada, a ordem de trabalhos, presenças e votos
            desta assembleia ficam bloqueados a novas alterações.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="textoAta">Texto da ata</Label>
            <Textarea
              id="textoAta"
              name="textoAta"
              rows={8}
              defaultValue={textoAtaAtual ?? ''}
              placeholder="Resumo da reunião, intervenções relevantes e deliberações tomadas..."
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A aprovar...' : 'Aprovar e encerrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
