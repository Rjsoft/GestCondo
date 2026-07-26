'use client'

import { useState, useTransition } from 'react'
import { eliminarAnexoAta } from '@/app/actions/assembleias'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function AnexoActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarAnexoAta(id)
        toast.success('Anexo eliminado')
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
        aria-label="Eliminar anexo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar anexo"
        description="Esta ação não pode ser desfeita. O anexo deixa de estar disponível."
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
