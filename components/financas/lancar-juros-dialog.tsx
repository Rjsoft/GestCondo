'use client'

import { useMemo, useState, useTransition } from 'react'
import { lancarJurosMora } from '@/app/actions/financas'
import { calcularJurosMora } from '@/lib/juros'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro } from '@/lib/format'
import { Percent } from 'lucide-react'
import { toast } from 'sonner'

export function LancarJurosDialog({
  quotasEmAtraso,
  fracoes,
}: {
  quotasEmAtraso: { fracaoId: number | null; valor: string; data: Date }[]
  fracoes: { id: number; identificacao: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [taxa, setTaxa] = useState('')
  const [pending, startTransition] = useTransition()

  const identificacaoPorId = useMemo(
    () => new Map(fracoes.map((f) => [f.id, f.identificacao])),
    [fracoes],
  )

  const quotasValidas = useMemo(
    () =>
      quotasEmAtraso
        .filter((q): q is { fracaoId: number; valor: string; data: Date } => q.fracaoId != null)
        .map((q) => ({ fracaoId: q.fracaoId, valor: Number(q.valor), data: q.data })),
    [quotasEmAtraso],
  )

  const taxaNumero = Number(taxa.replace(',', '.'))
  const preview =
    taxaNumero > 0 ? calcularJurosMora(quotasValidas, taxaNumero) : []
  const totalPreview = preview.reduce((s, f) => s + f.valorJuros, 0)

  const confirmar = () => {
    startTransition(async () => {
      try {
        const { quantidade, total } = await lancarJurosMora(taxaNumero)
        toast.success(`Juros lançados em ${quantidade} fração(ões): ${formatEuro(total)}`)
        setOpen(false)
        setTaxa('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao lançar juros')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Percent className="h-4 w-4" />
        Lançar juros de mora
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar juros de mora</DialogTitle>
          <DialogDescription>
            Calcula juros simples sobre todas as quotas em atraso (por pagar, com data já
            passada), proporcionais aos dias de atraso. A app não sugere nem guarda uma
            taxa — verifique o regulamento do condomínio ou a taxa legal em vigor antes de
            confirmar. Cria um movimento de receita por fração com dívida.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="taxa">Taxa de juro anual (%)</Label>
          <Input
            id="taxa"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 4"
            value={taxa}
            onChange={(e) => setTaxa(e.target.value)}
          />
        </div>

        {quotasValidas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Não há quotas em atraso de momento.</p>
        ) : taxaNumero > 0 ? (
          <>
            <div className="max-h-64 overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fração</TableHead>
                    <TableHead className="text-right">Quotas em atraso</TableHead>
                    <TableHead className="text-right">Juros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((f) => (
                    <TableRow key={f.fracaoId}>
                      <TableCell className="font-medium">
                        {identificacaoPorId.get(f.fracaoId) ?? `Fração #${f.fracaoId}`}
                      </TableCell>
                      <TableCell className="text-right">{f.quotas.length}</TableCell>
                      <TableCell className="text-right">{formatEuro(f.valorJuros)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm font-medium text-foreground">
              Total a lançar: {formatEuro(totalPreview)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Indique a taxa para ver a pré-visualização.
          </p>
        )}

        <DialogFooter>
          <Button
            onClick={confirmar}
            disabled={pending || quotasValidas.length === 0 || taxaNumero <= 0}
          >
            {pending ? 'A lançar...' : 'Confirmar e lançar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
