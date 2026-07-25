'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// window.history.back() em vez do router.back() do Next: confirmado em
// testes que router.back() não navega quando a página foi aberta por
// navegação completa (URL direta, marcador, ligação partilhada) em vez de
// um Link interno — o histórico do browser tem a entrada, mas o router do
// Next não a reconhece nesse cenário. window.history.back() funciona nos
// dois casos.
export function VoltarButton() {
  return (
    <Button
      variant="outline"
      onClick={() => window.history.back()}
      className="print:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Button>
  )
}
