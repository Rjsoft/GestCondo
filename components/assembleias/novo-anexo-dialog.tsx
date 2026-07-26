'use client'

import { useState, useTransition } from 'react'
import { adicionarAnexoAta } from '@/app/actions/assembleias'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'

export function NovoAnexoDialog({ assembleiaId }: { assembleiaId: number }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await adicionarAnexoAta(assembleiaId, formData)
        toast.success('Anexo adicionado')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao adicionar anexo')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Paperclip className="h-4 w-4" />
        Adicionar anexo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar anexo à ata</DialogTitle>
          <DialogDescription>
            Ex: planta, orçamento discutido, proposta de fornecedor mencionada na deliberação.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="anexo-titulo">Título</Label>
            <Input id="anexo-titulo" name="titulo" required placeholder="Ex: Orçamento da obra do telhado" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="anexo-ficheiro">Ficheiro (PDF ou imagem, até 15MB)</Label>
            <Input
              id="anexo-ficheiro"
              name="ficheiro"
              type="file"
              accept="application/pdf,image/*"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar anexo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
