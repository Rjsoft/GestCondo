'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDataHora } from '@/lib/format'
import { Send } from 'lucide-react'
import { toast } from 'sonner'

type MensagemItem = {
  id: number
  autorNome: string
  autorEhGestao: boolean
  conteudo: string
  createdAt: Date
}

export function Conversa({
  mensagens,
  souGestao,
  onEnviar,
}: {
  mensagens: MensagemItem[]
  /** Se true, as mensagens da administração (autorEhGestao) são "minhas"
   * (alinhadas à direita); senão são as do lado não-gestão. */
  souGestao: boolean
  onEnviar: (conteudo: string) => Promise<void>
}) {
  const [conteudo, setConteudo] = useState('')
  const [pending, startTransition] = useTransition()

  const enviar = () => {
    const texto = conteudo.trim()
    if (!texto) return
    startTransition(async () => {
      try {
        await onEnviar(texto)
        setConteudo('')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao enviar mensagem')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-5">
          {mensagens.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ainda não há mensagens. Escreva a primeira abaixo.
            </p>
          ) : (
            mensagens.map((msg) => {
              const minha = msg.autorEhGestao === souGestao
              return (
                <div
                  key={msg.id}
                  className={cn('flex flex-col', minha ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm text-pretty',
                      minha
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    {msg.conteudo}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {msg.autorNome} · {formatDataHora(msg.createdAt)}
                  </p>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-2">
        <Textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Escreva uma mensagem..."
          rows={3}
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button onClick={enviar} disabled={pending || !conteudo.trim()}>
            <Send className="h-4 w-4" />
            {pending ? 'A enviar...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
