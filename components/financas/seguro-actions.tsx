'use client'

import { useTransition } from 'react'
import { eliminarSeguro } from '@/app/actions/seguros'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'

export function SeguroActions({ id, anexoUrl }: { id: number; anexoUrl?: string | null }) {
  const [pending, startTransition] = useTransition()

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarSeguro(id)
        toast.success('Seguro eliminado')
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
        {anexoUrl && (
          <DropdownMenuItem render={<a href={anexoUrl} target="_blank" rel="noopener noreferrer" />}>
            <FileText className="h-4 w-4" />
            Ver apólice
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
