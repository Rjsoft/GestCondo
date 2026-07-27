'use client'

import { useState, useTransition } from 'react'
import { getVersoesDocumento } from '@/app/actions/documentos'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatDataHora } from '@/lib/format'
import { ExternalLink } from 'lucide-react'

type Versao = {
  id: number
  titulo: string
  url: string | null
  nomeFicheiro: string | null
  motivo: string | null
  autorNome: string
  createdAt: Date
}

export function VersoesDocumentoDialog({ documentoId, total }: { documentoId: number; total: number }) {
  const [lista, setLista] = useState<Versao[] | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !lista) {
          startTransition(async () => {
            setLista(await getVersoesDocumento(documentoId))
          })
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        {total} {total === 1 ? 'versão anterior' : 'versões anteriores'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Histórico de versões</DialogTitle>
        </DialogHeader>
        {pending && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {!pending && lista?.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há versões anteriores.</p>
        )}
        {!pending && lista && lista.length > 0 && (
          <ul className="flex flex-col gap-3">
            {lista.map((v) => (
              <li key={v.id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{v.titulo}</span>
                  <span className="text-xs text-muted-foreground">
                    {v.autorNome} — {formatDataHora(v.createdAt)}
                  </span>
                </div>
                {v.motivo && <p className="mt-1 text-muted-foreground">{v.motivo}</p>}
                {v.url && (
                  <a
                    href={`/api/ficheiros?url=${encodeURIComponent(v.url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-primary hover:underline"
                  >
                    {v.nomeFicheiro || 'Abrir versão'} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
