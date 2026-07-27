'use client'

import { useEffect, useState, useTransition } from 'react'
import { aplicarCreditoQuota, getQuotasPendentesFracao } from '@/app/actions/creditos'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatData, formatEuro } from '@/lib/format'
import { toast } from 'sonner'

type Quota = { id: number; categoria: string; descricao: string; valor: string; data: Date }

export function AplicarCreditoDialog({
  fracaoId,
  saldo,
  open,
  onOpenChange,
}: {
  fracaoId: number
  saldo: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [quotas, setQuotas] = useState<Quota[] | null>(null)
  const [pendingCarregar, startCarregar] = useTransition()
  const [pendingAplicar, startAplicar] = useTransition()

  // Este diálogo é sempre aberto de fora (menu de ações), nunca pelo seu
  // próprio DialogTrigger — por isso o carregamento tem de reagir à
  // mudança da prop `open`, não ao onOpenChange do Dialog (que só dispara
  // para interações do próprio utilizador com o diálogo, ex. Escape).
  useEffect(() => {
    if (!open) return
    startCarregar(async () => {
      setQuotas(await getQuotasPendentesFracao(fracaoId))
    })
  }, [open, fracaoId])

  const aplicar = (movimentoId: number) => {
    startAplicar(async () => {
      try {
        await aplicarCreditoQuota(fracaoId, movimentoId)
        toast.success('Crédito aplicado à quota')
        onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao aplicar crédito')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar crédito a uma quota pendente</DialogTitle>
          <DialogDescription>
            Crédito disponível: <strong>{formatEuro(saldo)}</strong>. Só é possível aplicar a
            quotas cujo valor não ultrapasse o crédito disponível.
          </DialogDescription>
        </DialogHeader>
        {pendingCarregar && <p className="text-sm text-muted-foreground">A carregar...</p>}
        {!pendingCarregar && quotas?.length === 0 && (
          <p className="text-sm text-muted-foreground">Esta fração não tem quotas pendentes.</p>
        )}
        {!pendingCarregar && quotas && quotas.length > 0 && (
          <ul className="flex flex-col gap-2">
            {quotas.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {q.categoria} — {q.descricao}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatData(q.data)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatEuro(Number(q.valor))}</span>
                  <Button
                    size="sm"
                    disabled={pendingAplicar || Number(q.valor) > saldo}
                    onClick={() => aplicar(q.id)}
                  >
                    Aplicar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
