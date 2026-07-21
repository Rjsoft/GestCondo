'use client'

import { useTransition } from 'react'
import { alternarIsencaoElevador, eliminarFracao } from '@/app/actions/fracoes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'

export function FracaoActions({
  id,
  isentaElevador,
}: {
  id: number
  isentaElevador: boolean
}) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarFracao(id)
        toast.success('Fração eliminada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const alternarElevador = () => {
    startTransition(async () => {
      try {
        await alternarIsencaoElevador(id, !isentaElevador)
        toast.success(
          isentaElevador
            ? 'Fração deixou de estar isenta de elevador'
            : 'Fração marcada como isenta de elevador',
        )
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={pending} />}>
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Ações</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={alternarElevador}>
          {isentaElevador ? (
            <>
              <ArrowUpCircle className="h-4 w-4" />
              Retirar isenção de elevador
            </>
          ) : (
            <>
              <ArrowDownCircle className="h-4 w-4" />
              Isentar de elevador
            </>
          )}
        </DropdownMenuItem>
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
