'use client'

import { useState, useTransition } from 'react'
import { registarEnvioComunicacao } from '@/app/actions/assembleias'
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
import { Send } from 'lucide-react'
import { toast } from 'sonner'

const METODO_LABEL: Record<string, string> = {
  email: 'Email',
  carta: 'Carta registada',
}

export function RegistarEnvioComunicacaoDialog({
  pontoId,
  fracaoId,
  identificacao,
  jaEnviado,
}: {
  pontoId: number
  fracaoId: number
  identificacao: string
  jaEnviado: boolean
}) {
  const [open, setOpen] = useState(false)
  const [metodo, setMetodo] = useState('email')
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set('metodo', metodo)
    startTransition(async () => {
      try {
        await registarEnvioComunicacao(pontoId, fracaoId, formData)
        toast.success('Envio registado')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Send className="h-4 w-4" />
        {jaEnviado ? 'Corrigir envio' : 'Registar envio'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registar envio da comunicação</DialogTitle>
          <DialogDescription>
            Fração {identificacao} — método e data de envio da comunicação da
            deliberação, para efeitos do prazo de resposta de 90 dias.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Método</Label>
            <Select value={metodo} onValueChange={(value) => value && setMetodo(value)}>
              <SelectTrigger>
                <SelectValue>{(v: string | null) => (v ? METODO_LABEL[v] : '')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="carta">Carta registada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dataEnvio">Data de envio</Label>
            <Input id="dataEnvio" name="dataEnvio" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="referenciaEnvio">Referência (opcional)</Label>
            <Input
              id="referenciaEnvio"
              name="referenciaEnvio"
              placeholder="Nº de registo dos CTT, se aplicável"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A registar...' : 'Registar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
