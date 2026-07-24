'use client'

import { useState, useTransition } from 'react'
import { eliminarDocumentoFornecedor } from '@/app/actions/documentos-fornecedor'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PagamentosDocumentoFornecedorDialog } from '@/components/financas/pagamentos-documento-fornecedor-dialog'
import { MoreHorizontal, Trash2, FileText, Euro } from 'lucide-react'
import { toast } from 'sonner'

type Pagamento = { id: number; valor: string; dataPagamento: Date; movimentoId: number | null }

export function DocumentoFornecedorActions({
  id,
  categoria,
  valor,
  valorPago,
  saldo,
  pagamentos,
  anexoUrl,
}: {
  id: number
  categoria: string
  valor: number
  valorPago: number
  saldo: number
  pagamentos: Pagamento[]
  anexoUrl?: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pagamentosOpen, setPagamentosOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarDocumentoFornecedor(id)
        toast.success('Documento eliminado')
        setConfirmOpen(false)
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
          <DropdownMenuItem onClick={() => setPagamentosOpen(true)}>
            <Euro className="h-4 w-4" />
            Ver pagamentos
          </DropdownMenuItem>
          {anexoUrl && (
            <DropdownMenuItem
              render={
                <a
                  href={`/api/ficheiros?url=${encodeURIComponent(anexoUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <FileText className="h-4 w-4" />
              Ver anexo
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar documento"
        description="Só é possível eliminar um documento sem pagamentos registados. Esta ação não pode ser desfeita."
        onConfirm={remover}
        pending={pending}
      />
      <PagamentosDocumentoFornecedorDialog
        documentoFornecedorId={id}
        categoria={categoria}
        valor={valor}
        valorPago={valorPago}
        saldo={saldo}
        pagamentos={pagamentos}
        open={pagamentosOpen}
        onOpenChange={setPagamentosOpen}
      />
    </>
  )
}
