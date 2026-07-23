'use client'

import { useState, useTransition } from 'react'
import { atualizarMovimento } from '@/app/actions/financas'
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
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string }
type FornecedorOpcao = { id: number; nome: string }

const SEM_FORNECEDOR = '__sem_fornecedor__'

function paraInputDate(data: Date) {
  return new Date(data).toISOString().slice(0, 10)
}

export function EditarMovimentoDialog({
  id,
  open,
  onOpenChange,
  tipo,
  categoria,
  descricao,
  valor,
  data,
  destino,
  fracaoId,
  fornecedorId,
  fracoes,
  fornecedores,
}: {
  id: number
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: string
  categoria: string
  descricao: string
  valor: string
  data: Date
  destino: string
  fracaoId: number | null
  fornecedorId: number | null
  fracoes: FracaoOpcao[]
  fornecedores: FornecedorOpcao[]
}) {
  const [fracaoIdValor, setFracaoIdValor] = useState(fracaoId ? String(fracaoId) : '')
  const [fornecedorIdValor, setFornecedorIdValor] = useState(
    fornecedorId ? String(fornecedorId) : SEM_FORNECEDOR,
  )
  const [destinoValor, setDestinoValor] = useState(destino)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('id', String(id))
    formData.set('destino', destinoValor)
    if (tipo === 'receita') formData.set('fracaoId', fracaoIdValor)
    if (tipo === 'despesa' && fornecedorIdValor !== SEM_FORNECEDOR) {
      formData.set('fornecedorId', fornecedorIdValor)
    }
    startTransition(async () => {
      try {
        await atualizarMovimento(formData)
        toast.success('Movimento atualizado')
        onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar movimento</DialogTitle>
          <DialogDescription>
            Corrija os dados deste movimento já lançado. O tipo ({tipo === 'receita' ? 'receita' : 'despesa'})
            não pode ser alterado aqui — elimine e lance de novo se se enganou nisso.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor">Valor (€)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={valor}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" required defaultValue={paraInputDate(data)} />
            </div>
          </div>

          {tipo === 'receita' && (
            <div className="flex flex-col gap-2">
              <Label>Fração</Label>
              <Select value={fracaoIdValor} onValueChange={(v) => v && setFracaoIdValor(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fração" />
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
          )}

          {tipo === 'despesa' && (
            <div className="flex flex-col gap-2">
              <Label>Fornecedor (opcional)</Label>
              <Select value={fornecedorIdValor} onValueChange={(v) => v && setFornecedorIdValor(v)}>
                <SelectTrigger>
                  <SelectValue />
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
          )}

          <div className="flex flex-col gap-2">
            <Label>Destino</Label>
            <Select value={destinoValor} onValueChange={(v) => v && setDestinoValor(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Conta corrente do condomínio</SelectItem>
                <SelectItem value="reserva">Fundo de reserva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input id="categoria" name="categoria" required defaultValue={categoria} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" required defaultValue={descricao} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || (tipo === 'receita' && !fracaoIdValor)}>
              {pending ? 'A guardar...' : 'Guardar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
