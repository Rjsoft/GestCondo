'use client'

import { useTransition } from 'react'
import { eliminarOrcamento } from '@/app/actions/orcamentos'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function OrcamentoActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarOrcamento(id)
        toast.success('Orçamento eliminado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={remover}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Eliminar orçamento"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
