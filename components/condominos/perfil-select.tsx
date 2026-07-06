'use client'

import { useTransition } from 'react'
import { atualizarPerfilMembro } from '@/app/actions/fracoes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function PerfilSelect({ id, perfil }: { id: number; perfil: string }) {
  const [pending, startTransition] = useTransition()

  const mudar = (novo: string) => {
    startTransition(async () => {
      try {
        await atualizarPerfilMembro(id, novo)
        toast.success('Perfil atualizado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <Select value={perfil} onValueChange={mudar} disabled={pending}>
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrador</SelectItem>
        <SelectItem value="condomino">Condómino</SelectItem>
      </SelectContent>
    </Select>
  )
}
