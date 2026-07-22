'use client'

import { useState, useTransition } from 'react'
import { criarSeguro } from '@/app/actions/seguros'
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

export function NovoSeguroDialog() {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('multirriscos')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('tipo', tipo)
    startTransition(async () => {
      try {
        await criarSeguro(formData)
        toast.success('Seguro registado')
        setOpen(false)
        setTipo('multirriscos')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Novo seguro
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apólice de seguro</DialogTitle>
          <DialogDescription>
            O seguro do edifício (multirriscos ou incêndio) é obrigatório por
            lei. Registe aqui a apólice em vigor.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="seguradora">Seguradora</Label>
              <Input id="seguradora" name="seguradora" required placeholder="Ex: Fidelidade" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apolice">Nº da apólice</Label>
              <Input id="apolice" name="apolice" required placeholder="Ex: 123456789" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo de seguro</Label>
            <Select value={tipo} onValueChange={(value) => value && setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multirriscos">Multirriscos</SelectItem>
                <SelectItem value="incendio">Incêndio</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataInicio">Início da apólice</Label>
              <Input id="dataInicio" name="dataInicio" type="date" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataFim">Fim da apólice</Label>
              <Input id="dataFim" name="dataFim" type="date" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valorPremio">Prémio anual (€)</Label>
              <Input
                id="valorPremio"
                name="valorPremio"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00 (opcional)"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="capitalSeguro">Capital seguro (€)</Label>
              <Input
                id="capitalSeguro"
                name="capitalSeguro"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00 (opcional)"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Capital seguro é o valor de reconstrução pelo qual o edifício está
            seguro (diferente do prémio) — deve ser atualizado todos os anos.
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="anexo">Apólice em PDF (opcional, até 15MB)</Label>
            <Input id="anexo" name="anexo" type="file" accept="application/pdf" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Opcional" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar seguro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
