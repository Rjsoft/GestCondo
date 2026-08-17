'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  atualizarOrcamentoRubrica,
  copiarRubricasOrcamentoAnterior,
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
import { Check, Pencil, X } from 'lucide-react'
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
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [valorEdicao, setValorEdicao] = useState('')
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

  // Carrega no useEffect, não em onOpenChange do <Dialog>: este diálogo é
  // aberto de fora (orcamento-actions.tsx), sem DialogTrigger próprio — um
  // Dialog controlado do Base UI só chama onOpenChange para transições que
  // ele próprio pede (Escape, clique fora, botão fechar), não quando o
  // consumidor muda `open` diretamente, pelo que a carga nunca disparava
  // na abertura (achado 2026-08-17, verificado em produção).
  useEffect(() => {
    if (open && !carregado) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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

  const iniciarEdicao = (r: Rubrica) => {
    setEditandoId(r.id)
    setValorEdicao(r.valorOrcamentado)
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setValorEdicao('')
  }

  const guardarEdicao = (id: number) => {
    startTransition(async () => {
      try {
        const { avisoExcedeOrcamento } = await atualizarOrcamentoRubrica(id, valorEdicao)
        if (avisoExcedeOrcamento) {
          toast.warning('Valor atualizado — mas a soma das rubricas já ultrapassa o valor anual do orçamento.')
        } else {
          toast.success('Valor atualizado')
        }
        setEditandoId(null)
        setValorEdicao('')
        carregar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar rubrica')
      }
    })
  }

  const copiarDoAnterior = () => {
    startTransition(async () => {
      try {
        const { quantidade, anoOrigem } = await copiarRubricasOrcamentoAnterior(orcamentoId)
        toast.success(
          `${quantidade} rubrica(s) copiada(s) do orçamento de ${anoOrigem} — reveja os valores (ícone de lápis) antes de continuar`,
        )
        carregar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao copiar rubricas')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <div className="flex flex-col gap-2 py-2">
              <p className="text-sm text-muted-foreground">Ainda não há rubricas definidas.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={pending}
                onClick={copiarDoAnterior}
              >
                Copiar rubricas do orçamento anterior
              </Button>
            </div>
          )}
          {rubricas.map((r) =>
            editandoId === r.id ? (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>{r.categoria}</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    className="h-7 w-24"
                    value={valorEdicao}
                    onChange={(e) => setValorEdicao(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') guardarEdicao(r.id)
                      if (e.key === 'Escape') cancelarEdicao()
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={pending || !valorEdicao}
                    onClick={() => guardarEdicao(r.id)}
                  >
                    <Check className="h-3 w-3" />
                    <span className="sr-only">Guardar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={pending}
                    onClick={cancelarEdicao}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Cancelar</span>
                  </Button>
                </div>
              </div>
            ) : (
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
                    onClick={() => iniciarEdicao(r)}
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Editar valor</span>
                  </Button>
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
            ),
          )}
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
