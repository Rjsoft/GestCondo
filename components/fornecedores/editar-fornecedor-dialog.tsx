'use client'

import { useState, useTransition } from 'react'
import { atualizarFornecedor } from '@/app/actions/fornecedores'
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
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

export function EditarFornecedorDialog({
  id,
  nome,
  nif,
  categoria,
  contactoEmail,
  contactoTelefone,
  notas,
}: {
  id: number
  nome: string
  nif: string | null
  categoria: string | null
  contactoEmail: string | null
  contactoTelefone: string | null
  notas: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await atualizarFornecedor(formData)
        toast.success('Fornecedor atualizado')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Editar fornecedor" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar fornecedor</DialogTitle>
          <DialogDescription>Atualize os dados de contacto deste fornecedor.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" defaultValue={id} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={nome} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" name="categoria" defaultValue={categoria ?? ''} placeholder="Ex: Elevadores" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nif">NIF (opcional)</Label>
            <Input id="nif" name="nif" defaultValue={nif ?? ''} placeholder="Ex: 123456789" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactoEmail">Email de contacto</Label>
              <Input
                id="contactoEmail"
                name="contactoEmail"
                type="email"
                defaultValue={contactoEmail ?? ''}
                placeholder="Opcional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactoTelefone">Telefone de contacto</Label>
              <Input
                id="contactoTelefone"
                name="contactoTelefone"
                defaultValue={contactoTelefone ?? ''}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} defaultValue={notas ?? ''} placeholder="Opcional" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
