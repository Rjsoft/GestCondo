'use client'

import { useState, useTransition } from 'react'
import { getTransmissoesFracao } from '@/app/actions/fracoes'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatData, formatEuro } from '@/lib/format'
import { DECISAO_SALDO_LABEL, type DecisaoSaldo } from '@/lib/fracoes'

type Transmissao = {
  id: number
  vendedorNome: string
  vendedorNif: string | null
  compradorNome: string
  compradorNif: string | null
  dataEscritura: Date
  saldoNaData: string
  decisaoSaldo: string
  notas: string | null
  autorNome: string
  createdAt: Date
}

export function TransmissoesFracaoDialog({ fracaoId, total }: { fracaoId: number; total: number }) {
  const [lista, setLista] = useState<Transmissao[] | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !lista) {
          startTransition(async () => {
            setLista(await getTransmissoesFracao(fracaoId))
          })
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {total} {total === 1 ? 'transmissão anterior' : 'transmissões anteriores'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de transmissões</DialogTitle>
        </DialogHeader>
        {pending && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {!pending && lista?.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há transmissões registadas.</p>
        )}
        {!pending && lista && lista.length > 0 && (
          <ul className="flex flex-col gap-3">
            {lista.map((t) => (
              <li key={t.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {t.vendedorNome} → {t.compradorNome}
                  </span>
                  <span className="text-xs text-muted-foreground">Escritura: {formatData(t.dataEscritura)}</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Saldo à data: {formatEuro(Number(t.saldoNaData))} —{' '}
                  {DECISAO_SALDO_LABEL[t.decisaoSaldo as DecisaoSaldo] ?? t.decisaoSaldo}
                </p>
                {t.notas && <p className="mt-1 text-muted-foreground">{t.notas}</p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  Registado por {t.autorNome} em {formatData(t.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
