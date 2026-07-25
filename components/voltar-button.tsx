'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function VoltarButton() {
  const router = useRouter()
  return (
    <Button variant="outline" onClick={() => router.back()} className="print:hidden">
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Button>
  )
}
