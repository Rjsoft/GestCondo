'use client'

import { useState, useTransition } from 'react'
import { criarFornecedor } from '@/app/actions/fornecedores'
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

export function NovoFornecedorDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await criarFornecedor(formData)
        toast.success('Fornecedor registado')
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
        Novo fornecedor
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar fornecedor</DialogTitle>
          <DialogDescription>
            Contacto de um fornecedor ou prestador de serviços do condomínio (ex: elevadores,
            limpeza, seguros).
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required placeholder="Ex: Schindler" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" name="categoria" placeholder="Ex: Elevadores" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nif">NIF (opcional)</Label>
            <Input id="nif" name="nif" placeholder="Ex: 123456789" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactoEmail">Email de contacto</Label>
              <Input id="contactoEmail" name="contactoEmail" type="email" placeholder="Opcional" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contactoTelefone">Telefone de contacto</Label>
              <Input id="contactoTelefone" name="contactoTelefone" placeholder="Opcional" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Opcional" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar fornecedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
