'use client'

import { useTransition } from 'react'
import { eliminarDocumento } from '@/app/actions/documentos'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DocumentoActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarDocumento(id)
        toast.success('Documento eliminado')
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
      aria-label="Eliminar documento"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
