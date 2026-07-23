'use client'

import { useState, useTransition } from 'react'
import { adicionarPonto } from '@/app/actions/assembleias'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NovoPontoDialog({ assembleiaId }: { assembleiaId: number }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await adicionarPonto(assembleiaId, formData)
        toast.success('Ponto adicionado à ordem de trabalhos')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao adicionar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="h-4 w-4" />
        Adicionar ponto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo ponto da ordem de trabalhos</DialogTitle>
          <DialogDescription>
            Fica no fim da lista atual, pela ordem em que é adicionado.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              placeholder="Ex: Aprovação do orçamento para 2026"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea id="descricao" name="descricao" rows={3} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox name="exigeUnanimidade" />
              Este assunto só pode ser aprovado por unanimidade
            </label>
            <p className="text-xs text-muted-foreground">
              A lei obriga a convocatória a identificar estes assuntos
              (art. 1432.º, n.º 4 do Código Civil) — ficam assinalados na
              minuta da convocatória.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A adicionar...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
