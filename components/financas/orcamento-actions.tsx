'use client'

import { useState, useTransition } from 'react'
import { eliminarOrcamento } from '@/app/actions/orcamentos'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GerarQuotasDialog } from '@/components/financas/gerar-quotas-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MoreHorizontal, Trash2, Calculator } from 'lucide-react'
import { toast } from 'sonner'

export function OrcamentoActions({
  id,
  ano,
  valorAnual,
  valorAnualElevador,
  fracoes,
}: {
  id: number
  ano: number
  valorAnual: number
  valorAnualElevador: number
  fracoes: {
    id: number
    identificacao: string
    permilagem: number
    isentaElevador: boolean
  }[]
}) {
  const [pending, startTransition] = useTransition()
  const [gerarAberto, setGerarAberto] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarOrcamento(id)
        toast.success('Orçamento eliminado')
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
          <DropdownMenuItem onClick={() => setGerarAberto(true)}>
            <Calculator className="h-4 w-4" />
            Gerar quotas mensais
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
      <GerarQuotasDialog
        open={gerarAberto}
        onOpenChange={setGerarAberto}
        orcamentoId={id}
        ano={ano}
        valorAnual={valorAnual}
        valorAnualElevador={valorAnualElevador}
        fracoes={fracoes}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar orçamento"
        description="Esta ação não pode ser desfeita. As quotas já geradas a partir deste orçamento não são apagadas, mas deixam de estar ligadas a ele."
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
