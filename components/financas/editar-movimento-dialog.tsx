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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from '@/components/ui/collapsible'
import { DESTINO_LABEL } from '@/lib/financas'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string }
type FornecedorOpcao = { id: number; nome: string }
type PontoAssembleiaOpcao = { id: number; titulo: string; assembleiaData: string }

const SEM_FORNECEDOR = '__sem_fornecedor__'
const SEM_DELIBERACAO = '__sem_deliberacao__'

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
  assembleiaPontoId,
  pagadorNome,
  pagadorNif,
  requerAprovacao,
  urgente,
  justificacaoUrgencia,
  fracoes,
  fornecedores,
  pontosAssembleia,
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
  assembleiaPontoId: number | null
  pagadorNome: string | null
  pagadorNif: string | null
  requerAprovacao: boolean
  urgente: boolean
  justificacaoUrgencia: string | null
  fracoes: FracaoOpcao[]
  fornecedores: FornecedorOpcao[]
  pontosAssembleia: PontoAssembleiaOpcao[]
}) {
  const [fracaoIdValor, setFracaoIdValor] = useState(fracaoId ? String(fracaoId) : '')
  const [fornecedorIdValor, setFornecedorIdValor] = useState(
    fornecedorId ? String(fornecedorId) : SEM_FORNECEDOR,
  )
  const [assembleiaPontoIdValor, setAssembleiaPontoIdValor] = useState(
    assembleiaPontoId ? String(assembleiaPontoId) : SEM_DELIBERACAO,
  )
  const [destinoValor, setDestinoValor] = useState(destino)
  const [requerAprovacaoValor, setRequerAprovacaoValor] = useState(requerAprovacao)
  const [urgenteValor, setUrgenteValor] = useState(urgente)
  const [justificacaoUrgenciaValor, setJustificacaoUrgenciaValor] = useState(
    justificacaoUrgencia ?? '',
  )
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('id', String(id))
    formData.set('destino', destinoValor)
    if (tipo === 'receita') {
      formData.set('fracaoId', fracaoIdValor)
    }
    if (tipo === 'despesa' && fornecedorIdValor !== SEM_FORNECEDOR) {
      formData.set('fornecedorId', fornecedorIdValor)
    }
    if (assembleiaPontoIdValor !== SEM_DELIBERACAO) {
      formData.set('assembleiaPontoId', assembleiaPontoIdValor)
    }
    if (tipo === 'despesa' && requerAprovacaoValor) formData.set('requerAprovacao', 'on')
    if (tipo === 'despesa' && urgenteValor) {
      formData.set('urgente', 'on')
      formData.set('justificacaoUrgencia', justificacaoUrgenciaValor)
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
            </div>
          )}

          {tipo === 'despesa' && (
            <div className="flex flex-col gap-2">
              <Label>Fornecedor (opcional)</Label>
              <Select value={fornecedorIdValor} onValueChange={(v) => v && setFornecedorIdValor(v)}>
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

          <Collapsible
            defaultOpen={
              destino === 'reserva' ||
              assembleiaPontoId != null ||
              Boolean(pagadorNome) ||
              requerAprovacao ||
              urgente
            }
          >
            <CollapsibleTrigger>
              <ChevronDown className="h-3.5 w-3.5" />
              Mais opções
            </CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="flex flex-col gap-2">
                <Label>Destino</Label>
                <Select value={destinoValor} onValueChange={(v) => v && setDestinoValor(v)}>
                  <SelectTrigger>
                    <SelectValue>{(v: string | null) => (v ? DESTINO_LABEL[v] : '')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Conta corrente do condomínio</SelectItem>
                    <SelectItem value="reserva">Fundo de reserva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(tipo === 'receita' || (tipo === 'despesa' && requerAprovacaoValor)) && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="assembleiaPontoIdEdit">
                    {tipo === 'receita'
                      ? 'Quota extraordinária? Ligue a uma decisão de assembleia'
                      : 'Ligue à decisão de assembleia que aprovou esta despesa'}
                  </Label>
                  <Select
                    value={assembleiaPontoIdValor}
                    onValueChange={(v) => v && setAssembleiaPontoIdValor(v)}
                  >
                    <SelectTrigger id="assembleiaPontoIdEdit">
                      <SelectValue>
                        {(v: string | null) => {
                          if (v === SEM_DELIBERACAO || v == null) return 'Sem ligação'
                          const p = pontosAssembleia.find((p) => String(p.id) === v)
                          return p ? p.titulo : 'Sem ligação'
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_DELIBERACAO}>Sem ligação</SelectItem>
                      {pontosAssembleia.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tipo === 'despesa' && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2">
                    <input
                      id="requerAprovacaoEdit"
                      type="checkbox"
                      checked={requerAprovacaoValor}
                      onChange={(e) => setRequerAprovacaoValor(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="requerAprovacaoEdit" className="font-normal text-xs text-muted-foreground">
                      Requer aprovação da assembleia — fica visível como
                      pendente até ser ligada a uma decisão aprovada
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      id="urgenteEdit"
                      type="checkbox"
                      checked={urgenteValor}
                      onChange={(e) => setUrgenteValor(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="urgenteEdit" className="font-normal text-xs text-muted-foreground">
                      Obra urgente (art. 1427.º CC) — decidida pelo
                      administrador sem esperar por assembleia
                    </Label>
                  </div>
                  {urgenteValor && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="justificacaoUrgenciaEdit">Justificação da urgência</Label>
                      <Textarea
                        id="justificacaoUrgenciaEdit"
                        value={justificacaoUrgenciaValor}
                        onChange={(e) => setJustificacaoUrgenciaValor(e.target.value)}
                        rows={2}
                        placeholder="Ex: rotura de água na coluna, risco para a segurança do edifício"
                      />
                    </div>
                  )}
                </div>
              )}

              {tipo === 'receita' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="pagadorNomeEdit">Pago por (opcional)</Label>
                      <Input
                        id="pagadorNomeEdit"
                        name="pagadorNome"
                        defaultValue={pagadorNome ?? ''}
                        placeholder="Ex: herdeira, se diferente do proprietário"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="pagadorNifEdit">NIF do pagador</Label>
                      <Input
                        id="pagadorNifEdit"
                        name="pagadorNif"
                        defaultValue={pagadorNif ?? ''}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Preencha só se quem pagou não for o proprietário registado
                    (ex: um dos vários herdeiros de uma fração). O recibo
                    passa a mostrar este nome/NIF em vez do NIF da fração.
                  </p>
                </div>
              )}
            </CollapsiblePanel>
          </Collapsible>

          <div className="flex flex-col gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input id="categoria" name="categoria" required defaultValue={categoria} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" required defaultValue={descricao} />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                pending ||
                (tipo === 'receita' && !fracaoIdValor) ||
                (urgenteValor && !justificacaoUrgenciaValor.trim())
              }
            >
              {pending ? 'A guardar...' : 'Guardar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
