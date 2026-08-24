'use client'

import { useEffect, useState, useTransition } from 'react'
import { adicionarTitular, getTitularesFracao, removerTitular } from '@/app/actions/fracoes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIPOS_TITULAR, TIPO_TITULAR_LABEL, type TipoTitular } from '@/lib/fracoes'
import { X } from 'lucide-react'
import { toast } from 'sonner'

type Titular = {
  id: number
  nome: string
  nif: string | null
  tipoTitular: string
  contactoEmail: string | null
  contactoTelefone: string | null
}

/**
 * Titulares adicionais de uma fração (heranças indivisas, vários donos) —
 * complementa `fracao.proprietario` (o nome principal, editado em "Editar
 * fração"), sem o substituir. Aberto a partir do menu "..." da listagem.
 *
 * É também o único sítio onde se guardam contactos de quem **não tem conta
 * na aplicação** (`FUNCTIONAL_GAPS.md` secção 11): `membro` exige sempre uma
 * conta de utilizador, pelo que um proprietário que nunca se registe não
 * existiria em lado nenhum. As colunas `contactoEmail`/`contactoTelefone`
 * existem em `fracao_titular` desde a migração 0060, mas até 2026-08-24 não
 * havia forma de as preencher pela interface.
 *
 * **Guardar não é comunicar**: nada nesta aplicação envia emails para estes
 * contactos. Avisos e convocatórias continuam a sair só para membros com
 * conta aprovada — passar a escrever-lhes exige antes atualizar `RAT.md`, a
 * política de privacidade e o DPA (o RAT limita hoje os titulares dos dados
 * a quem tem conta) e prever uma via de oposição.
 */
export function GerirTitularesDialog({
  fracaoId,
  identificacao,
  open,
  onOpenChange,
}: {
  fracaoId: number
  identificacao: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [lista, setLista] = useState<Titular[] | null>(null)
  const [nome, setNome] = useState('')
  const [nif, setNif] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [contactoTelefone, setContactoTelefone] = useState('')
  const [tipoTitular, setTipoTitular] = useState<string | null>('proprietario')
  const [pending, startTransition] = useTransition()

  const carregar = () => {
    startTransition(async () => {
      setLista(await getTitularesFracao(fracaoId))
    })
  }

  // `open` é controlado pelo componente pai (menu "..." da listagem), pelo
  // que o `onOpenChange` do Dialog nunca dispara ao abrir — só reage a
  // eventos internos (Esc, clicar fora). É este efeito que carrega a lista
  // na primeira abertura.
  useEffect(() => {
    if (open && lista === null) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const adicionar = () => {
    if (!nome.trim()) return
    startTransition(async () => {
      try {
        await adicionarTitular(fracaoId, {
          nome,
          nif: nif || undefined,
          tipoTitular: tipoTitular ?? undefined,
          contactoEmail: contactoEmail || undefined,
          contactoTelefone: contactoTelefone || undefined,
        })
        toast.success('Titular adicionado')
        setNome('')
        setNif('')
        setContactoEmail('')
        setContactoTelefone('')
        carregar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao adicionar titular')
      }
    })
  }

  const remover = (id: number) => {
    startTransition(async () => {
      try {
        await removerTitular(id)
        toast.success('Titular removido')
        carregar()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao remover titular')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Titulares — fração {identificacao}</DialogTitle>
          <DialogDescription>
            Para heranças indivisas ou frações com vários donos: identifique cada titular
            individualmente (nome e NIF), para aparecerem discriminados na declaração de
            dívida e na interpelação. É também aqui que guarda o email e o telefone de quem
            não tem conta na aplicação. Não substitui o nome principal mostrado na listagem
            de frações — esse continua a editar-se em &ldquo;Editar fração&rdquo;.
          </DialogDescription>
        </DialogHeader>

        {lista === null ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : (
          <>
            {lista.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ainda não há titulares adicionais registados.
              </p>
            )}
            {lista.length > 0 && (
              <ul className="flex flex-col gap-2">
                {lista.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <div>
                      <span className="font-medium text-foreground">{t.nome}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {TIPO_TITULAR_LABEL[t.tipoTitular as TipoTitular] ?? t.tipoTitular}
                        {t.nif ? ` · NIF ${t.nif}` : ''}
                      </span>
                      {(t.contactoEmail || t.contactoTelefone) && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {[t.contactoEmail, t.contactoTelefone].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => remover(t.id)}
                      aria-label={`Remover ${t.nome}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <Label htmlFor="titular-nome">Nome</Label>
              <Input
                id="titular-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria Silva"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="titular-nif">NIF (opcional)</Label>
                  <Input id="titular-nif" value={nif} onChange={(e) => setNif(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label>Qualidade</Label>
                  <Select value={tipoTitular} onValueChange={(value) => setTipoTitular(value)}>
                    <SelectTrigger>
                      <SelectValue>
                        {(v: string | null) => (v ? TIPO_TITULAR_LABEL[v as TipoTitular] : '')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_TITULAR.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_TITULAR_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="titular-email">Email (opcional)</Label>
                  <Input
                    id="titular-email"
                    type="email"
                    value={contactoEmail}
                    onChange={(e) => setContactoEmail(e.target.value)}
                    placeholder="Ex: maria.silva@exemplo.pt"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="titular-telefone">Telefone (opcional)</Label>
                  <Input
                    id="titular-telefone"
                    type="tel"
                    value={contactoTelefone}
                    onChange={(e) => setContactoTelefone(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Os contactos servem para o administrador ter onde os consultar, sobretudo
                quando o titular não tem conta na aplicação. A aplicação não lhes envia
                emails — avisos e convocatórias continuam a sair apenas para quem tem conta
                aprovada.
              </p>
              <Button type="button" onClick={adicionar} disabled={pending || !nome.trim()} className="self-start">
                Adicionar titular
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
