'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { criarContaFinanceira } from '@/app/actions/contas-financeiras'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MSG_CONTA, TIPO_CONTA_LABEL, TIPOS_CONTA } from '@/lib/financas'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { toast } from 'sonner'

type CampoConta = 'nome' | 'tipo' | 'iban' | 'notaTransitoria'

// Mapeamento localizado a este diálogo — solução intermédia adequada à
// correção pontual da Fase A.1 (ver docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md,
// L3). Depende das mensagens partilhadas de lib/financas.ts; uma futura
// refatoração transversal poderá substituir exceções textuais por
// resultados estruturados e tipados em todas as server actions da app.
const CAMPO_POR_ERRO: Readonly<Record<string, CampoConta>> = {
  [MSG_CONTA.nomeObrigatorio]: 'nome',
  [MSG_CONTA.tipoInvalido]: 'tipo',
  [MSG_CONTA.caixaSemIban]: 'iban',
  [MSG_CONTA.notaTransitoriaObrigatoria]: 'notaTransitoria',
  [MSG_CONTA.ibanInvalido]: 'iban',
}

export function NovaContaFinanceiraDialog({
  exercicioAtivo,
  trigger,
  onCriada,
}: {
  exercicioAtivo: { id: number; designacao: string } | null
  /** Botão próprio por omissão — passar um trigger diferente quando usado dentro do assistente. */
  trigger?: React.ReactElement
  onCriada?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('ordem')
  const [avancadas, setAvancadas] = useState(false)
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
    formData.set('tipo', tipo)
    if (exercicioAtivo) formData.set('exercicioId', String(exercicioAtivo.id))
    startTransition(async () => {
      try {
        await criarContaFinanceira(formData)
        toast.success('Conta registada')
        setOpen(false)
        onCriada?.()
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : 'Erro ao registar'
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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        // Reinicia sempre que o diálogo abre — cobre tanto o primeiro uso
        // como reabrir depois de um cancelamento ou de um erro anterior.
        // Nunca corre no caminho de erro em si (esse mantém os valores).
        if (v) {
          setErros({})
          setTipo('ordem')
          setAvancadas(false)
        }
      }}
    >
      <DialogTrigger render={trigger ?? <Button variant="outline" size="sm" />}>
        {!trigger && (
          <>
            <Plus className="h-4 w-4" />
            Nova conta
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar conta do condomínio</DialogTitle>
          <DialogDescription>
            Uma conta bancária, a prazo ou de caixa que pertence ao condomínio — não uma conta
            pessoal de quem administra.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome da conta</Label>
            <Input
              id="nome"
              name="nome"
              required
              placeholder="Ex: Conta à Ordem BCP"
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
            {tipo === 'caixa' && (
              <p className="text-xs text-muted-foreground">
                Dinheiro existente fora das contas bancárias — não precisa de banco nem de IBAN.
              </p>
            )}
            {tipo === 'transitoria' && (
              <p className="text-xs text-muted-foreground">
                Situação excecional — para uma conta antiga ou temporária a regularizar, não para
                uso normal.
              </p>
            )}
          </div>

          {tipo !== 'caixa' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="banco">Banco (opcional)</Label>
                <Input id="banco" name="banco" placeholder="Ex: BCP" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="iban">IBAN (opcional)</Label>
                <Input
                  id="iban"
                  name="iban"
                  placeholder="PT50..."
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
              <Label htmlFor="notaTransitoria">Motivo desta conta temporária ou de transição</Label>
              <Input
                id="notaTransitoria"
                name="notaTransitoria"
                required
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

          {exercicioAtivo && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="saldoInicial">Saldo inicial (opcional)</Label>
                <Input id="saldoInicial" name="saldoInicial" type="number" step="0.01" placeholder="0,00" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>No exercício</Label>
                <Input disabled value={exercicioAtivo.designacao} />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAvancadas((v) => !v)}
            className="flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            {avancadas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Opções avançadas
          </button>
          {avancadas && (
            <div className="grid grid-cols-1 gap-3 rounded-md border border-border p-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="moeda">Moeda</Label>
                <Input id="moeda" name="moeda" defaultValue="EUR" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dataAbertura">Data de abertura</Label>
                <Input id="dataAbertura" name="dataAbertura" type="date" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
