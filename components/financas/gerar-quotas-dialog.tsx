'use client'

import { useMemo, useTransition } from 'react'
import { gerarQuotasOrcamento } from '@/app/actions/orcamentos'
import { calcularQuotasMensais } from '@/lib/rateio'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro } from '@/lib/format'
import { toast } from 'sonner'

export function GerarQuotasDialog({
  open,
  onOpenChange,
  orcamentoId,
  ano,
  valorAnual,
  valorAnualElevador,
  fracoes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orcamentoId: number
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

  const totalPermilagem = useMemo(
    () => fracoes.reduce((s, f) => s + f.permilagem, 0),
    [fracoes],
  )

  const preview = useMemo(() => {
    try {
      return calcularQuotasMensais(fracoes, valorAnual, valorAnualElevador)
    } catch (e) {
      return e instanceof Error ? e.message : 'Erro ao calcular o rateio'
    }
  }, [fracoes, valorAnual, valorAnualElevador])

  const confirmar = () => {
    startTransition(async () => {
      try {
        const { quantidade } = await gerarQuotasOrcamento(orcamentoId)
        toast.success(`${quantidade} quotas mensais geradas para ${ano}`)
        onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao gerar quotas')
      }
    })
  }

  const erro = typeof preview === 'string' ? preview : null
  const quotas = typeof preview === 'string' ? null : preview

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar quotas mensais — {ano}</DialogTitle>
          <DialogDescription>
            Cria 12 quotas por fração (uma por mês), com o valor rateado por permilagem a
            partir do orçamento anual de {formatEuro(valorAnual)}
            {valorAnualElevador > 0 &&
              ` (incluindo ${formatEuro(valorAnualElevador)} de elevador, rateado só pelas frações não isentas)`}
            . Confirme os valores antes de gerar — esta ação não pode ser desfeita pela
            aplicação (as quotas geradas têm de ser eliminadas uma a uma, se necessário).
          </DialogDescription>
        </DialogHeader>

        {erro ? (
          <p className="text-sm text-destructive">{erro}</p>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fração</TableHead>
                    <TableHead className="text-right">Permilagem</TableHead>
                    <TableHead className="text-right">Quota/mês</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fracoes.map((f) => {
                    const quota = quotas?.find((p) => p.fracaoId === f.id)
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">
                          {f.identificacao}
                          {f.isentaElevador && valorAnualElevador > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (isenta elevador)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{f.permilagem.toFixed(2)}‰</TableCell>
                        <TableCell className="text-right">
                          {quota ? formatEuro(quota.valorMensal) : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <p
              className={
                Math.abs(totalPermilagem - 1000) > 0.5
                  ? 'text-xs text-amber-600'
                  : 'text-xs text-muted-foreground'
              }
            >
              Permilagem total apurada: {totalPermilagem.toFixed(2)}‰
              {Math.abs(totalPermilagem - 1000) > 0.5 &&
                ' — o esperado é 1000‰. O rateio é feito proporcionalmente à soma real, mas confirme as permilagens das frações em "Frações".'}
            </p>
          </>
        )}

        <DialogFooter>
          <Button onClick={confirmar} disabled={pending || !!erro}>
            {pending ? 'A gerar...' : 'Confirmar e gerar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
