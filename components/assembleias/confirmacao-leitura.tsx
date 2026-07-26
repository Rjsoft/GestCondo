'use client'

import { useTransition } from 'react'
import { confirmarLeituraAssembleia } from '@/app/actions/assembleias'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from '@/components/ui/collapsible'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatDataHora } from '@/lib/format'

type Confirmacao = { membroId: number; nome: string; confirmadoEm: Date }

export function ConfirmacaoLeituraAssembleia({
  assembleiaId,
  confirmado,
  confirmacoes,
}: {
  assembleiaId: number
  confirmado: boolean
  confirmacoes: Confirmacao[]
}) {
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    startTransition(async () => {
      try {
        await confirmarLeituraAssembleia(assembleiaId)
        toast.success('Leitura da convocatória confirmada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao confirmar leitura')
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {confirmado ? (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          Confirmou a leitura da convocatória
        </span>
      ) : (
        <Button variant="outline" size="sm" disabled={pending} onClick={onClick}>
          {pending ? 'A confirmar...' : 'Confirmar leitura da convocatória'}
        </Button>
      )}

      <Collapsible>
        <CollapsibleTrigger>
          {confirmacoes.length} {confirmacoes.length === 1 ? 'confirmação de leitura' : 'confirmações de leitura'}
        </CollapsibleTrigger>
        <CollapsiblePanel>
          {confirmacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda ninguém confirmou.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {confirmacoes.map((c) => (
                <li key={c.membroId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">{c.nome}</span>
                  <span className="text-muted-foreground">{formatDataHora(c.confirmadoEm)}</span>
                </li>
              ))}
            </ul>
          )}
        </CollapsiblePanel>
      </Collapsible>
    </div>
  )
}
