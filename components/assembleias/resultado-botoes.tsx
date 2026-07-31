'use client'

import { useState, useTransition } from 'react'
import { definirResultadoPonto } from '@/app/actions/assembleias'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

const OPCOES: { resultado: string; label: string }[] = [
  { resultado: 'aprovado', label: 'Aprovar' },
  { resultado: 'reprovado', label: 'Reprovar' },
  { resultado: 'adiado', label: 'Adiar' },
]

/** Botões para registar (ou corrigir, enquanto a assembleia estiver editável)
 * o resultado de uma deliberação. `definirResultadoPonto` permite reescrever
 * o resultado a qualquer momento antes da aprovação da ata — por isso os
 * botões continuam disponíveis mesmo depois de já existir um resultado,
 * sempre atrás de confirmação (não há forma de desfazer pela interface). */
export function ResultadoBotoesClient({
  pontoId,
  resultadoAtual,
}: {
  pontoId: number
  resultadoAtual: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [candidato, setCandidato] = useState<{ resultado: string; label: string } | null>(null)

  const confirmar = () => {
    if (!candidato) return
    const { resultado } = candidato
    startTransition(async () => {
      try {
        await definirResultadoPonto(pontoId, resultado)
        toast.success('Deliberação registada')
        setCandidato(null)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Resultado da deliberação">
        {OPCOES.map((o) => (
          <Button
            key={o.resultado}
            type="button"
            variant={resultadoAtual === o.resultado ? 'secondary' : 'outline'}
            size="sm"
            disabled={pending}
            onClick={() => setCandidato(o)}
          >
            {resultadoAtual ? `Corrigir: ${o.label}` : o.label}
          </Button>
        ))}
      </div>
      <ConfirmDialog
        open={candidato !== null}
        onOpenChange={(open) => !open && setCandidato(null)}
        title="Confirmar resultado da deliberação"
        description={
          resultadoAtual
            ? `Já está registado "${resultadoAtual}". Confirma que quer alterar o resultado para "${candidato?.label}"? Depois de confirmar, só é possível corrigir voltando a esta mesma ação.`
            : `Confirma que quer registar "${candidato?.label}" como resultado desta deliberação?`
        }
        confirmLabel="Confirmar"
        onConfirm={confirmar}
        pending={pending}
      />
    </>
  )
}
