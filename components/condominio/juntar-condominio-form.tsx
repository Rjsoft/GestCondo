'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { juntarOutroCondominio } from '@/app/actions/condominio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function JuntarCondominioForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await juntarOutroCondominio(formData)
        toast.success('Pedido enviado — aguarda aprovação do administrador desse condomínio')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao entrar no condomínio')
      }
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Se gere mais do que um condomínio com esta conta (ex: empresa
        gestora), introduza aqui o código de convite de outro condomínio.
        Fica &ldquo;pendente&rdquo; até o administrador desse condomínio
        aprovar, tal como qualquer registo novo.
      </p>
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="codigo-juntar">Código de convite</Label>
          <Input id="codigo-juntar" name="codigo" placeholder="Ex: AB3D9F2K" className="uppercase" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'A entrar...' : 'Juntar-me'}
        </Button>
      </div>
    </form>
  )
}
