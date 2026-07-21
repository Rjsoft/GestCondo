'use client'

import { useState, useTransition } from 'react'
import { registarPresenca } from '@/app/actions/assembleias'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserCheck } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string; temPresenca: boolean }

export function RegistarPresencaDialog({
  assembleiaId,
  fracoes,
}: {
  assembleiaId: number
  fracoes: FracaoOpcao[]
}) {
  const [open, setOpen] = useState(false)
  const [fracaoId, setFracaoId] = useState('')
  const [tipo, setTipo] = useState('presencial')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('fracaoId', fracaoId)
    formData.set('tipo', tipo)
    startTransition(async () => {
      try {
        await registarPresenca(assembleiaId, formData)
        toast.success('Presença registada')
        setOpen(false)
        setFracaoId('')
        setTipo('presencial')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserCheck className="h-4 w-4" />
        Registar presença
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar presença</DialogTitle>
          <DialogDescription>
            Regista a fração como presente ou representada por procuração.
            Repita para cada fração presente na assembleia.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Fração</Label>
            <Select value={fracaoId} onValueChange={(value) => value && setFracaoId(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a fração" />
              </SelectTrigger>
              <SelectContent>
                {fracoes.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.identificacao}
                    {f.temPresenca ? ' (já registada)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(value) => value && setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="procuracao">Procuração</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="representante">Representante (opcional)</Label>
            <Input
              id="representante"
              name="representante"
              placeholder="Nome de quem está fisicamente presente"
            />
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
