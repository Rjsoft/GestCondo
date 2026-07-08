'use client'

import { useState, useTransition } from 'react'
import { criarMovimento } from '@/app/actions/financas'
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

type FracaoOpcao = { id: number; identificacao: string }

export function NovoMovimentoDialog({ fracoes }: { fracoes: FracaoOpcao[] }) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('despesa')
  const [fracaoId, setFracaoId] = useState('')
  const [destino, setDestino] = useState('geral')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('tipo', tipo)
    formData.set('destino', destino)
    if (tipo === 'receita') formData.set('fracaoId', fracaoId)
    startTransition(async () => {
      try {
        await criarMovimento(formData)
        toast.success('Movimento registado')
        setOpen(false)
        setFracaoId('')
        setDestino('geral')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Novo movimento
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo movimento financeiro</DialogTitle>
          <DialogDescription>
            Registe uma receita (quota) ou uma despesa do condomínio.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(value) => value && setTipo(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita (quota)</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor">Valor (€)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
              />
            </div>
          </div>

          {tipo === 'receita' && (
            <div className="flex flex-col gap-2">
              <Label>Fração</Label>
              <Select
                value={fracaoId}
                onValueChange={(value) => value && setFracaoId(value)}
              >
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
              {fracoes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ainda não existem frações registadas — registe uma fração
                  antes de lançar uma quota.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Destino</Label>
            <Select
              value={destino}
              onValueChange={(value) => value && setDestino(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geral">Conta corrente do condomínio</SelectItem>
                <SelectItem value="reserva">Fundo de reserva</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              O fundo de reserva é obrigatório por lei e é seguido à parte
              das contas correntes.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              name="categoria"
              required
              placeholder="Ex: Quota mensal, Limpeza, Elevador"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              name="descricao"
              required
              placeholder="Breve descrição"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="data">Data</Label>
              <Input id="data" name="data" type="date" />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="pago"
                name="pago"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="pago" className="font-normal">
                Pago / liquidado
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending || (tipo === 'receita' && !fracaoId)}
            >
              {pending ? 'A guardar...' : 'Guardar movimento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
