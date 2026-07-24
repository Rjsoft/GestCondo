'use client'

import { useState, useTransition } from 'react'
import { criarContaFinanceira } from '@/app/actions/contas-financeiras'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIPO_CONTA_LABEL, TIPOS_CONTA } from '@/lib/financas'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NovaContaFinanceiraDialog({
  exercicioAtivo,
  trigger,
  onCriada,
}: {
  exercicioAtivo: { id: number; designacao: string } | null
  /** Botão próprio por omissão — passar um trigger diferente quando usado dentro do assistente. */
  trigger?: React.ReactElement
  onCriada?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('ordem')
  const [avancadas, setAvancadas] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('tipo', tipo)
    if (exercicioAtivo) formData.set('exercicioId', String(exercicioAtivo.id))
    startTransition(async () => {
      try {
        await criarContaFinanceira(formData)
        toast.success('Conta registada')
        setOpen(false)
        setTipo('ordem')
        setAvancadas(false)
        onCriada?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button variant="outline" size="sm" />}>
        {!trigger && (
          <>
            <Plus className="h-4 w-4" />
            Nova conta
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar conta do condomínio</DialogTitle>
          <DialogDescription>
            Uma conta bancária, a prazo ou de caixa que pertence ao condomínio — não uma conta
            pessoal de quem administra.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome da conta</Label>
            <Input id="nome" name="nome" required placeholder="Ex: Conta à Ordem BCP" />
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
            {tipo === 'caixa' && (
              <p className="text-xs text-muted-foreground">
                Dinheiro existente fora das contas bancárias — não precisa de banco nem de IBAN.
              </p>
            )}
            {tipo === 'transitoria' && (
              <p className="text-xs text-muted-foreground">
                Situação excecional — para uma conta antiga ou temporária a regularizar, não para
                uso normal.
              </p>
            )}
          </div>

          {tipo !== 'caixa' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="banco">Banco (opcional)</Label>
                <Input id="banco" name="banco" placeholder="Ex: BCP" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="iban">IBAN (opcional)</Label>
                <Input id="iban" name="iban" placeholder="PT50..." />
              </div>
            </div>
          )}

          {tipo === 'transitoria' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="notaTransitoria">Motivo desta conta temporária ou de transição</Label>
              <Input id="notaTransitoria" name="notaTransitoria" required />
            </div>
          )}

          {exercicioAtivo && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="saldoInicial">Saldo inicial (opcional)</Label>
                <Input id="saldoInicial" name="saldoInicial" type="number" step="0.01" placeholder="0,00" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>No exercício</Label>
                <Input disabled value={exercicioAtivo.designacao} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAvancadas((v) => !v)}
            className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            {avancadas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Opções avançadas
          </button>
          {avancadas && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="moeda">Moeda</Label>
                <Input id="moeda" name="moeda" defaultValue="EUR" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dataAbertura">Data de abertura</Label>
                <Input id="dataAbertura" name="dataAbertura" type="date" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
