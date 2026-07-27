'use client'

import { useTransition } from 'react'
import { enviarLembreteCobranca } from '@/app/actions/financas'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

export function EnviarLembreteButton({
  fracaoId,
  escalao,
  label,
}: {
  fracaoId: number
  escalao: string
  label: string
}) {
  const [pending, startTransition] = useTransition()

  const enviar = () => {
    startTransition(async () => {
      try {
        await enviarLembreteCobranca(fracaoId, escalao)
        toast.success('Lembrete enviado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao enviar')
      }
    })
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={enviar}>
      <Send className="h-4 w-4" />
      {label}
    </Button>
  )
}
