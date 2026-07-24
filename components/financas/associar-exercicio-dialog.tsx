'use client'

import { useEffect, useState, useTransition } from 'react'
import { confirmarAssociacaoExercicio, previsualizarAssociacaoExercicio } from '@/app/actions/exercicios'
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
import { formatData, formatEuro } from '@/lib/format'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'

type Preview = {
  total: number
  totalReceitas: number
  totalDespesas: number
  amostra: { id: number; data: Date; categoria: string; descricao: string; valor: string; tipo: string }[]
}

export function AssociarExercicioDialog({
  exercicioId,
  designacao,
  onSucesso,
}: {
  exercicioId: number
  designacao: string
  onSucesso?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    previsualizarAssociacaoExercicio(exercicioId)
      .then(setPreview)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao preparar a associação'))
      .finally(() => setCarregando(false))
  }, [open, exercicioId])

  const confirmar = () => {
    startTransition(async () => {
      try {
        const { associados, porClassificar } = await confirmarAssociacaoExercicio(exercicioId)
        toast.success(
          `${associados} movimento(s) associado(s)` +
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
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Link2 className="h-4 w-4" />
        Associar movimentos antigos
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Associar movimentos a &quot;{designacao}&quot;</DialogTitle>
          <DialogDescription>
            Procura movimentos com data dentro deste período que ainda não têm exercício
            atribuído (normalmente lançados antes desta funcionalidade existir) e associa-os
            de uma vez. Não altera nenhum outro dado do movimento.
          </DialogDescription>
        </DialogHeader>

        {carregando && <p className="text-sm text-muted-foreground">A procurar movimentos...</p>}

        {preview && !carregando && (
          <div className="flex flex-col gap-2">
            {preview.total === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há movimentos por associar neste período.
              </p>
            ) : (
              <>
                <p className="text-sm text-foreground">
                  {preview.total} movimento(s) encontrado(s) — receitas {formatEuro(preview.totalReceitas)},
                  despesas {formatEuro(preview.totalDespesas)}.
                </p>
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
