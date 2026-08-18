'use client'

import { useTransition } from 'react'
import { exportarArquivoDocumentos } from '@/app/actions/documentos'
import { Button } from '@/components/ui/button'
import { Archive } from 'lucide-react'
import { toast } from 'sonner'

function base64ParaBlob(base64: string) {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) {
    bytes[i] = binario.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'application/zip' })
}

export function ExportarArquivoDocumentosButton() {
  const [pending, startTransition] = useTransition()

  const exportar = () => {
    startTransition(async () => {
      try {
        const { base64, total, totalIncluidos } = await exportarArquivoDocumentos()
        const blob = base64ParaBlob(base64)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `arquivo-documentos-${new Date().toISOString().slice(0, 10)}.zip`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(
          totalIncluidos < total
            ? `Exportação concluída — ${totalIncluidos} de ${total} documento(s) incluídos (os restantes são links externos ou sem ficheiro, listados no manifesto)`
            : `Exportação concluída — ${total} documento(s)`,
        )
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao exportar')
      }
    })
  }

  return (
    <Button variant="outline" onClick={exportar} disabled={pending}>
      <Archive className="h-4 w-4" />
      {pending ? 'A preparar...' : 'Exportar arquivo completo'}
    </Button>
  )
}
