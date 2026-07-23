'use client'

import { useState, useTransition } from 'react'
import { atualizarFracao } from '@/app/actions/fracoes'
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

const TIPOS_TITULAR = [
  { value: 'proprietario', label: 'Proprietário' },
  { value: 'inquilino', label: 'Inquilino' },
  { value: 'usufrutuario', label: 'Usufrutuário' },
  { value: 'locatario', label: 'Locatário' },
  { value: 'antigo', label: 'Antigo condómino' },
] as const

export function EditarFracaoDialog({
  id,
  letra,
  identificacao,
  proprietario,
  tipoTitular,
  nif,
  permilagem,
  contactoEmail,
  contactoTelefone,
  notas,
}: {
  id: number
  letra: string | null
  identificacao: string
  proprietario: string
  tipoTitular: string | null
  nif: string | null
  permilagem: number
  contactoEmail: string | null
  contactoTelefone: string | null
  notas: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await atualizarFracao(formData)
        toast.success('Fração atualizada')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Editar fração" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar fração</DialogTitle>
          <DialogDescription>Atualize os dados desta fração.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" defaultValue={id} />
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="letra">Letra (opcional)</Label>
              <Input id="letra" name="letra" defaultValue={letra ?? ''} placeholder="Ex: A" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="identificacao">Identificação</Label>
              <Input
                id="identificacao"
                name="identificacao"
                defaultValue={identificacao}
                required
                placeholder="Ex: R/C Dto"
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
                defaultValue={permilagem}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="proprietario">Proprietário</Label>
              <Input id="proprietario" name="proprietario" defaultValue={proprietario} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tipoTitular">Tipo de titular</Label>
              <select
                id="tipoTitular"
                name="tipoTitular"
                defaultValue={tipoTitular ?? ''}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Não especificado</option>
                {TIPOS_TITULAR.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nif">NIF (opcional)</Label>
              <Input id="nif" name="nif" defaultValue={nif ?? ''} placeholder="Ex: 123456789" />
            </div>
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
