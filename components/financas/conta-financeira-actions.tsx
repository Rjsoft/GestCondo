'use client'

import { useState, useTransition } from 'react'
import { encerrarContaFinanceira } from '@/app/actions/contas-financeiras'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AssociarContaDialog } from '@/components/financas/associar-conta-dialog'
import { DefinirSaldoInicialDialog } from '@/components/financas/definir-saldo-inicial-dialog'
import { EditarContaFinanceiraDialog } from '@/components/financas/editar-conta-financeira-dialog'
import { Lock, MoreHorizontal, Pencil, Wallet } from 'lucide-react'
import { toast } from 'sonner'

export function ContaFinanceiraActions({
  conta,
  exercicioAtivo,
  saldoInicial,
  saldoAtual,
  onSucesso,
}: {
  conta: {
    id: number
    nome: string
    banco: string | null
    iban: string | null
    tipo: string
    moeda: string
    estado: string
    notaTransitoria: string | null
  }
  exercicioAtivo: { id: number; designacao: string } | null
  saldoInicial: number
  saldoAtual: number
  onSucesso?: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [editarOpen, setEditarOpen] = useState(false)
  const [saldoOpen, setSaldoOpen] = useState(false)
  const [encerrarOpen, setEncerrarOpen] = useState(false)

  const encerrar = () => {
    if (!exercicioAtivo) return
    startTransition(async () => {
      try {
        await encerrarContaFinanceira(conta.id, exercicioAtivo.id)
        toast.success('Conta encerrada')
        setEncerrarOpen(false)
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao encerrar')
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {exercicioAtivo && conta.estado === 'ativa' && (
          <AssociarContaDialog contaFinanceiraId={conta.id} nome={conta.nome} onSucesso={onSucesso} />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={pending} />}>
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditarOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {exercicioAtivo && (
              <DropdownMenuItem onClick={() => setSaldoOpen(true)}>
                <Wallet className="h-4 w-4" />
                Corrigir saldo inicial
              </DropdownMenuItem>
            )}
            {exercicioAtivo && conta.estado === 'ativa' && (
              <DropdownMenuItem
                onClick={() => setEncerrarOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Lock className="h-4 w-4" />
                Encerrar conta
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditarContaFinanceiraDialog
        open={editarOpen}
        onOpenChange={setEditarOpen}
        conta={conta}
        onSucesso={onSucesso}
      />

      {exercicioAtivo && (
        <DefinirSaldoInicialDialog
          open={saldoOpen}
          onOpenChange={setSaldoOpen}
          contaFinanceiraId={conta.id}
          nomeConta={conta.nome}
          exercicioId={exercicioAtivo.id}
          designacaoExercicio={exercicioAtivo.designacao}
          valorAtual={saldoInicial}
          onSucesso={onSucesso}
        />
      )}

      <ConfirmDialog
        open={encerrarOpen}
        onOpenChange={setEncerrarOpen}
        title="Encerrar conta"
        description={
          Math.abs(saldoAtual) > 0.005
            ? `Esta conta ainda tem ${saldoAtual.toFixed(2)} € de saldo — regularize antes de a encerrar.`
            : 'A conta deixa de aceitar novos movimentos, mas continua visível no histórico.'
        }
        confirmLabel="Encerrar"
        onConfirm={encerrar}
        pending={pending}
      />
    </>
  )
}
