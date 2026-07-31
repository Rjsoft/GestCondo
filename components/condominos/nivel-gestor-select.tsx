'use client'

import { useTransition } from 'react'
import { atualizarNivelGestorMembro } from '@/app/actions/fracoes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NIVEIS_GESTOR, NIVEL_GESTOR_LABEL, type NivelGestor } from '@/lib/perfis'
import { toast } from 'sonner'

/** Achado F03 — só faz sentido para membros com `perfil: 'gestor'` (ver
 * app/(app)/condominos/page.tsx, que só renderiza isto nesse caso). */
export function NivelGestorSelect({ id, nivelGestor }: { id: number; nivelGestor: string }) {
  const [pending, startTransition] = useTransition()

  const mudar = (novo: string) => {
    startTransition(async () => {
      try {
        await atualizarNivelGestorMembro(id, novo)
        toast.success('Nível atualizado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <Select
      value={nivelGestor}
      onValueChange={(value) => value && mudar(value)}
      disabled={pending}
    >
      <SelectTrigger size="sm">
        <SelectValue>{(v: NivelGestor | null) => (v ? NIVEL_GESTOR_LABEL[v] : '')}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {NIVEIS_GESTOR.map((n) => (
          <SelectItem key={n} value={n}>
            {NIVEL_GESTOR_LABEL[n]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
