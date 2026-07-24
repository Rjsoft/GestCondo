'use client'

import { useState, useTransition } from 'react'
import { criarExercicio } from '@/app/actions/exercicios'
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
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function NovoExercicioDialog({
  trigger,
  onSucesso,
}: {
  trigger?: React.ReactElement
  onSucesso?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await criarExercicio(formData)
        toast.success('Exercício criado')
        setOpen(false)
        onSucesso?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao criar')
      }
    })
  }

  const anoAtual = new Date().getFullYear()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button size="sm" />}>
        {!trigger && (
          <>
            <Plus className="h-4 w-4" />
            Novo exercício
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar exercício financeiro</DialogTitle>
          <DialogDescription>
            Um exercício é o período (normalmente um ano civil) a que pertencem as contas do
            condomínio — é o que separa &quot;as contas de 2025&quot; das &quot;contas de
            2026&quot;. Cada movimento e cada saldo fica associado a um exercício.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="designacao">Designação</Label>
            <Input
              id="designacao"
              name="designacao"
              required
              placeholder={`Ex: ${anoAtual}`}
              defaultValue={String(anoAtual)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="anoPrincipal">Ano principal</Label>
            <Input
              id="anoPrincipal"
              name="anoPrincipal"
              type="number"
              required
              defaultValue={anoAtual}
            />
            <p className="text-xs text-muted-foreground">
              Usado para ordenar e agrupar relatórios — normalmente o ano onde o exercício
              começa.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataInicio">Início</Label>
              <Input
                id="dataInicio"
                name="dataInicio"
                type="date"
                required
                defaultValue={`${anoAtual}-01-01`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataFim">Fim</Label>
              <Input
                id="dataFim"
                name="dataFim"
                type="date"
                required
                defaultValue={`${anoAtual}-12-31`}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Não pode haver dois exercícios com datas sobrepostas para o mesmo condomínio.
          </p>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A criar...' : 'Criar exercício'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
