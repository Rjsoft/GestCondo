'use client'

import { useState, useTransition } from 'react'
import { promoverOperadorPlataforma } from '@/app/actions/plataforma'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export function AdicionarOperadorDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    const email = String(formData.get('email') || '')
    startTransition(async () => {
      try {
        await promoverOperadorPlataforma(email)
        toast.success(`${email} passou a ter acesso à plataforma`)
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao adicionar operador')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus className="h-4 w-4" />
        Adicionar operador
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar operador da plataforma</DialogTitle>
          <DialogDescription>
            A conta tem de já existir na aplicação (a pessoa cria a sua própria conta primeiro).
            Passa a ter acesso a suspender/reativar qualquer condomínio — só é possível adicionar
            por aqui, nunca remover; para remover, contacta quem tem acesso à base de dados.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="operador-email">Email da conta</Label>
            <Input id="operador-email" name="email" type="email" required autoFocus />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A adicionar...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
