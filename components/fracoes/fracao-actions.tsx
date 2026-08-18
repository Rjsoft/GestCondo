'use client'

import { useState, useTransition } from 'react'
import { alternarIsencaoElevador, eliminarFracao } from '@/app/actions/fracoes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RegistarTransmissaoDialog } from '@/components/fracoes/registar-transmissao-dialog'
import { GerirTitularesDialog } from '@/components/fracoes/gerir-titulares-dialog'
import { MoreHorizontal, Trash2, ArrowUpCircle, ArrowDownCircle, Repeat, Users } from 'lucide-react'
import { toast } from 'sonner'

export function FracaoActions({
  id,
  isentaElevador,
  proprietario,
  identificacao,
  emDivida,
}: {
  id: number
  isentaElevador: boolean
  proprietario: string
  identificacao: string
  emDivida: number
}) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [transmissaoOpen, setTransmissaoOpen] = useState(false)
  const [titularesOpen, setTitularesOpen] = useState(false)

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarFracao(id)
        toast.success('Fração eliminada')
        setConfirmOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const alternarElevador = () => {
    startTransition(async () => {
      try {
        await alternarIsencaoElevador(id, !isentaElevador)
        toast.success(
          isentaElevador
            ? 'Fração deixou de estar isenta de elevador'
            : 'Fração marcada como isenta de elevador',
        )
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
          <DropdownMenuItem onClick={alternarElevador}>
            {isentaElevador ? (
              <>
                <ArrowUpCircle className="h-4 w-4" />
                Retirar isenção de elevador
              </>
            ) : (
              <>
                <ArrowDownCircle className="h-4 w-4" />
                Isentar de elevador
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTransmissaoOpen(true)}>
            <Repeat className="h-4 w-4" />
            Registar transmissão
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTitularesOpen(true)}>
            <Users className="h-4 w-4" />
            Titulares
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
      <RegistarTransmissaoDialog
        fracaoId={id}
        proprietarioAtual={proprietario}
        emDivida={emDivida}
        open={transmissaoOpen}
        onOpenChange={setTransmissaoOpen}
      />
      <GerirTitularesDialog
        fracaoId={id}
        identificacao={identificacao}
        open={titularesOpen}
        onOpenChange={setTitularesOpen}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar fração"
        description="Esta ação não pode ser desfeita. Condóminos e movimentos financeiros ligados a esta fração deixam de estar associados a ela."
        onConfirm={remover}
        pending={pending}
      />
    </>
  )
}
