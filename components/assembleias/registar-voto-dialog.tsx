'use client'

import { useState, useTransition } from 'react'
import { registarVoto } from '@/app/actions/assembleias'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Vote } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string }

export function RegistarVotoDialog({
  pontoId,
  titulo,
  fracoes,
}: {
  pontoId: number
  titulo: string
  fracoes: FracaoOpcao[]
}) {
  const [open, setOpen] = useState(false)
  const [fracaoId, setFracaoId] = useState('')
  const [voto, setVoto] = useState('favor')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('fracaoId', fracaoId)
    formData.set('voto', voto)
    startTransition(async () => {
      try {
        await registarVoto(pontoId, formData)
        toast.success('Voto registado')
        setOpen(false)
        setFracaoId('')
        setVoto('favor')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Vote className="h-4 w-4" />
        Registar voto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar voto</DialogTitle>
          <DialogDescription>
            Ponto: {titulo}. Repita para cada fração presente/representada.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Select value={fracaoId} onValueChange={(value) => value && setFracaoId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fração" />
              </SelectTrigger>
              <SelectContent>
                {fracoes.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.identificacao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Select value={voto} onValueChange={(value) => value && setVoto(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="favor">A favor</SelectItem>
                <SelectItem value="contra">Contra</SelectItem>
                <SelectItem value="abstencao">Abstenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || !fracaoId}>
              {pending ? 'A registar...' : 'Registar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
