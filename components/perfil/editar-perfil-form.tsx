'use client'

import { useTransition } from 'react'
import { atualizarMeuPerfil } from '@/app/actions/perfil'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function EditarPerfilForm({ nome, telefone }: { nome: string; telefone: string | null }) {
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await atualizarMeuPerfil(formData)
        toast.success('Dados atualizados')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao guardar')
      }
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" defaultValue={nome} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" defaultValue={telefone ?? ''} placeholder="Opcional" />
        </div>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'A guardar...' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  )
}
