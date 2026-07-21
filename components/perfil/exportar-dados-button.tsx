'use client'

import { useTransition } from 'react'
import { exportarMeusDados } from '@/app/actions/perfil'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export function ExportarDadosButton() {
  const [pending, startTransition] = useTransition()

  const exportar = () => {
    startTransition(async () => {
      try {
        const dados = await exportarMeusDados()
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'os-meus-dados-gestcondo.json'
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao exportar')
      }
    })
  }

  return (
    <Button variant="outline" onClick={exportar} disabled={pending}>
      <Download className="h-4 w-4" />
      {pending ? 'A preparar...' : 'Exportar os meus dados'}
    </Button>
  )
}
