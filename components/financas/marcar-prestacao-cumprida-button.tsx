'use client'

import { useTransition } from 'react'
import { marcarPrestacaoCumprida } from '@/app/actions/cobranca'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

export function MarcarPrestacaoCumpridaButton({ prestacaoId }: { prestacaoId: number }) {
  const [pending, startTransition] = useTransition()

  const marcar = () => {
    startTransition(async () => {
      try {
        await marcarPrestacaoCumprida(prestacaoId)
        toast.success('Prestação marcada como cumprida')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao marcar prestação')
      }
    })
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={marcar}>
      <Check className="h-4 w-4" />
      Marcar prestação cumprida
    </Button>
  )
}
