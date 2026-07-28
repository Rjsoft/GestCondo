'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirCondominioAtivo } from '@/app/actions/condominio'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type CondominioOpcao = { condominioId: number; nome: string }

/** Só é renderizado pelo `AppShell` quando a conta pertence a mais do que
 * um condomínio (empresa gestora) — ver lib/session.ts:getCondominiosDoUtilizador. */
export function CondominioSelector({
  condominios,
  condominioIdAtivo,
}: {
  condominios: CondominioOpcao[]
  condominioIdAtivo: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const trocar = (value: string) => {
    const id = Number(value)
    if (!id || id === condominioIdAtivo) return
    startTransition(async () => {
      try {
        await definirCondominioAtivo(id)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao trocar de condomínio')
      }
    })
  }

  return (
    <Select
      value={String(condominioIdAtivo)}
      onValueChange={(value) => value && trocar(value)}
      disabled={pending}
    >
      <SelectTrigger className="h-auto border-none bg-transparent px-0 py-0 text-sidebar-foreground shadow-none hover:bg-transparent">
        <SelectValue>
          {(v: string | null) => {
            const c = condominios.find((c) => String(c.condominioId) === v)
            return (
              <p className="truncate text-xs font-medium text-sidebar-foreground/80">
                {c?.nome ?? 'Selecionar condomínio'}
              </p>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {condominios.map((c) => (
          <SelectItem key={c.condominioId} value={String(c.condominioId)}>
            {c.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
