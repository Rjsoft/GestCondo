'use client'

import { useState, useTransition } from 'react'
import { atualizarContrato } from '@/app/actions/contratos'
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
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

type FornecedorOpcao = { id: number; nome: string }

const SEM_FORNECEDOR = '__sem_fornecedor__'

function paraInputDate(d: Date | null): string {
  if (!d) return ''
  return new Date(d).toISOString().slice(0, 10)
}

export function EditarContratoDialog({
  id,
  fornecedorId,
  objeto,
  categoria,
  valor,
  periodicidade,
  dataInicio,
  dataFim,
  renovacaoAutomatica,
  prazoDenunciaDias,
  notas,
  fornecedores,
}: {
  id: number
  fornecedorId: number | null
  objeto: string
  categoria: string | null
  valor: string | null
  periodicidade: string
  dataInicio: Date
  dataFim: Date | null
  renovacaoAutomatica: boolean
  prazoDenunciaDias: number | null
  notas: string | null
  fornecedores: FornecedorOpcao[]
}) {
  const [open, setOpen] = useState(false)
  const [fornecedorIdSel, setFornecedorIdSel] = useState(fornecedorId ? String(fornecedorId) : SEM_FORNECEDOR)
  const [periodicidadeSel, setPeriodicidadeSel] = useState(periodicidade)
  const [renovacaoAutomaticaSel, setRenovacaoAutomaticaSel] = useState(renovacaoAutomatica)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('fornecedorId', fornecedorIdSel !== SEM_FORNECEDOR ? fornecedorIdSel : '')
    formData.set('periodicidade', periodicidadeSel)
    formData.set('renovacaoAutomatica', String(renovacaoAutomaticaSel))
    startTransition(async () => {
      try {
        await atualizarContrato(formData)
        toast.success('Contrato atualizado')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Editar contrato" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar contrato</DialogTitle>
          <DialogDescription>Atualize os dados deste contrato.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" defaultValue={id} />

          <div className="flex flex-col gap-2">
            <Label htmlFor="objeto">Objeto do contrato</Label>
            <Input id="objeto" name="objeto" defaultValue={objeto} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Fornecedor (opcional)</Label>
              <Select value={fornecedorIdSel} onValueChange={(v) => v && setFornecedorIdSel(v)}>
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
              <Input id="categoria" name="categoria" defaultValue={categoria ?? ''} placeholder="Ex: Elevadores" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor">Valor (€, opcional)</Label>
              <Input id="valor" name="valor" type="number" step="0.01" min="0" defaultValue={valor ?? ''} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Periodicidade</Label>
              <Select value={periodicidadeSel} onValueChange={(v) => v && setPeriodicidadeSel(v)}>
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
              <Input id="dataInicio" name="dataInicio" type="date" defaultValue={paraInputDate(dataInicio)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataFim">Fim / próxima renovação (opcional)</Label>
              <Input id="dataFim" name="dataFim" type="date" defaultValue={paraInputDate(dataFim)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={renovacaoAutomaticaSel}
              onCheckedChange={(v) => setRenovacaoAutomaticaSel(v === true)}
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
              defaultValue={prazoDenunciaDias ?? ''}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea id="notas" name="notas" rows={2} defaultValue={notas ?? ''} />
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
