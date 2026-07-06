'use client'

import { useState, useTransition } from 'react'
import { criarDocumento } from '@/app/actions/documentos'
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

const CATEGORIAS = [
  { value: 'ata', label: 'Ata' },
  { value: 'regulamento', label: 'Regulamento' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'outro', label: 'Outro' },
]

export function NovoDocumentoDialog() {
  const [open, setOpen] = useState(false)
  const [categoria, setCategoria] = useState('ata')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('categoria', categoria)
    startTransition(async () => {
      try {
        await criarDocumento(formData)
        toast.success('Documento adicionado')
        setOpen(false)
        setCategoria('ata')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao adicionar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Novo documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar documento</DialogTitle>
          <DialogDescription>
            Partilhe atas, regulamentos ou outros documentos com os
            condóminos.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              placeholder="Ex: Ata da assembleia 2026"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              rows={3}
              placeholder="Opcional"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="url">Link do documento</Label>
            <Input id="url" name="url" type="url" placeholder="https://..." />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
