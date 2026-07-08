'use client'

import { useTransition } from 'react'
import { eliminarSeguro } from '@/app/actions/seguros'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function SeguroActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarSeguro(id)
        toast.success('Seguro eliminado')
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
      aria-label="Eliminar seguro"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
