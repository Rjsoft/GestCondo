'use client'

import { useTransition } from 'react'
import { alterarEstadoSubscricao } from '@/app/actions/plataforma'
import { Button } from '@/components/ui/button'
import { Unlock } from 'lucide-react'
import { toast } from 'sonner'

export function ReativarButton({ condominioId }: { condominioId: number }) {
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    startTransition(async () => {
      try {
        await alterarEstadoSubscricao(condominioId, 'ativo')
        toast.success('Condomínio reativado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao reativar')
      }
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      <Unlock className="h-4 w-4" />
      {pending ? 'A reativar...' : 'Reativar'}
    </Button>
  )
}
