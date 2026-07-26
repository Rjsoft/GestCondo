'use client'

import { useState, useTransition } from 'react'
import { removerMembro } from '@/app/actions/fracoes'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function RemoverMembroButton({ id, nome }: { id: number; nome: string }) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await removerMembro(id)
        toast.success('Conta removida')
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
        aria-label={`Remover conta de ${nome}`}
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remover conta de condómino"
        description={`A conta de ${nome} deixa de ter acesso a este condomínio. A fração e o respetivo histórico financeiro não são afetados — só a conta de acesso é removida. Útil, por exemplo, quando o proprietário falece e um herdeiro cria uma conta nova.`}
        confirmLabel="Remover"
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
