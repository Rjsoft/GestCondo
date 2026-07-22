'use client'

import { useState, useTransition } from 'react'
import { regenerarCodigoConvite } from '@/app/actions/condominio'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function CodigoConviteCard({ codigoConvite }: { codigoConvite: string | null }) {
  const [codigo, setCodigo] = useState(codigoConvite)
  const [copiado, setCopiado] = useState(false)
  const [pending, startTransition] = useTransition()

  const regenerar = () => {
    startTransition(async () => {
      try {
        const novo = await regenerarCodigoConvite()
        setCodigo(novo)
        toast.success('Novo código de convite gerado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao gerar código')
      }
    })
  }

  const copiar = async () => {
    if (!codigo) return
    await navigator.clipboard.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Partilhe este código com quem quiser juntar-se a este condomínio. Continuam como
        &ldquo;pendente&rdquo; até aprovar, tal como qualquer registo novo — o código só decide a
        que condomínio se juntam.
      </p>
      {codigo ? (
        <div className="flex items-center gap-2">
          <code className="rounded-md bg-muted px-3 py-2 font-mono text-lg font-bold tracking-wider text-foreground">
            {codigo}
          </code>
          <Button variant="outline" size="icon" onClick={copiar} aria-label="Copiar código">
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ainda não foi gerado nenhum código.</p>
      )}
      <div>
        <Button variant="outline" onClick={regenerar} disabled={pending}>
          <RefreshCw className="h-4 w-4" />
          {pending ? 'A gerar...' : codigo ? 'Gerar novo código' : 'Gerar código de convite'}
        </Button>
      </div>
    </div>
  )
}
