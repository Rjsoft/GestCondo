'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { eliminarMovimento, alternarPago } from '@/app/actions/financas'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MarcarPagoDialog } from '@/components/financas/marcar-pago-dialog'
import { EditarMovimentoDialog } from '@/components/financas/editar-movimento-dialog'
import { MoreHorizontal, Trash2, CheckCircle2, Circle, Receipt, Pencil } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string }
type FornecedorOpcao = { id: number; nome: string }

export function MovimentoActions({
  id,
  pago,
  tipo,
  categoria,
  descricao,
  valor,
  data,
  destino,
  fracaoId,
  fornecedorId,
  fracoes,
  fornecedores,
}: {
  id: number
  pago: boolean
  tipo: string
  categoria: string
  descricao: string
  valor: string
  data: Date
  destino: string
  fracaoId: number | null
  fornecedorId: number | null
  fracoes: FracaoOpcao[]
  fornecedores: FornecedorOpcao[]
}) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [marcarPagoOpen, setMarcarPagoOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarMovimento(id)
        toast.success('Movimento eliminado')
        setConfirmOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const marcarPendente = () => {
    startTransition(async () => {
      try {
        await alternarPago(id, false)
        toast.success('Marcado como pendente')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" disabled={pending} />}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditarOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
          {tipo === 'receita' && (
            <DropdownMenuItem render={<Link href={`/financas/recibo/${id}`} />}>
              <Receipt className="h-4 w-4" />
              Ver recibo
            </DropdownMenuItem>
          )}
          {tipo === 'receita' && (
            <DropdownMenuItem onClick={pago ? marcarPendente : () => setMarcarPagoOpen(true)}>
              {pago ? (
                <>
                  <Circle className="h-4 w-4" />
                  Marcar pendente
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar como pago
                </>
              )}
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
        title="Eliminar movimento"
        description="O movimento deixa de aparecer nas listagens e nos saldos. Por obrigação legal de retenção de dados financeiros, o registo não é apagado fisicamente da base de dados."
        onConfirm={remover}
        pending={pending}
      />
      <MarcarPagoDialog id={id} open={marcarPagoOpen} onOpenChange={setMarcarPagoOpen} />
      <EditarMovimentoDialog
        id={id}
        open={editarOpen}
        onOpenChange={setEditarOpen}
        tipo={tipo}
        categoria={categoria}
        descricao={descricao}
        valor={valor}
        data={data}
        destino={destino}
        fracaoId={fracaoId}
        fornecedorId={fornecedorId}
        fracoes={fracoes}
        fornecedores={fornecedores}
      />
    </>
  )
}
