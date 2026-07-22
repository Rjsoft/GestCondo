'use client'

import { useState, useTransition } from 'react'
import { criarOrcamento } from '@/app/actions/orcamentos'
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

export function NovoOrcamentoDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await criarOrcamento(formData)
        toast.success('Orçamento guardado')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao guardar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Novo orçamento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Orçamento anual</DialogTitle>
          <DialogDescription>
            Registe o valor total aprovado em assembleia para o ano. Se já
            existir um orçamento para o mesmo ano, o valor anterior é
            substituído.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                name="ano"
                type="number"
                step="1"
                required
                defaultValue={new Date().getFullYear()}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="valorAnual">Valor anual (€)</Label>
              <Input
                id="valorAnual"
                name="valorAnual"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="valorAnualElevador">Valor anual do elevador (opcional)</Label>
            <Input
              id="valorAnualElevador"
              name="valorAnualElevador"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
            />
            <p className="text-xs text-muted-foreground">
              Se preenchido, esta parcela é rateada só pelas frações não isentas de elevador
              (ver &quot;Frações&quot;) — o resto do orçamento continua a ser rateado por
              permilagem entre todas.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              name="notas"
              rows={3}
              placeholder="Ex: aprovado em assembleia de 15/1/2026"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar orçamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
