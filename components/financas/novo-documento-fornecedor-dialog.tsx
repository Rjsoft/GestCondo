'use client'

import { useState, useTransition } from 'react'
import { criarDocumentoFornecedor } from '@/app/actions/documentos-fornecedor'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

type FornecedorOpcao = { id: number; nome: string }

const SEM_FORNECEDOR = '__sem_fornecedor__'

export function NovoDocumentoFornecedorDialog({
  fornecedores,
}: {
  fornecedores: FornecedorOpcao[]
}) {
  const [open, setOpen] = useState(false)
  const [fornecedorId, setFornecedorId] = useState(SEM_FORNECEDOR)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    if (fornecedorId !== SEM_FORNECEDOR) {
      formData.set('fornecedorId', fornecedorId)
    }
    startTransition(async () => {
      try {
        await criarDocumentoFornecedor(formData)
        toast.success('Documento registado')
        setOpen(false)
        setFornecedorId(SEM_FORNECEDOR)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Novo documento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Documento de fornecedor</DialogTitle>
          <DialogDescription>
            Uma fatura ou recibo de fornecedor, que pode ser liquidado em
            várias tranches — registe os pagamentos depois, separadamente.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Fornecedor (opcional)</Label>
            <Select
              value={fornecedorId}
              onValueChange={(value) => value && setFornecedorId(value)}
            >
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                name="categoria"
                required
                placeholder="Ex: Elevadores, Limpeza"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="numeroDocumento">Nº do documento (opcional)</Label>
              <Input id="numeroDocumento" name="numeroDocumento" placeholder="Ex: FT 2026/123" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataEmissao">Data de emissão</Label>
              <Input id="dataEmissao" name="dataEmissao" type="date" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataVencimento">Data de vencimento (opcional)</Label>
              <Input id="dataVencimento" name="dataVencimento" type="date" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="valor">Valor (€)</Label>
            <Input id="valor" name="valor" type="number" step="0.01" min="0.01" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="anexo">Anexo (fatura/recibo, opcional, até 15MB)</Label>
            <Input
              id="anexo"
              name="anexo"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
