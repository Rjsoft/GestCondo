'use client'

import { useEffect, useState, useTransition } from 'react'
import { confirmarAssociacaoConta, previsualizarAssociacaoConta } from '@/app/actions/contas-financeiras'
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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DESTINO_LABEL } from '@/lib/financas'
import { formatData, formatEuro } from '@/lib/format'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'

type Preview = {
  total: number
  totalReceitas: number
  totalDespesas: number
  ignoradosPorExercicioFechado: number
  amostra: { id: number; data: Date; categoria: string; descricao: string; valor: string; tipo: string }[]
}

export function AssociarContaDialog({
  contaFinanceiraId,
  nome,
  onSucesso,
}: {
  contaFinanceiraId: number
  nome: string
  onSucesso?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [destino, setDestino] = useState('geral')
  const [carregando, setCarregando] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    previsualizarAssociacaoConta(destino)
      .then(setPreview)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao preparar a associação'))
      .finally(() => setCarregando(false))
  }, [open, destino])

  const mudarDestino = (novoDestino: string) => {
    setCarregando(true)
    setDestino(novoDestino)
  }

  const confirmar = () => {
    startTransition(async () => {
      try {
        const { associados, porClassificar } = await confirmarAssociacaoConta(contaFinanceiraId, destino)
        toast.success(
          `${associados} movimento(s) associado(s) a "${nome}"` +
            (porClassificar > 0 ? ` — ${porClassificar} continuam por classificar` : ''),
        )
        setOpen(false)
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao associar')
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setCarregando(true)
        else setPreview(null)
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="ghost" />}>
        <Link2 className="h-4 w-4" />
        Associar movimentos
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Associar movimentos a &quot;{nome}&quot;</DialogTitle>
          <DialogDescription>
            Os movimentos mais antigos só têm um destino genérico (conta corrente ou fundo de
            reserva), não uma conta financeira concreta. Escolha a que destino corresponde
            esta conta e associe os movimentos ainda sem conta atribuída.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Esta conta corresponde a</Label>
          <Select value={destino} onValueChange={(v) => v && mudarDestino(v)}>
            <SelectTrigger>
              <SelectValue>{(v: string | null) => (v ? DESTINO_LABEL[v] : '')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">{DESTINO_LABEL.geral}</SelectItem>
              <SelectItem value="reserva">{DESTINO_LABEL.reserva}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {carregando && <p className="text-sm text-muted-foreground">A procurar movimentos...</p>}

        {preview && !carregando && (
          <div className="flex flex-col gap-2">
            {preview.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há movimentos por associar com este destino.
              </p>
            ) : (
              <>
                <p className="text-sm text-foreground">
                  {preview.total} movimento(s) encontrado(s) — receitas {formatEuro(preview.totalReceitas)},
                  despesas {formatEuro(preview.totalDespesas)}.
                </p>
                {preview.ignoradosPorExercicioFechado > 0 && (
                  <p className="text-xs text-amber-700">
                    {preview.ignoradosPorExercicioFechado} movimento(s) ficam de fora por pertencerem a um
                    exercício já fechado.
                  </p>
                )}
                <div className="rounded-md border border-border p-2 text-sm text-muted-foreground">
                  {preview.amostra.map((m) => (
                    <p key={m.id}>
                      {formatData(m.data)} — {m.categoria} ({formatEuro(Number(m.valor))})
                    </p>
                  ))}
                  {preview.total > preview.amostra.length && (
                    <p>... e mais {preview.total - preview.amostra.length}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={confirmar} disabled={pending || carregando || !preview || preview.total === 0}>
            {pending ? 'A associar...' : 'Confirmar associação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
