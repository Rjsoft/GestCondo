'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AplicarCreditoDialog } from '@/components/financas/aplicar-credito-dialog'
import { DevolverCreditoDialog } from '@/components/financas/devolver-credito-dialog'
import { MoreHorizontal, CheckCircle2, Undo2 } from 'lucide-react'

export function CreditoFracaoActions({ fracaoId, saldo }: { fracaoId: number; saldo: number }) {
  const [aplicarOpen, setAplicarOpen] = useState(false)
  const [devolverOpen, setDevolverOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setAplicarOpen(true)}>
            <CheckCircle2 className="h-4 w-4" />
            Aplicar a quota pendente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDevolverOpen(true)}>
            <Undo2 className="h-4 w-4" />
            Devolver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AplicarCreditoDialog
        fracaoId={fracaoId}
        saldo={saldo}
        open={aplicarOpen}
        onOpenChange={setAplicarOpen}
      />
      <DevolverCreditoDialog
        fracaoId={fracaoId}
        saldo={saldo}
        open={devolverOpen}
        onOpenChange={setDevolverOpen}
      />
    </>
  )
}
