'use client'

import { useEffect, useState, useTransition } from 'react'
import { fecharExercicio, prepararFechoExercicio } from '@/app/actions/exercicios'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatEuro } from '@/lib/format'
import { AlertTriangle, Lock, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

type SituacaoFecho = {
  bloqueios: string[]
  avisos: string[]
  resumo: {
    numMovimentos: number
    totalReceitas: number
    totalDespesas: number
    saldosPorConta: { nome: string; saldo: number }[]
  }
}

export function FecharExercicioDialog({
  exercicioId,
  designacao,
  trigger,
  onSucesso,
}: {
  exercicioId: number
  designacao: string
  trigger?: React.ReactElement
  onSucesso?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [situacao, setSituacao] = useState<SituacaoFecho | null>(null)
  const [avisosConfirmados, setAvisosConfirmados] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    prepararFechoExercicio(exercicioId)
      .then(setSituacao)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erro ao preparar o fecho'))
      .finally(() => setCarregando(false))
  }, [open, exercicioId])

  const confirmar = () => {
    startTransition(async () => {
      try {
        await fecharExercicio(exercicioId, avisosConfirmados)
        toast.success('Exercício fechado')
        setOpen(false)
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao fechar')
      }
    })
  }

  const temBloqueios = (situacao?.bloqueios.length ?? 0) > 0
  const temAvisos = (situacao?.avisos.length ?? 0) > 0
  const podeConfirmar = !carregando && !temBloqueios && (!temAvisos || avisosConfirmados)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) {
          setCarregando(true)
        } else {
          setSituacao(null)
          setAvisosConfirmados(false)
        }
      }}
    >
      <DialogTrigger render={trigger ?? <Button size="sm" variant="outline" />}>
        {!trigger && (
          <>
            <Lock className="h-4 w-4" />
            Fechar
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fechar exercício &quot;{designacao}&quot;</DialogTitle>
          <DialogDescription>
            Depois de fechado, este exercício deixa de aceitar novos movimentos, alterações
            de pagamento ou associações — até ser reaberto explicitamente, com motivo
            registado.
          </DialogDescription>
        </DialogHeader>

        {carregando && <p className="text-sm text-muted-foreground">A analisar o exercício...</p>}

        {situacao && !carregando && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p>{situacao.resumo.numMovimentos} movimento(s) no período.</p>
              <p className="text-emerald-600">Receitas: {formatEuro(situacao.resumo.totalReceitas)}</p>
              <p className="text-red-600">Despesas: {formatEuro(situacao.resumo.totalDespesas)}</p>
              {situacao.resumo.saldosPorConta.length > 0 && (
                <div className="mt-2 flex flex-col gap-0.5">
                  {situacao.resumo.saldosPorConta.map((c) => (
                    <p key={c.nome} className="text-muted-foreground">
                      Saldo final — {c.nome}: <span className="font-medium text-foreground">{formatEuro(c.saldo)}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            {temBloqueios && (
              <div className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Não é possível fechar este exercício
                </div>
                <ul className="list-inside list-disc">
                  {situacao.bloqueios.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {temAvisos && (
              <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="flex items-center gap-2 font-medium">
                  <TriangleAlert className="h-4 w-4" />
                  Situações a confirmar antes de fechar
                </div>
                <ul className="list-inside list-disc">
                  {situacao.avisos.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <label className="mt-1 flex items-start gap-2">
                  <Checkbox
                    checked={avisosConfirmados}
                    onCheckedChange={(v) => setAvisosConfirmados(v === true)}
                  />
                  <span>
                    Confirmo que tomei conhecimento das situações acima e quero fechar mesmo assim.
                  </span>
                </label>
              </div>
            )}

            {!temBloqueios && !temAvisos && (
              <p className="text-sm text-emerald-700">Sem pendências — pronto a fechar.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={confirmar} disabled={pending || !podeConfirmar}>
            {pending ? 'A fechar...' : 'Fechar exercício'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
