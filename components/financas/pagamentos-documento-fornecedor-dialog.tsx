'use client'

import { useState, useTransition } from 'react'
import { registarPagamentoDocumentoFornecedor } from '@/app/actions/documentos-fornecedor'
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
import { formatEuro, formatData } from '@/lib/format'
import { toast } from 'sonner'

type Pagamento = {
  id: number
  valor: string
  dataPagamento: Date
  movimentoId: number | null
}

export function PagamentosDocumentoFornecedorDialog({
  documentoFornecedorId,
  categoria,
  valor,
  valorPago,
  saldo,
  pagamentos,
  open,
  onOpenChange,
}: {
  documentoFornecedorId: number
  categoria: string
  valor: number
  valorPago: number
  saldo: number
  pagamentos: Pagamento[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [novoValor, setNovoValor] = useState('')
  const [novaData, setNovaData] = useState('')
  const [novoMovimentoId, setNovoMovimentoId] = useState('')
  const [pending, startTransition] = useTransition()

  const registar = () => {
    const formData = new FormData()
    formData.set('documentoFornecedorId', String(documentoFornecedorId))
    formData.set('valor', novoValor)
    formData.set('dataPagamento', novaData)
    if (novoMovimentoId) formData.set('movimentoId', novoMovimentoId)

    startTransition(async () => {
      try {
        await registarPagamentoDocumentoFornecedor(formData)
        toast.success('Pagamento registado')
        setNovoValor('')
        setNovaData('')
        setNovoMovimentoId('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar pagamento')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagamentos — {categoria}</DialogTitle>
          <DialogDescription>
            {formatEuro(valorPago)} pago de {formatEuro(valor)}
            {saldo > 0 && ` — ${formatEuro(saldo)} por liquidar`}
            {saldo < 0 && ` — pago em excesso em ${formatEuro(Math.abs(saldo))}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {pagamentos.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Ainda não há pagamentos registados.</p>
          )}
          {pagamentos.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{formatData(p.dataPagamento)}</span>
              <span className="font-medium">{formatEuro(Number(p.valor))}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Registar novo pagamento</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pagamento-valor">Valor (€)</Label>
              <Input
                id="pagamento-valor"
                type="number"
                step="0.01"
                min="0.01"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pagamento-data">Data do pagamento</Label>
              <Input
                id="pagamento-data"
                type="date"
                value={novaData}
                onChange={(e) => setNovaData(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pagamento-movimento">Nº do movimento associado (opcional)</Label>
            <Input
              id="pagamento-movimento"
              type="number"
              placeholder="Deixe em branco se ainda não foi lançado"
              value={novoMovimentoId}
              onChange={(e) => setNovoMovimentoId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={registar} disabled={pending || !novoValor || !novaData}>
            {pending ? 'A registar...' : 'Registar pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
