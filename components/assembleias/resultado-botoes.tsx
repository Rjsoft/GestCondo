'use client'

import { useTransition } from 'react'
import { definirResultadoPonto } from '@/app/actions/assembleias'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const OPCOES: { resultado: string; label: string }[] = [
  { resultado: 'aprovado', label: 'Aprovar' },
  { resultado: 'reprovado', label: 'Reprovar' },
  { resultado: 'adiado', label: 'Adiar' },
]

export function ResultadoBotoesClient({ pontoId }: { pontoId: number }) {
  const [pending, startTransition] = useTransition()

  const definir = (resultado: string) => {
    startTransition(async () => {
      try {
        await definirResultadoPonto(pontoId, resultado)
        toast.success('Deliberação registada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPCOES.map((o) => (
        <Button
          key={o.resultado}
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => definir(o.resultado)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}
