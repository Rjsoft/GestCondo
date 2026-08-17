'use client'

import { useState, useTransition } from 'react'
import { criarPlanoPrestacional } from '@/app/actions/cobranca'
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
import { CalendarClock, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

type Linha = { dataPrevista: string; valor: string }

const LINHA_VAZIA: Linha = { dataPrevista: '', valor: '' }

export function CriarPlanoPrestacionalDialog({ processoId }: { processoId: number }) {
  const [open, setOpen] = useState(false)
  const [linhas, setLinhas] = useState<Linha[]>([{ ...LINHA_VAZIA }, { ...LINHA_VAZIA }])
  const [pending, startTransition] = useTransition()

  const atualizarLinha = (i: number, campo: keyof Linha, valor: string) => {
    setLinhas((ls) => ls.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)))
  }

  const linhasValidas = linhas.filter((l) => l.dataPrevista && Number(l.valor) > 0)

  const confirmar = () => {
    startTransition(async () => {
      try {
        const { avisoDivergencia, diferenca } = await criarPlanoPrestacional(
          processoId,
          linhasValidas.map((l) => ({ dataPrevista: new Date(l.dataPrevista), valor: Number(l.valor) })),
        )
        if (avisoDivergencia) {
          toast.warning(
            `Plano gravado, mas o total ${diferenca > 0 ? 'excede' : 'fica abaixo d'}a dívida real em ${Math.abs(diferenca).toFixed(2)} €. Considere justificar nas notas do processo.`,
          )
        } else {
          toast.success('Plano prestacional gravado')
        }
        setOpen(false)
        setLinhas([{ ...LINHA_VAZIA }, { ...LINHA_VAZIA }])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao gravar o plano')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <CalendarClock className="h-4 w-4" />
        Criar plano prestacional
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar plano prestacional</DialogTitle>
          <DialogDescription>
            Calendário de acompanhamento do acordo — não altera nenhum movimento nem saldo.
            Marcar uma prestação como cumprida não liquida a quota correspondente em Finanças;
            isso continua a fazer-se em Movimentos, como hoje.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {linhas.map((l, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor={`data-${i}`}>Data prevista</Label>
                <Input
                  id={`data-${i}`}
                  type="date"
                  value={l.dataPrevista}
                  onChange={(e) => atualizarLinha(i, 'dataPrevista', e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Label htmlFor={`valor-${i}`}>Valor (€)</Label>
                <Input
                  id={`valor-${i}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={l.valor}
                  onChange={(e) => atualizarLinha(i, 'valor', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover prestação"
                onClick={() => setLinhas((ls) => ls.filter((_, idx) => idx !== i))}
                disabled={linhas.length <= 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setLinhas((ls) => [...ls, { ...LINHA_VAZIA }])}
          >
            <Plus className="h-4 w-4" />
            Adicionar prestação
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={confirmar} disabled={pending || linhasValidas.length === 0}>
            {pending ? 'A gravar...' : 'Gravar plano'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
