'use client'

import { useState, useTransition } from 'react'
import { registarAdiantamentoFracao } from '@/app/actions/creditos'
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

type FracaoOpcao = { id: number; identificacao: string }

export function NovoAdiantamentoDialog({ fracoes }: { fracoes: FracaoOpcao[] }) {
  const [open, setOpen] = useState(false)
  const [fracaoId, setFracaoId] = useState('')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('fracaoId', fracaoId)
    startTransition(async () => {
      try {
        await registarAdiantamentoFracao(formData)
        toast.success('Adiantamento registado')
        setOpen(false)
        setFracaoId('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Registar adiantamento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar adiantamento</DialogTitle>
          <DialogDescription>
            Regista dinheiro pago pelo condómino além do que era devido — fica disponível como
            crédito para aplicar a uma quota futura ou devolver.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Fração</Label>
            <Select value={fracaoId} onValueChange={(value) => value && setFracaoId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fração">
                  {(v: string | null) => {
                    const f = fracoes.find((f) => String(f.id) === v)
                    return f ? f.identificacao : 'Selecione a fração'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fracoes.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.identificacao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="valor">Valor (€)</Label>
            <Input id="valor" name="valor" type="number" step="0.01" min="0.01" required placeholder="0,00" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="data">Data</Label>
            <Input id="data" name="data" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Ex: pagamento em excesso da quota 6/2026" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !fracaoId}>
              {pending ? 'A registar...' : 'Registar adiantamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
