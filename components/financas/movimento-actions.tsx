'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { eliminarMovimento, alternarPago } from '@/app/actions/financas'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, CheckCircle2, Circle, Receipt } from 'lucide-react'
import { toast } from 'sonner'

export function MovimentoActions({
  id,
  pago,
  tipo,
}: {
  id: number
  pago: boolean
  tipo: string
}) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarMovimento(id)
        toast.success('Movimento eliminado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const marcar = () => {
    startTransition(async () => {
      try {
        await alternarPago(id, !pago)
        toast.success(pago ? 'Marcado como pendente' : 'Marcado como pago')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" disabled={pending} />}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Ações</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {tipo === 'receita' && (
          <DropdownMenuItem render={<Link href={`/financas/recibo/${id}`} />}>
            <Receipt className="h-4 w-4" />
            Ver recibo
          </DropdownMenuItem>
        )}
        {tipo === 'receita' && (
          <DropdownMenuItem onClick={marcar}>
            {pago ? (
              <>
                <Circle className="h-4 w-4" />
                Marcar pendente
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Marcar como pago
              </>
            )}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={remover}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
