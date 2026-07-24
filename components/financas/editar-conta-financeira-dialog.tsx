'use client'

import { useState, useTransition } from 'react'
import { atualizarContaFinanceira } from '@/app/actions/contas-financeiras'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIPO_CONTA_LABEL, TIPOS_CONTA } from '@/lib/financas'
import { toast } from 'sonner'

export function EditarContaFinanceiraDialog({
  open,
  onOpenChange,
  conta,
  onSucesso,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSucesso?: () => void
  conta: {
    id: number
    nome: string
    banco: string | null
    iban: string | null
    tipo: string
    moeda: string
    notaTransitoria: string | null
  }
}) {
  const [tipo, setTipo] = useState(conta.tipo)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('id', String(conta.id))
    formData.set('tipo', tipo)
    startTransition(async () => {
      try {
        await atualizarContaFinanceira(formData)
        toast.success('Conta atualizada')
        onOpenChange(false)
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conta</DialogTitle>
          <DialogDescription>Alterar os dados desta conta do condomínio.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-editar">Nome da conta</Label>
            <Input id="nome-editar" name="nome" required defaultValue={conta.nome} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tipo de conta</Label>
            <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
              <SelectTrigger>
                <SelectValue>{(v: string | null) => (v ? TIPO_CONTA_LABEL[v] : '')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CONTA.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_CONTA_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tipo !== 'caixa' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="banco-editar">Banco (opcional)</Label>
                <Input id="banco-editar" name="banco" defaultValue={conta.banco ?? ''} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="iban-editar">IBAN (opcional)</Label>
                <Input id="iban-editar" name="iban" defaultValue={conta.iban ?? ''} />
              </div>
            </div>
          )}
          {tipo === 'transitoria' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="notaTransitoria-editar">Motivo desta conta temporária ou de transição</Label>
              <Input
                id="notaTransitoria-editar"
                name="notaTransitoria"
                required
                defaultValue={conta.notaTransitoria ?? ''}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="moeda-editar">Moeda</Label>
            <Input id="moeda-editar" name="moeda" defaultValue={conta.moeda} />
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
