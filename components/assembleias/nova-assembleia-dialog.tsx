'use client'

import { useState, useTransition } from 'react'
import { criarAssembleia } from '@/app/actions/assembleias'
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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

const TIPO_ASSEMBLEIA_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

// Formata uma Date para o valor aceite por <input type="datetime-local">
// (hora local, sem segundos).
function paraDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function NovaAssembleiaDialog() {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('ordinaria')
  const [primeira, setPrimeira] = useState('')
  const [segunda, setSegunda] = useState('')
  // Deixa de sugerir automaticamente assim que o utilizador mexer na 2ª.
  const [segundaEditada, setSegundaEditada] = useState(false)
  const [pending, startTransition] = useTransition()

  const onPrimeiraChange = (value: string) => {
    setPrimeira(value)
    // Sugestão: 2ª convocatória 30 min depois da 1ª (mínimo legal,
    // art. 1432.º/7 CC) — o caso mais comum na prática.
    if (!segundaEditada && value) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        d.setMinutes(d.getMinutes() + 30)
        setSegunda(paraDatetimeLocal(d))
      }
    }
  }

  const limpar = () => {
    setTipo('ordinaria')
    setPrimeira('')
    setSegunda('')
    setSegundaEditada(false)
  }

  const onSubmit = (formData: FormData) => {
    formData.set('tipo', tipo)
    startTransition(async () => {
      try {
        await criarAssembleia(formData)
        toast.success('Assembleia convocada — email enviado aos condóminos')
        setOpen(false)
        limpar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao convocar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Convocar assembleia
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convocar assembleia</DialogTitle>
          <DialogDescription>
            Todos os condóminos aprovados recebem um email com a data, hora
            e local. A ordem de trabalhos adiciona-se depois, na página da
            assembleia.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(value) => value && setTipo(value)}>
              <SelectTrigger>
                <SelectValue>{(v: string | null) => (v ? TIPO_ASSEMBLEIA_LABEL[v] : '')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinaria">Ordinária</SelectItem>
                <SelectItem value="extraordinaria">Extraordinária</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              name="local"
              required
              placeholder="Ex: Hall de entrada, Sala de condomínio"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dataPrimeiraConvocatoria">1ª convocatória (data e hora)</Label>
            <Input
              id="dataPrimeiraConvocatoria"
              name="dataPrimeiraConvocatoria"
              type="datetime-local"
              required
              value={primeira}
              min={paraDatetimeLocal(new Date())}
              onChange={(e) => onPrimeiraChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A lei exige que a convocatória seja expedida com, pelo menos, 10
              dias de antecedência.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dataSegundaConvocatoria">2ª convocatória (opcional)</Label>
            <Input
              id="dataSegundaConvocatoria"
              name="dataSegundaConvocatoria"
              type="datetime-local"
              value={segunda}
              min={primeira || undefined}
              onChange={(e) => {
                setSegunda(e.target.value)
                setSegundaEditada(true)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Sugerida automaticamente para 30 minutos depois da 1ª (o mínimo
              legal — pode ser no mesmo dia). Ajuste se quiser outra data.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A convocar...' : 'Convocar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
