'use client'

import { useState, useTransition } from 'react'
import { associarFracaoAdicional } from '@/app/actions/fracoes'
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
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string }

/** Achado F04 — associa uma SEGUNDA fração a uma conta já aprovada (ex.
 * senhorio com mais do que uma fração no mesmo condomínio), sem criar uma
 * conta nova nem sobrescrever a fração já associada. Distinto de
 * `EditarMembroDialog`, que troca a fração de UMA linha `membro`
 * existente. */
export function AssociarFracaoDialog({
  membroId,
  nome,
  fracoes,
}: {
  membroId: number
  nome: string
  fracoes: FracaoOpcao[]
}) {
  const [open, setOpen] = useState(false)
  const [fracaoId, setFracaoId] = useState<string>('')
  const [pending, startTransition] = useTransition()

  const onSubmit = () => {
    if (!fracaoId) {
      toast.error('Escolha uma fração')
      return
    }
    const formData = new FormData()
    formData.set('membroOrigemId', String(membroId))
    formData.set('fracaoId', fracaoId)
    startTransition(async () => {
      try {
        await associarFracaoAdicional(formData)
        toast.success('Fração associada')
        setOpen(false)
        setFracaoId('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao associar fração')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" aria-label={`Associar outra fração a ${nome}`} />}
      >
        <Building2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Associar outra fração</DialogTitle>
          <DialogDescription>
            {nome} passa a ter acesso também a esta fração, sem perder o
            acesso às restantes já associadas à conta (útil para um
            proprietário com mais do que uma fração no mesmo condomínio).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Select value={fracaoId} onValueChange={(value) => value && setFracaoId(value)}>
            <SelectTrigger>
              <SelectValue>
                {(v: string | null) => {
                  const f = fracoes.find((f) => String(f.id) === v)
                  return f ? f.identificacao : 'Escolher fração'
                }}
              </SelectValue>
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
        <DialogFooter>
          <Button onClick={onSubmit} disabled={pending}>
            {pending ? 'A associar...' : 'Associar fração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
