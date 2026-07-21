'use client'

import { useState, useTransition } from 'react'
import { criarFracao } from '@/app/actions/fracoes'
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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NovaFracaoDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await criarFracao(formData)
        toast.success('Fração registada')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Nova fração
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar fração</DialogTitle>
          <DialogDescription>
            Adicione uma fração autónoma do condomínio.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="identificacao">Identificação</Label>
              <Input
                id="identificacao"
                name="identificacao"
                required
                placeholder="Ex: 2ºEsq"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="permilagem">Permilagem (‰)</Label>
              <Input
                id="permilagem"
                name="permilagem"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="proprietario">Proprietário</Label>
            <Input
              id="proprietario"
              name="proprietario"
              required
              placeholder="Nome do proprietário"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactoEmail">Email de contacto</Label>
              <Input
                id="contactoEmail"
                name="contactoEmail"
                type="email"
                placeholder="Opcional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactoTelefone">Telefone de contacto</Label>
              <Input
                id="contactoTelefone"
                name="contactoTelefone"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={3} placeholder="Opcional" />
          </div>
          <div className="flex items-start gap-2">
            <input
              id="isentaElevador"
              name="isentaElevador"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isentaElevador" className="font-normal text-xs text-muted-foreground">
              Isenta da parcela do elevador (ex: rés-do-chão sem acesso ao elevador)
            </Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar fração'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
