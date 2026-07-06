'use client'

import { useTransition } from 'react'
import { aprovarMembro, rejeitarMembro } from '@/app/actions/fracoes'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'

export function MembroStatusActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const aprovar = () => {
    startTransition(async () => {
      try {
        await aprovarMembro(id)
        toast.success('Condómino aprovado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const rejeitar = () => {
    startTransition(async () => {
      try {
        await rejeitarMembro(id)
        toast.success('Pedido rejeitado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={pending} onClick={aprovar}>
        <Check className="h-4 w-4" />
        Aprovar
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={rejeitar}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
        Rejeitar
      </Button>
    </div>
  )
}
