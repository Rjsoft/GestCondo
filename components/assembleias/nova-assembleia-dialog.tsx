'use client'

import { useState, useTransition } from 'react'
import { criarAssembleia } from '@/app/actions/assembleias'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NovaAssembleiaDialog() {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('ordinaria')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('tipo', tipo)
    startTransition(async () => {
      try {
        await criarAssembleia(formData)
        toast.success('Assembleia convocada — email enviado aos condóminos')
        setOpen(false)
        setTipo('ordinaria')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao convocar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Convocar assembleia
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convocar assembleia</DialogTitle>
          <DialogDescription>
            Todos os condóminos aprovados recebem um email com a data, hora
            e local. A ordem de trabalhos adiciona-se depois, na página da
            assembleia.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(value) => value && setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinaria">Ordinária</SelectItem>
                <SelectItem value="extraordinaria">Extraordinária</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              name="local"
              required
              placeholder="Ex: Hall de entrada, Sala de condomínio"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataPrimeiraConvocatoria">1ª convocatória</Label>
              <Input
                id="dataPrimeiraConvocatoria"
                name="dataPrimeiraConvocatoria"
                type="datetime-local"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataSegundaConvocatoria">2ª convocatória (opcional)</Label>
              <Input
                id="dataSegundaConvocatoria"
                name="dataSegundaConvocatoria"
                type="datetime-local"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A convocar...' : 'Convocar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
