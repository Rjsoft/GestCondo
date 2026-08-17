'use client'

import { useTransition } from 'react'
import { registarEmissaoDocumentoCobranca } from '@/app/actions/cobranca'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Substitui o botão de impressão simples nos documentos de cobrança
 * (interpelação/declaração de dívida): regista primeiro um snapshot
 * imutável da emissão (achado 2026-08-17, ver FUNCTIONAL_GAPS.md secção
 * 3), só depois abre a caixa de impressão — nunca imprime sem deixar
 * prova.
 */
export function EmitirDocumentoButton({
  fracaoId,
  tipo,
  prazoDias,
}: {
  fracaoId: number
  tipo: 'interpelacao' | 'declaracao_divida'
  prazoDias?: number
}) {
  const [pending, startTransition] = useTransition()

  const emitir = () => {
    startTransition(async () => {
      try {
        await registarEmissaoDocumentoCobranca(fracaoId, tipo, { prazoDias })
        toast.success('Emissão registada')
        window.print()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar a emissão')
      }
    })
  }

  return (
    <Button onClick={emitir} disabled={pending} className="print:hidden">
      <Printer className="h-4 w-4" />
      {pending ? 'A registar...' : 'Registar emissão e imprimir'}
    </Button>
  )
}
