'use client'

import { useState, useTransition } from 'react'
import { criarAviso } from '@/app/actions/avisos'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NovoAvisoDialog() {
  const [open, setOpen] = useState(false)
  const [prioridade, setPrioridade] = useState('normal')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('prioridade', prioridade)
    startTransition(async () => {
      try {
        await criarAviso(formData)
        toast.success('Aviso publicado')
        setOpen(false)
        setPrioridade('normal')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao publicar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Novo aviso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publicar aviso</DialogTitle>
          <DialogDescription>
            O aviso ficará visível para todos os condóminos.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" name="titulo" required placeholder="Ex: Corte de água" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea
              id="conteudo"
              name="conteudo"
              required
              rows={4}
              placeholder="Descreva o comunicado..."
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="importante">Importante</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A publicar...' : 'Publicar aviso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
