'use client'

import { useState, useTransition } from 'react'
import { criarOcorrencia } from '@/app/actions/ocorrencias'
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
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'ruido', label: 'Ruído' },
  { value: 'outro', label: 'Outro' },
]

export function NovaOcorrenciaDialog() {
  const [open, setOpen] = useState(false)
  const [categoria, setCategoria] = useState('manutencao')
  const [prioridade, setPrioridade] = useState('normal')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('categoria', categoria)
    formData.set('prioridade', prioridade)
    startTransition(async () => {
      try {
        await criarOcorrencia(formData)
        toast.success('Ocorrência reportada')
        setOpen(false)
        setCategoria('manutencao')
        setPrioridade('normal')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao reportar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Reportar ocorrência
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar ocorrência</DialogTitle>
          <DialogDescription>
            Descreva o problema ou pedido de manutenção.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              placeholder="Ex: Luz fundida na garagem"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              required
              rows={4}
              placeholder="Descreva o problema..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="local">Local</Label>
              <Input id="local" name="local" placeholder="Ex: Garagem" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Categoria</Label>
              <Select
                value={categoria}
                onValueChange={(value) => value && setCategoria(value)}
              >
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
          </div>
          <div className="flex flex-col gap-2">
            <Label>Prioridade</Label>
            <Select
              value={prioridade}
              onValueChange={(value) => value && setPrioridade(value)}
            >
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
              {pending ? 'A enviar...' : 'Reportar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
