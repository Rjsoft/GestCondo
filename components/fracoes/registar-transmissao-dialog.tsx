'use client'

import { useState, useTransition } from 'react'
import { registarTransmissaoFracao } from '@/app/actions/fracoes'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatEuro } from '@/lib/format'
import { DECISAO_SALDO_LABEL, type DecisaoSaldo } from '@/lib/fracoes'
import { toast } from 'sonner'

export function RegistarTransmissaoDialog({
  fracaoId,
  proprietarioAtual,
  emDivida,
  open,
  onOpenChange,
}: {
  fracaoId: number
  proprietarioAtual: string
  emDivida: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [decisaoSaldo, setDecisaoSaldo] = useState('transferido')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('decisaoSaldo', decisaoSaldo)
    startTransition(async () => {
      try {
        await registarTransmissaoFracao(fracaoId, formData)
        toast.success(
          'Transmissão registada. Lembre-se de gerir o acesso à app em "Condóminos" (remover a conta antiga, ligar a do novo titular) e, se necessário, emitir a declaração de dívida.',
        )
        onOpenChange(false)
        setDecisaoSaldo('transferido')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar transmissão da fração</DialogTitle>
          <DialogDescription>
            Vendedor atual: <strong>{proprietarioAtual}</strong>. Saldo em dívida à data:{' '}
            <strong>{formatEuro(emDivida)}</strong>. Atualiza o proprietário da fração e guarda o
            histórico da transmissão.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="compradorNome">Novo titular (comprador/herdeiro)</Label>
            <Input id="compradorNome" name="compradorNome" required placeholder="Nome completo" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="compradorNif">NIF do novo titular (opcional)</Label>
            <Input id="compradorNif" name="compradorNif" placeholder="Ex: 123456789" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dataEscritura">Data da escritura</Label>
            <Input id="dataEscritura" name="dataEscritura" type="date" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Decisão sobre o saldo em dívida</Label>
            <Select value={decisaoSaldo} onValueChange={(value) => value && setDecisaoSaldo(value)}>
              <SelectTrigger>
                <SelectValue>{(v: string | null) => (v ? DECISAO_SALDO_LABEL[v as DecisaoSaldo] : '')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transferido">Transferido para o novo titular</SelectItem>
                <SelectItem value="mantido_vendedor">Mantido como dívida do vendedor</SelectItem>
                <SelectItem value="regularizado">Regularizado no ato da escritura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Ex: sucessão por óbito, herdeiro único" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A registar...' : 'Registar transmissão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
