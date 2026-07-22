'use client'

import { useTransition } from 'react'
import { atualizarCondominio } from '@/app/actions/condominio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function EditarCondominioForm({
  nome,
  morada,
  nif,
}: {
  nome: string
  morada: string | null
  nif: string | null
}) {
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await atualizarCondominio(formData)
        toast.success('Dados do condomínio atualizados')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao guardar')
      }
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome do condomínio</Label>
        <Input id="nome" name="nome" defaultValue={nome} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="morada">Morada</Label>
        <Input id="morada" name="morada" defaultValue={morada ?? ''} placeholder="Opcional" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nif">NIF do condomínio</Label>
        <Input id="nif" name="nif" defaultValue={nif ?? ''} placeholder="Opcional — aparece nos recibos" />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'A guardar...' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  )
}
