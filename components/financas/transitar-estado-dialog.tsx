'use client'

import { useState, useTransition } from 'react'
import { transitarEstadoProcessoCobranca } from '@/app/actions/cobranca'
import { ESTADOS_COBRANCA, ESTADOS_COM_NOTA_OBRIGATORIA, ESTADO_LABELS, type EstadoCobranca } from '@/lib/cobranca'
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
import { Textarea } from '@/components/ui/textarea'
import { ArrowRightCircle } from 'lucide-react'
import { toast } from 'sonner'

export function TransitarEstadoDialog({
  processoId,
  estadoAtual,
}: {
  processoId: number
  estadoAtual: EstadoCobranca
}) {
  const [open, setOpen] = useState(false)
  const [novoEstado, setNovoEstado] = useState<string | null>(null)
  const [nota, setNota] = useState('')
  const [pending, startTransition] = useTransition()

  const notaObrigatoria = novoEstado ? (ESTADOS_COM_NOTA_OBRIGATORIA as string[]).includes(novoEstado) : false
  const opcoes = ESTADOS_COBRANCA.filter((e) => e !== estadoAtual)

  const confirmar = () => {
    if (!novoEstado) return
    startTransition(async () => {
      try {
        await transitarEstadoProcessoCobranca(processoId, novoEstado, nota)
        toast.success('Estado atualizado')
        setOpen(false)
        setNovoEstado(null)
        setNota('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao mudar de estado')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ArrowRightCircle className="h-4 w-4" />
        Mudar estado
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mudar estado do processo</DialogTitle>
          <DialogDescription>
            Estado atual: {ESTADO_LABELS[estadoAtual]}. Não há uma sequência obrigatória — escolha
            o estado que corresponde à situação real.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label>Novo estado</Label>
          <Select value={novoEstado} onValueChange={(value) => setNovoEstado(value)}>
            <SelectTrigger>
              <SelectValue>{(v: string | null) => (v ? ESTADO_LABELS[v as EstadoCobranca] : 'Escolha um estado')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {opcoes.map((e) => (
                <SelectItem key={e} value={e}>
                  {ESTADO_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nota-transicao">
            Nota {notaObrigatoria ? '(obrigatória — indique o motivo)' : '(opcional)'}
          </Label>
          <Textarea id="nota-transicao" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>

        <DialogFooter>
          <Button onClick={confirmar} disabled={pending || !novoEstado || (notaObrigatoria && !nota.trim())}>
            {pending ? 'A atualizar...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
