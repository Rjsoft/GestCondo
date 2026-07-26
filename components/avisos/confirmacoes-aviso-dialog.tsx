'use client'

import { useState, useTransition } from 'react'
import { getConfirmacoesLeituraAviso } from '@/app/actions/avisos'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDataHora } from '@/lib/format'

type Confirmacao = { membroId: number; nome: string; confirmadoEm: Date }

export function ConfirmacoesAvisoDialog({ avisoId, total }: { avisoId: number; total: number }) {
  const [lista, setLista] = useState<Confirmacao[] | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !lista) {
          startTransition(async () => {
            setLista(await getConfirmacoesLeituraAviso(avisoId))
          })
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {total} {total === 1 ? 'confirmação de leitura' : 'confirmações de leitura'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quem já confirmou a leitura</DialogTitle>
        </DialogHeader>
        {pending && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {!pending && lista?.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda ninguém confirmou.</p>
        )}
        {!pending && lista && lista.length > 0 && (
          <ul className="flex flex-col gap-2">
            {lista.map((c) => (
              <li key={c.membroId} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{c.nome}</span>
                <span className="text-muted-foreground">{formatDataHora(c.confirmadoEm)}</span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
