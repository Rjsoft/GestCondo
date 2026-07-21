'use client'

import { useState, useTransition } from 'react'
import { eliminarDocumento } from '@/app/actions/documentos'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function DocumentoActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarDocumento(id)
        toast.success('Documento eliminado')
        setConfirmOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="Eliminar documento"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar documento"
        description="Esta ação não pode ser desfeita. O documento deixa de estar disponível para os condóminos."
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
