'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDataHora } from '@/lib/format'
import { History } from 'lucide-react'

const ACAO_LABEL: Record<string, string> = {
  promover: 'Adicionado como operador',
  remover: 'Removido como operador',
}

type Entrada = {
  id: number
  acao: string
  operadorEmail: string
  autorEmail: string
  createdAt: Date
}

export function HistoricoPlataformaDialog({ log }: { log: Entrada[] }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <History className="h-4 w-4" />
        Histórico
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de operadores da plataforma</DialogTitle>
        </DialogHeader>
        {log.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há ações registadas.</p>
        )}
        {log.length > 0 && (
          <ul className="flex flex-col gap-2">
            {log.map((l) => (
              <li key={l.id} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium text-foreground">
                  {ACAO_LABEL[l.acao] ?? l.acao}: {l.operadorEmail}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Por {l.autorEmail} — {formatDataHora(l.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
