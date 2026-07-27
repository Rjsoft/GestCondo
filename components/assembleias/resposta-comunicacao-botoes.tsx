'use client'

import { useTransition } from 'react'
import { registarRespostaComunicacao } from '@/app/actions/assembleias'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function RespostaComunicacaoBotoes({ comunicacaoId }: { comunicacaoId: number }) {
  const [pending, startTransition] = useTransition()

  const registar = (resposta: string) => {
    startTransition(async () => {
      try {
        await registarRespostaComunicacao(comunicacaoId, resposta)
        toast.success('Resposta registada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => registar('concordancia')}>
        Concordância
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => registar('discordancia')}>
        Discordância
      </Button>
    </div>
  )
}
