'use client'

import { useState, useTransition } from 'react'
import { alternarConfidencialidadeDocumento, eliminarDocumento } from '@/app/actions/documentos'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SubstituirFicheiroDialog } from '@/components/documentos/substituir-ficheiro-dialog'
import { MoreHorizontal, Trash2, EyeOff, Eye, FileUp } from 'lucide-react'
import { toast } from 'sonner'

export function DocumentoActions({ id, confidencial }: { id: number; confidencial: boolean }) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [substituirOpen, setSubstituirOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarDocumento(id)
        toast.success('Documento eliminado')
        setConfirmOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const alternarConfidencial = () => {
    startTransition(async () => {
      try {
        await alternarConfidencialidadeDocumento(id, !confidencial)
        toast.success(confidencial ? 'Documento tornado público' : 'Documento marcado como confidencial')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={pending} />}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={alternarConfidencial}>
            {confidencial ? (
              <>
                <Eye className="h-4 w-4" />
                Tornar público
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Marcar confidencial
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSubstituirOpen(true)}>
            <FileUp className="h-4 w-4" />
            Substituir ficheiro
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SubstituirFicheiroDialog id={id} open={substituirOpen} onOpenChange={setSubstituirOpen} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar documento"
        description="Esta ação não pode ser desfeita. O documento deixa de estar disponível para os condóminos."
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
