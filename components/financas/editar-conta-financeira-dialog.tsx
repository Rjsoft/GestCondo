'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { atualizarContaFinanceira } from '@/app/actions/contas-financeiras'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MSG_CONTA, TIPO_CONTA_LABEL, TIPOS_CONTA } from '@/lib/financas'
import { toast } from 'sonner'

type CampoConta = 'nome' | 'tipo' | 'iban' | 'notaTransitoria'

// Ver nota em nova-conta-financeira-dialog.tsx — mesmo mapeamento
// localizado, mesma limitação residual registada em
// docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md (L3).
const CAMPO_POR_ERRO: Readonly<Record<string, CampoConta>> = {
  [MSG_CONTA.nomeObrigatorio]: 'nome',
  [MSG_CONTA.tipoInvalido]: 'tipo',
  [MSG_CONTA.caixaSemIban]: 'iban',
  [MSG_CONTA.notaTransitoriaObrigatoria]: 'notaTransitoria',
  [MSG_CONTA.ibanInvalido]: 'iban',
}

export function EditarContaFinanceiraDialog({
  open,
  onOpenChange,
  conta,
  onSucesso,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSucesso?: () => void
  conta: {
    id: number
    nome: string
    banco: string | null
    iban: string | null
    tipo: string
    moeda: string
    notaTransitoria: string | null
  }
}) {
  const [tipo, setTipo] = useState(conta.tipo)
  const [erros, setErros] = useState<Partial<Record<CampoConta, string>>>({})
  const [pending, startTransition] = useTransition()

  const formId = useId()
  const nomeErroId = `${formId}-nome-erro`
  const ibanErroId = `${formId}-iban-erro`
  const notaErroId = `${formId}-nota-erro`

  const nomeRef = useRef<HTMLInputElement>(null)
  const ibanRef = useRef<HTMLInputElement>(null)
  const notaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (erros.nome) nomeRef.current?.focus()
    else if (erros.iban) ibanRef.current?.focus()
    else if (erros.notaTransitoria) notaRef.current?.focus()
  }, [erros])

  const onSubmit = (formData: FormData) => {
    setErros({})
    formData.set('id', String(conta.id))
    formData.set('tipo', tipo)
    startTransition(async () => {
      try {
        await atualizarContaFinanceira(formData)
        toast.success('Conta atualizada')
        onOpenChange(false)
        onSucesso?.()
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : 'Erro ao atualizar'
        const campo = CAMPO_POR_ERRO[mensagem]
        if (campo) setErros({ [campo]: mensagem })
        else toast.error(mensagem)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conta</DialogTitle>
          <DialogDescription>Alterar os dados desta conta do condomínio.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome-editar">Nome da conta</Label>
            <Input
              id="nome-editar"
              name="nome"
              required
              defaultValue={conta.nome}
              ref={nomeRef}
              aria-invalid={Boolean(erros.nome)}
              aria-describedby={erros.nome ? nomeErroId : undefined}
              onChange={() => erros.nome && setErros((atuais) => ({ ...atuais, nome: undefined }))}
            />
            {erros.nome && (
              <p id={nomeErroId} role="alert" className="text-sm text-destructive">
                {erros.nome}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Tipo de conta</Label>
            <Select value={tipo} onValueChange={(v) => v && setTipo(v)}>
              <SelectTrigger>
                <SelectValue>{(v: string | null) => (v ? TIPO_CONTA_LABEL[v] : '')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIPOS_CONTA.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_CONTA_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erros.tipo && (
              <p role="alert" className="text-sm text-destructive">
                {erros.tipo}
              </p>
            )}
          </div>
          {tipo !== 'caixa' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="banco-editar">Banco (opcional)</Label>
                <Input id="banco-editar" name="banco" defaultValue={conta.banco ?? ''} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="iban-editar">IBAN (opcional)</Label>
                <Input
                  id="iban-editar"
                  name="iban"
                  defaultValue={conta.iban ?? ''}
                  ref={ibanRef}
                  aria-invalid={Boolean(erros.iban)}
                  aria-describedby={erros.iban ? ibanErroId : undefined}
                  onChange={() => erros.iban && setErros((atuais) => ({ ...atuais, iban: undefined }))}
                />
                {erros.iban && (
                  <p id={ibanErroId} role="alert" className="text-sm text-destructive">
                    {erros.iban}
                  </p>
                )}
              </div>
            </div>
          )}
          {tipo === 'transitoria' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="notaTransitoria-editar">Motivo desta conta temporária ou de transição</Label>
              <Input
                id="notaTransitoria-editar"
                name="notaTransitoria"
                required
                defaultValue={conta.notaTransitoria ?? ''}
                ref={notaRef}
                aria-invalid={Boolean(erros.notaTransitoria)}
                aria-describedby={erros.notaTransitoria ? notaErroId : undefined}
                onChange={() =>
                  erros.notaTransitoria && setErros((atuais) => ({ ...atuais, notaTransitoria: undefined }))
                }
              />
              {erros.notaTransitoria && (
                <p id={notaErroId} role="alert" className="text-sm text-destructive">
                  {erros.notaTransitoria}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="moeda-editar">Moeda</Label>
            <Input id="moeda-editar" name="moeda" defaultValue={conta.moeda} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
