'use client'

import { useState, useTransition } from 'react'
import { removerOperadorPlataforma } from '@/app/actions/plataforma'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function OperadorActions({ userId, email }: { userId: string; email: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await removerOperadorPlataforma(userId)
        toast.success(`${email} deixou de ter acesso à plataforma`)
        setConfirmOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao remover operador')
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Remover
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remover operador da plataforma"
        description={`${email} deixa de conseguir aceder a /plataforma e de poder suspender/reativar condomínios.`}
        confirmLabel="Remover"
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
