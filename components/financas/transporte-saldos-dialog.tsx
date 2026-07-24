'use client'

import { useEffect, useState, useTransition } from 'react'
import { confirmarTransporteSaldos, revisaoTransporteSaldos } from '@/app/actions/exercicios'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatEuro } from '@/lib/format'
import { ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'

type Revisao = {
  exercicioAnterior: { id: number; designacao: string } | null
  contas: {
    contaFinanceiraId: number
    nome: string
    saldoFinalAnterior: number
    avisoDadosIncompletos: boolean
    jaTemSaldoDefinido: boolean
  }[]
}

export function TransporteSaldosDialog({
  exercicioId,
  designacao,
  onSucesso,
}: {
  exercicioId: number
  designacao: string
  onSucesso?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [revisao, setRevisao] = useState<Revisao | null>(null)
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    revisaoTransporteSaldos(exercicioId)
      .then((r) => {
        setRevisao(r)
        setSelecionadas(
          new Set(r.contas.filter((c) => !c.jaTemSaldoDefinido).map((c) => c.contaFinanceiraId)),
        )
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao preparar o transporte'))
      .finally(() => setCarregando(false))
  }, [open, exercicioId])

  const confirmar = () => {
    startTransition(async () => {
      try {
        const transportadas = await confirmarTransporteSaldos(exercicioId, Array.from(selecionadas))
        toast.success(`Saldo transportado para ${transportadas} conta(s)`)
        setOpen(false)
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao transportar saldo')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setCarregando(true)
        else setRevisao(null)
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <ArrowRightLeft className="h-4 w-4" />
        Transportar saldo
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transportar saldo para &quot;{designacao}&quot;</DialogTitle>
          <DialogDescription>
            Usa o saldo final de cada conta no exercício anterior como saldo inicial deste
            exercício. Nunca substitui um saldo inicial já definido — essas contas aparecem
            aqui só para informação.
          </DialogDescription>
        </DialogHeader>

        {carregando && <p className="text-sm text-muted-foreground">A calcular saldos...</p>}

        {revisao && !carregando && !revisao.exercicioAnterior && (
          <p className="text-sm text-muted-foreground">
            Não há um exercício imediatamente anterior e já fechado para transportar saldo.
            Defina o saldo inicial manualmente em cada conta.
          </p>
        )}

        {revisao && !carregando && revisao.exercicioAnterior && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Exercício anterior: {revisao.exercicioAnterior.designacao}
            </p>
            {revisao.contas.length === 0 && (
              <p className="text-sm text-muted-foreground">Não existem contas ativas.</p>
            )}
            <div className="flex flex-col gap-1 rounded-md border border-border p-2">
              {revisao.contas.map((c) => (
                <label
                  key={c.contaFinanceiraId}
                  className={`flex items-center justify-between gap-2 rounded p-1.5 text-sm ${c.jaTemSaldoDefinido ? 'opacity-60' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      disabled={c.jaTemSaldoDefinido}
                      checked={selecionadas.has(c.contaFinanceiraId)}
                      onCheckedChange={(v) =>
                        setSelecionadas((s) => {
                          const novo = new Set(s)
                          if (v === true) novo.add(c.contaFinanceiraId)
                          else novo.delete(c.contaFinanceiraId)
                          return novo
                        })
                      }
                    />
                    {c.nome}
                    {c.jaTemSaldoDefinido && (
                      <span className="text-xs text-muted-foreground">(já tem saldo definido)</span>
                    )}
                    {c.avisoDadosIncompletos && (
                      <span className="text-xs text-amber-700">(há movimentos sem data de liquidação)</span>
                    )}
                  </span>
                  <span className="font-medium">{formatEuro(c.saldoFinalAnterior)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={confirmar}
            disabled={pending || carregando || !revisao?.exercicioAnterior || selecionadas.size === 0}
          >
            {pending ? 'A transportar...' : 'Transportar saldo selecionado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
