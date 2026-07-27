'use client'

import { useState, useTransition } from 'react'
import { eliminarOrcamentoObra, marcarVencedorOrcamentoObra } from '@/app/actions/orcamentos-obra'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MoreHorizontal, Trash2, Trophy, X } from 'lucide-react'
import { toast } from 'sonner'

export function OrcamentoObraActions({ id, vencedor }: { id: number; vencedor: boolean }) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarOrcamentoObra(id)
        toast.success('Orçamento eliminado')
        setConfirmOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const alternarVencedor = () => {
    startTransition(async () => {
      try {
        await marcarVencedorOrcamentoObra(id, !vencedor)
        toast.success(vencedor ? 'Vencedor desmarcado' : 'Marcado como vencedor')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={pending} />}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={alternarVencedor}>
            {vencedor ? (
              <>
                <X className="h-4 w-4" />
                Desmarcar vencedor
              </>
            ) : (
              <>
                <Trophy className="h-4 w-4" />
                Marcar vencedor
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar orçamento"
        description="Esta ação não pode ser desfeita."
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
