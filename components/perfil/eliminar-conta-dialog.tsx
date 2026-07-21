'use client'

import { useState, useTransition } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

export function EliminarContaDialog() {
  const [open, setOpen] = useState(false)
  const [pedido, setPedido] = useState(false)
  const [pending, startTransition] = useTransition()

  const pedirEliminacao = () => {
    startTransition(async () => {
      const { error } = await authClient.deleteUser({ callbackURL: '/sign-in' })
      if (error) {
        toast.error(error.message ?? 'Erro ao pedir a eliminação da conta')
        return
      }
      setPedido(true)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2 className="h-4 w-4" />
        Eliminar a minha conta
      </DialogTrigger>
      <DialogContent>
        {pedido ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MailCheck className="h-6 w-6" />
            </div>
            <DialogTitle>Confirme por email</DialogTitle>
            <DialogDescription>
              Enviámos um link de confirmação para o seu email. A sua conta só é eliminada depois de
              clicar nesse link — enquanto não confirmar, nada muda.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Eliminar a minha conta</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. A sua conta e sessão são removidas, e a sua ligação
                ao condomínio deixa de existir. Dados financeiros já lançados são mantidos por
                obrigação legal de retenção, mas deixam de estar associados a uma conta sua ativa.
                Vamos enviar-lhe um email para confirmar antes de eliminar definitivamente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={pedirEliminacao} disabled={pending}>
                {pending ? 'A pedir...' : 'Sim, quero eliminar a minha conta'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
