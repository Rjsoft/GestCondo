'use client'

import { useState, useTransition } from 'react'
import {
  criarContactoEmergencia,
  eliminarContactoEmergencia,
} from '@/app/actions/contactos-emergencia'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Phone, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type Contacto = {
  id: number
  nome: string
  telefone: string
  descricao: string | null
}

export function ContactosEmergenciaCard({
  contactos,
  isAdmin,
}: {
  contactos: Contacto[]
  isAdmin: boolean
}) {
  if (contactos.length === 0 && !isAdmin) return null

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Phone className="h-4 w-4 text-primary" />
          Contactos de emergência
        </CardTitle>
        {isAdmin && <NovoContactoDialog />}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {contactos.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não existem contactos registados.</p>
        )}
        {contactos.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{c.nome}</p>
              <a href={`tel:${c.telefone}`} className="text-sm text-primary hover:underline">
                {c.telefone}
              </a>
              {c.descricao && (
                <p className="mt-0.5 text-xs text-muted-foreground">{c.descricao}</p>
              )}
            </div>
            {isAdmin && <EliminarContactoButton id={c.id} />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function NovoContactoDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await criarContactoEmergencia(formData)
        toast.success('Contacto adicionado')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao adicionar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="h-4 w-4" />
        Adicionar contacto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar contacto de emergência</DialogTitle>
          <DialogDescription>
            Ex: porteiro, manutenção de elevadores, eletricista ou canalizador de urgência.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required placeholder="Ex: Manutenção de elevadores" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" name="telefone" required placeholder="Ex: 210 000 000" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" placeholder="Opcional" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar contacto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EliminarContactoButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    startTransition(async () => {
      try {
        await eliminarContactoEmergencia(id)
        toast.success('Contacto eliminado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      onClick={onClick}
      className="shrink-0 text-muted-foreground hover:text-destructive"
      aria-label="Eliminar contacto"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
