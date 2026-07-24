'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
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
import { MSG_EXERCICIO } from '@/lib/financas'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

type CampoExercicio = 'dataFim'

// Só a mensagem inequivocamente atribuível a um único campo entra aqui —
// sobreposição de exercícios e "preencha os campos obrigatórios" ficam
// como erro geral (toast), por envolverem mais do que um campo (ver
// docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md, L3).
const CAMPO_POR_ERRO: Readonly<Record<string, CampoExercicio>> = {
  [MSG_EXERCICIO.dataFimAntesDoInicio]: 'dataFim',
}

export function NovoExercicioDialog({
  trigger,
  onSucesso,
}: {
  trigger?: React.ReactElement
  onSucesso?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [erros, setErros] = useState<Partial<Record<CampoExercicio, string>>>({})
  const [pending, startTransition] = useTransition()

  const formId = useId()
  const dataFimErroId = `${formId}-data-fim-erro`
  const dataFimRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (erros.dataFim) dataFimRef.current?.focus()
  }, [erros])

  const onSubmit = (formData: FormData) => {
    setErros({})
    startTransition(async () => {
      try {
        await criarExercicio(formData)
        toast.success('Exercício criado')
        setOpen(false)
        onSucesso?.()
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : 'Erro ao criar'
        const campo = CAMPO_POR_ERRO[mensagem]
        if (campo) setErros({ [campo]: mensagem })
        else toast.error(mensagem)
      }
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(new FormData(event.currentTarget))
  }

  const anoAtual = new Date().getFullYear()

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setErros({})
      }}
    >
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                ref={dataFimRef}
                aria-invalid={Boolean(erros.dataFim)}
                aria-describedby={erros.dataFim ? dataFimErroId : undefined}
                onChange={() => erros.dataFim && setErros({})}
              />
            </div>
          </div>
          {erros.dataFim && (
            <p id={dataFimErroId} role="alert" className="text-sm text-destructive">
              {erros.dataFim}
            </p>
          )}
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
