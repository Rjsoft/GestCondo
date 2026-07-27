'use client'

import { useState, useTransition } from 'react'
import { criarContrato } from '@/app/actions/contratos'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PERIODICIDADES, PERIODICIDADE_LABEL } from '@/lib/fornecedores'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

type FornecedorOpcao = { id: number; nome: string }

const SEM_FORNECEDOR = '__sem_fornecedor__'

export function NovoContratoDialog({ fornecedores }: { fornecedores: FornecedorOpcao[] }) {
  const [open, setOpen] = useState(false)
  const [fornecedorId, setFornecedorId] = useState(SEM_FORNECEDOR)
  const [periodicidade, setPeriodicidade] = useState<string>('anual')
  const [renovacaoAutomatica, setRenovacaoAutomatica] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    if (fornecedorId !== SEM_FORNECEDOR) formData.set('fornecedorId', fornecedorId)
    formData.set('periodicidade', periodicidade)
    formData.set('renovacaoAutomatica', String(renovacaoAutomatica))
    startTransition(async () => {
      try {
        await criarContrato(formData)
        toast.success('Contrato registado')
        setOpen(false)
        setFornecedorId(SEM_FORNECEDOR)
        setPeriodicidade('anual')
        setRenovacaoAutomatica(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Novo contrato
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo contrato</DialogTitle>
          <DialogDescription>
            Registe um contrato recorrente com um fornecedor (elevador, limpeza,
            energia, etc.) para saber quando expira e ser avisado a tempo.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="objeto">Objeto do contrato</Label>
            <Input
              id="objeto"
              name="objeto"
              required
              placeholder="Ex: Manutenção do elevador, Limpeza das partes comuns"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Fornecedor (opcional)</Label>
              <Select value={fornecedorId} onValueChange={(v) => v && setFornecedorId(v)}>
                <SelectTrigger>
                  <SelectValue>
                    {(v: string | null) => {
                      if (v === SEM_FORNECEDOR || v == null) return 'Sem fornecedor associado'
                      const f = fornecedores.find((f) => String(f.id) === v)
                      return f ? f.nome : 'Sem fornecedor associado'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_FORNECEDOR}>Sem fornecedor associado</SelectItem>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoria (opcional)</Label>
              <Input id="categoria" name="categoria" placeholder="Ex: Elevadores" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor">Valor (€, opcional)</Label>
              <Input id="valor" name="valor" type="number" step="0.01" min="0" placeholder="0,00" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Periodicidade</Label>
              <Select value={periodicidade} onValueChange={(v) => v && setPeriodicidade(v)}>
                <SelectTrigger>
                  <SelectValue>{(v: string | null) => (v ? PERIODICIDADE_LABEL[v as keyof typeof PERIODICIDADE_LABEL] : '')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PERIODICIDADES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PERIODICIDADE_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataInicio">Início do contrato</Label>
              <Input id="dataInicio" name="dataInicio" type="date" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataFim">Fim / próxima renovação (opcional)</Label>
              <Input id="dataFim" name="dataFim" type="date" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={renovacaoAutomatica}
              onCheckedChange={(v) => setRenovacaoAutomatica(v === true)}
            />
            Renovação automática
          </label>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prazoDenunciaDias">Prazo de denúncia, em dias (opcional)</Label>
            <Input
              id="prazoDenunciaDias"
              name="prazoDenunciaDias"
              type="number"
              step="1"
              min="0"
              placeholder="Ex: 90"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Detalhes, condições, contactos" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="anexo">Contrato em PDF (opcional, até 15MB)</Label>
            <Input id="anexo" name="anexo" type="file" accept="application/pdf" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar contrato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
