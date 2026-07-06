'use client'

import { useTransition } from 'react'
import { eliminarFracao } from '@/app/actions/fracoes'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function FracaoActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarFracao(id)
        toast.success('Fração eliminada')
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
      aria-label="Eliminar fração"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
