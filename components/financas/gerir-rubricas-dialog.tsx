'use client'

import { useState, useTransition } from 'react'
import {
  criarOrcamentoRubrica,
  eliminarOrcamentoRubrica,
  getOrcamentoRubricas,
} from '@/app/actions/orcamentos'
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
import { formatEuro } from '@/lib/format'
import { X } from 'lucide-react'
import { toast } from 'sonner'

type Rubrica = { id: number; categoria: string; valorOrcamentado: string }

export function GerirRubricasDialog({
  orcamentoId,
  ano,
  valorAnual,
  open,
  onOpenChange,
}: {
  orcamentoId: number
  ano: number
  valorAnual: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [rubricas, setRubricas] = useState<Rubrica[]>([])
  const [carregado, setCarregado] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState('')
  const [pending, startTransition] = useTransition()

  const carregar = () => {
    startTransition(async () => {
      try {
        const dados = await getOrcamentoRubricas(orcamentoId)
        setRubricas(dados)
        setCarregado(true)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao carregar rubricas')
      }
    })
  }

  const abrir = (novoAberto: boolean) => {
    onOpenChange(novoAberto)
    if (novoAberto && !carregado) carregar()
  }

  const somaAtual = rubricas.reduce((s, r) => s + Number(r.valorOrcamentado), 0)

  const adicionar = () => {
    const formData = new FormData()
    formData.set('orcamentoId', String(orcamentoId))
    formData.set('categoria', categoria)
    formData.set('valorOrcamentado', valor)

    startTransition(async () => {
      try {
        const { avisoExcedeOrcamento } = await criarOrcamentoRubrica(formData)
        if (avisoExcedeOrcamento) {
          toast.warning('Rubrica guardada — mas a soma das rubricas já ultrapassa o valor anual do orçamento.')
        } else {
          toast.success('Rubrica guardada')
        }
        setCategoria('')
        setValor('')
        carregar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao guardar rubrica')
      }
    })
  }

  const remover = (id: number) => {
    startTransition(async () => {
      try {
        await eliminarOrcamentoRubrica(id)
        toast.success('Rubrica eliminada')
        carregar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao eliminar rubrica')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rubricas — Orçamento {ano}</DialogTitle>
          <DialogDescription>
            Discrimine o valor anual ({formatEuro(valorAnual)}) por categoria de despesa, para
            comparar orçado vs. real rubrica a rubrica no balanço.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {carregado && rubricas.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Ainda não há rubricas definidas.</p>
          )}
          {rubricas.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <span>{r.categoria}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatEuro(Number(r.valorOrcamentado))}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={pending}
                  onClick={() => remover(r.id)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Eliminar rubrica</span>
                </Button>
              </div>
            </div>
          ))}
          {rubricas.length > 0 && (
            <div className="flex items-center justify-between px-3 pt-1 text-sm text-muted-foreground">
              <span>Soma das rubricas</span>
              <span className={somaAtual > valorAnual ? 'font-medium text-amber-700' : ''}>
                {formatEuro(somaAtual)} de {formatEuro(valorAnual)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Nova rubrica</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rubrica-categoria">Categoria</Label>
              <Input
                id="rubrica-categoria"
                placeholder="Ex: Limpeza, Elevadores"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rubrica-valor">Valor orçamentado (€)</Label>
              <Input
                id="rubrica-valor"
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={adicionar} disabled={pending || !categoria || !valor}>
            {pending ? 'A guardar...' : 'Adicionar rubrica'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
