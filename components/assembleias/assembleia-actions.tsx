'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { cancelarAssembleia, marcarRealizada } from '@/app/actions/assembleias'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

export function AssembleiaActions({
  assembleiaId,
  estado,
}: {
  assembleiaId: number
  estado: string
}) {
  const [pending, startTransition] = useTransition()

  const marcar = () => {
    startTransition(async () => {
      try {
        await marcarRealizada(assembleiaId)
        toast.success('Assembleia marcada como realizada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const cancelar = () => {
    startTransition(async () => {
      try {
        await cancelarAssembleia(assembleiaId)
        toast.success('Assembleia cancelada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon" disabled={pending} />}>
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Ações</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(estado === 'realizada' || estado === 'aprovada') && (
          <DropdownMenuItem render={<Link href={`/assembleias/ata/${assembleiaId}`} />}>
            <FileText className="h-4 w-4" />
            Ver ata
          </DropdownMenuItem>
        )}
        {estado === 'convocada' && (
          <DropdownMenuItem onClick={marcar}>
            <CheckCircle2 className="h-4 w-4" />
            Marcar como realizada
          </DropdownMenuItem>
        )}
        {estado === 'convocada' && (
          <DropdownMenuItem
            onClick={cancelar}
            className="text-destructive focus:text-destructive"
          >
            <XCircle className="h-4 w-4" />
            Cancelar assembleia
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
