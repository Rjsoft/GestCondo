'use client'

import { useState, useTransition } from 'react'
import { getHistoricoCreditoFracao } from '@/app/actions/creditos'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatData, formatEuro } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  adiantamento: 'Adiantamento',
  aplicacao: 'Aplicado a quota',
  devolucao: 'Devolução',
}

type Entrada = {
  id: number
  tipo: string
  valor: string
  notas: string | null
  data: Date
  autorNome: string
  createdAt: Date
}

export function HistoricoCreditoDialog({ fracaoId }: { fracaoId: number }) {
  const [lista, setLista] = useState<Entrada[] | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !lista) {
          startTransition(async () => {
            setLista(await getHistoricoCreditoFracao(fracaoId))
          })
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Histórico</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de crédito</DialogTitle>
        </DialogHeader>
        {pending && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {!pending && lista?.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há movimentos de crédito.</p>
        )}
        {!pending && lista && lista.length > 0 && (
          <ul className="flex flex-col gap-2">
            {lista.map((e) => (
              <li key={e.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{TIPO_LABEL[e.tipo] ?? e.tipo}</span>
                  <span className={Number(e.valor) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    {Number(e.valor) >= 0 ? '+' : ''}
                    {formatEuro(Number(e.valor))}
                  </span>
                </div>
                {e.notas && <p className="mt-1 text-muted-foreground">{e.notas}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatData(e.data)} — {e.autorNome}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
