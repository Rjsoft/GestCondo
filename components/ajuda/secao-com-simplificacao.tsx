'use client'

import { useState, type ReactNode } from 'react'
import { FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { pararLeituraAoMudarSecao } from '@/components/leitura-voz/use-leitura-voz'

/**
 * Alterna entre o texto completo de uma secção e uma versão resumida,
 * reescrita à mão (não gerada por IA — ver docs/audit/AI_FEATURES_VIABILITY.md,
 * item P1 "explicação simplificada"). Nunca mostra as duas ao mesmo tempo:
 * a versão que não está ativa nem chega a ficar no DOM, para o botão "Ler em
 * voz alta" (data-speech-content) nunca ler o texto escondido.
 */
export function SecaoComSimplificacao({
  original,
  simplificado,
}: {
  original: ReactNode
  simplificado: ReactNode
}) {
  const [mostrarSimplificado, setMostrarSimplificado] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => {
          // O conteúdo por baixo do botão de leitura em voz alta muda —
          // mesma razão por que trocar de separador também para a leitura
          // (ver use-leitura-voz.ts): nunca continuar a ler um texto que
          // acabou de deixar de estar visível.
          pararLeituraAoMudarSecao()
          setMostrarSimplificado((v) => !v)
        }}
      >
        {mostrarSimplificado ? (
          <FileText className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {mostrarSimplificado ? 'Ver texto completo' : 'Explicar de forma mais simples'}
      </Button>
      {mostrarSimplificado && (
        <p className="text-xs text-muted-foreground">
          Está a ver um resumo simplificado — o texto completo continua
          disponível a qualquer momento no botão acima.
        </p>
      )}
      {mostrarSimplificado ? simplificado : original}
    </div>
  )
}
