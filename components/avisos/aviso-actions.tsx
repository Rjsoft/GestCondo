'use client'

import { useTransition } from 'react'
import { eliminarAviso } from '@/app/actions/avisos'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function AvisoActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarAviso(id)
        toast.success('Aviso eliminado')
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
      className="shrink-0 text-muted-foreground hover:text-destructive"
      aria-label="Eliminar aviso"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
