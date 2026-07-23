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
import { DESTINO_LABEL, MEIO_PAGAMENTO_LABEL, TIPO_MOVIMENTO_LABEL } from '@/lib/financas'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string }
type FornecedorOpcao = { id: number; nome: string }

const SEM_FORNECEDOR = '__sem_fornecedor__'

export function NovoMovimentoDialog({
  fracoes,
  fornecedores,
}: {
  fracoes: FracaoOpcao[]
  fornecedores: FornecedorOpcao[]
}) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('despesa')
  const [fracaoId, setFracaoId] = useState('')
  const [fornecedorId, setFornecedorId] = useState(SEM_FORNECEDOR)
  const [destino, setDestino] = useState('geral')
  const [pago, setPago] = useState(true)
  const [meioPagamento, setMeioPagamento] = useState('')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('tipo', tipo)
    formData.set('destino', destino)
    if (tipo === 'receita') formData.set('fracaoId', fracaoId)
    if (tipo === 'despesa' && fornecedorId !== SEM_FORNECEDOR) {
      formData.set('fornecedorId', fornecedorId)
    }
    if (pago) formData.set('meioPagamento', meioPagamento)
    startTransition(async () => {
      try {
        await criarMovimento(formData)
        toast.success('Movimento registado')
        setOpen(false)
        setFracaoId('')
        setFornecedorId(SEM_FORNECEDOR)
        setDestino('geral')
        setPago(true)
        setMeioPagamento('')
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
                  <SelectValue>{(v: string | null) => (v ? TIPO_MOVIMENTO_LABEL[v] : '')}</SelectValue>
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
                  <SelectValue placeholder="Selecione a fração">
                    {(v: string | null) => {
                      const f = fracoes.find((f) => String(f.id) === v)
                      return f ? f.identificacao : 'Selecione a fração'
                    }}
                  </SelectValue>
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

          {tipo === 'despesa' && (
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
          )}

          <div className="flex flex-col gap-2">
            <Label>Destino</Label>
            <Select
              value={destino}
              onValueChange={(value) => value && setDestino(value)}
            >
              <SelectTrigger>
                <SelectValue>{(v: string | null) => (v ? DESTINO_LABEL[v] : '')}</SelectValue>
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
                checked={pago}
                onChange={(e) => setPago(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="pago" className="font-normal">
                Pago / liquidado
              </Label>
            </div>
          </div>

          {pago && (
            <div className="flex flex-col gap-3 rounded-md border border-border p-3">
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
                  <Label htmlFor="dataLiquidacao">Data de liquidação</Label>
                  <Input id="dataLiquidacao" name="dataLiquidacao" type="date" />
                </div>
              </div>
              {meioPagamento === 'multibanco' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="referenciaMb">Referência multibanco</Label>
                  <Input
                    id="referenciaMb"
                    name="referenciaMb"
                    placeholder="Ex: Entidade 12345 Referência 123 456 789"
                  />
                </div>
              )}
            </div>
          )}

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
