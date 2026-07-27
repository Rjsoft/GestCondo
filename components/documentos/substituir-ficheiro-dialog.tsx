'use client'

import { useTransition } from 'react'
import { substituirFicheiroDocumento } from '@/app/actions/documentos'
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
import { toast } from 'sonner'

export function SubstituirFicheiroDialog({
  id,
  open,
  onOpenChange,
}: {
  id: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await substituirFicheiroDocumento(id, formData)
        toast.success('Ficheiro substituído — a versão anterior ficou guardada no histórico')
        onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao substituir')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Substituir ficheiro</DialogTitle>
          <DialogDescription>
            O ficheiro ou link atual fica guardado no histórico de versões, não é perdido.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ficheiro">Novo ficheiro (PDF ou imagem, até 15MB)</Label>
            <Input id="ficheiro" name="ficheiro" type="file" accept="application/pdf,image/*" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="url">Ou cole um novo link</Label>
            <Input id="url" name="url" type="url" placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo">Motivo da substituição (opcional)</Label>
            <Textarea
              id="motivo"
              name="motivo"
              rows={2}
              placeholder="Ex: correção de erro de digitação, nova versão aprovada em assembleia"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A substituir...' : 'Substituir ficheiro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
