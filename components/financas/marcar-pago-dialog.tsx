'use client'

import { useState, useTransition } from 'react'
import { marcarComoPago } from '@/app/actions/financas'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MEIO_PAGAMENTO_LABEL } from '@/lib/financas'
import { toast } from 'sonner'

export function MarcarPagoDialog({
  id,
  open,
  onOpenChange,
}: {
  id: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [meioPagamento, setMeioPagamento] = useState('')
  const [referenciaMb, setReferenciaMb] = useState('')
  const [dataLiquidacao, setDataLiquidacao] = useState('')
  const [pending, startTransition] = useTransition()

  const confirmar = () => {
    startTransition(async () => {
      try {
        await marcarComoPago(id, { meioPagamento, referenciaMb, dataLiquidacao })
        toast.success('Marcado como pago')
        onOpenChange(false)
        setMeioPagamento('')
        setReferenciaMb('')
        setDataLiquidacao('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como pago</DialogTitle>
          <DialogDescription>
            O detalhe do pagamento é opcional — pode saltar e preencher mais tarde.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Meio de pagamento</Label>
              <Select
                value={meioPagamento}
                onValueChange={(value) => setMeioPagamento(value ?? '')}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(v: string | null) => (v ? MEIO_PAGAMENTO_LABEL[v] : 'Não especificado')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="multibanco">Multibanco</SelectItem>
                  <SelectItem value="numerario">Numerário</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="marcar-data-liquidacao">Data de liquidação</Label>
              <Input
                id="marcar-data-liquidacao"
                type="date"
                value={dataLiquidacao}
                onChange={(e) => setDataLiquidacao(e.target.value)}
              />
            </div>
          </div>
          {meioPagamento === 'multibanco' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="marcar-referencia-mb">Referência multibanco</Label>
              <Input
                id="marcar-referencia-mb"
                value={referenciaMb}
                onChange={(e) => setReferenciaMb(e.target.value)}
                placeholder="Ex: Entidade 12345 Referência 123 456 789"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={confirmar} disabled={pending}>
            {pending ? 'A guardar...' : 'Marcar como pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
