'use client'

import { useTransition } from 'react'
import { confirmarLeituraDocumento } from '@/app/actions/documentos'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

export function ConfirmarLeituraDocumentoButton({
  documentoId,
  confirmado,
}: {
  documentoId: number
  confirmado: boolean
}) {
  const [pending, startTransition] = useTransition()

  if (confirmado) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
        <Check className="h-3.5 w-3.5" />
        Leitura confirmada
      </span>
    )
  }

  const onClick = () => {
    startTransition(async () => {
      try {
        await confirmarLeituraDocumento(documentoId)
        toast.success('Leitura confirmada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao confirmar leitura')
      }
    })
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={onClick}>
      {pending ? 'A confirmar...' : 'Confirmar leitura'}
    </Button>
  )
}
