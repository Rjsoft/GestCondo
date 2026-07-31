'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirFracaoAtiva } from '@/app/actions/condominio'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type FracaoOpcao = { fracaoId: number; identificacao: string }

/** Achado F04 — só é renderizado pelo `AppShell` quando a conta tem mais do
 * que uma linha `membro` aprovada no condomínio ativo (condómino ou
 * senhorio com várias frações), ver lib/session.ts:getFracoesDoUtilizador. */
export function FracaoSelector({
  fracoes,
  fracaoIdAtiva,
}: {
  fracoes: FracaoOpcao[]
  fracaoIdAtiva: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const trocar = (value: string) => {
    const id = Number(value)
    if (!id || id === fracaoIdAtiva) return
    startTransition(async () => {
      try {
        await definirFracaoAtiva(id)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao trocar de fração')
      }
    })
  }

  return (
    <Select
      value={String(fracaoIdAtiva)}
      onValueChange={(value) => value && trocar(value)}
      disabled={pending}
    >
      <SelectTrigger className="h-auto border-none bg-transparent px-0 py-0 text-sidebar-foreground shadow-none hover:bg-transparent">
        <SelectValue>
          {(v: string | null) => {
            const f = fracoes.find((f) => String(f.fracaoId) === v)
            return (
              <p className="truncate text-xs text-sidebar-foreground/60">
                Fração: {f?.identificacao ?? 'Selecionar'}
              </p>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {fracoes.map((f) => (
          <SelectItem key={f.fracaoId} value={String(f.fracaoId)}>
            {f.identificacao}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
