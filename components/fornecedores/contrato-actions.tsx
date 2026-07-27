'use client'

import { useState, useTransition } from 'react'
import { eliminarContrato } from '@/app/actions/contratos'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ContratoActions({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarContrato(id)
        toast.success('Contrato eliminado')
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
        aria-label="Eliminar contrato"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar contrato"
        description="Esta ação não pode ser desfeita."
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
