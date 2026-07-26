'use client'

import { useTransition } from 'react'
import { exportarCondominio } from '@/app/actions/condominio'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export function ExportarDadosCondominioButton() {
  const [pending, startTransition] = useTransition()

  const exportar = () => {
    startTransition(async () => {
      try {
        const dados = await exportarCondominio()
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `condominio-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Exportação concluída')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao exportar')
      }
    })
  }

  return (
    <Button variant="outline" onClick={exportar} disabled={pending}>
      <Download className="h-4 w-4" />
      {pending ? 'A preparar...' : 'Exportar dados do condomínio'}
    </Button>
  )
}
