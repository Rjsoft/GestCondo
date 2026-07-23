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
import { PERFIL_LABEL, PERFIS, type Perfil } from '@/lib/perfis'
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
    <Select
      value={perfil}
      onValueChange={(value) => value && mudar(value)}
      disabled={pending}
    >
      <SelectTrigger size="sm">
        <SelectValue>{(v: Perfil | null) => (v ? PERFIL_LABEL[v] : '')}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PERFIS.map((p) => (
          <SelectItem key={p} value={p}>
            {PERFIL_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
