'use client'

import { useState, useTransition } from 'react'
import { criarPatrimonio, eliminarPatrimonio } from '@/app/actions/patrimonio'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { formatEuro, formatData } from '@/lib/format'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type Bem = {
  id: number
  nome: string
  categoria: string | null
  dataAquisicao: Date | null
  valorAquisicao: string | null
  valorAtual: string | null
  notas: string | null
}

export function PatrimonioCard({ bens }: { bens: Bem[] }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-sm font-bold text-foreground">Património do condomínio</h2>
          <NovoPatrimonioDialog />
        </div>
        {bens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não existem bens registados.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {bens.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{b.nome}</p>
                    {b.categoria && <Badge variant="outline">{b.categoria}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.dataAquisicao && `Adquirido em ${formatData(b.dataAquisicao)}`}
                    {b.dataAquisicao && (b.valorAquisicao || b.valorAtual) ? ' · ' : ''}
                    {b.valorAquisicao && `Valor de aquisição: ${formatEuro(b.valorAquisicao)}`}
                    {b.valorAquisicao && b.valorAtual ? ' · ' : ''}
                    {b.valorAtual && `Valor atual: ${formatEuro(b.valorAtual)}`}
                  </p>
                  {b.notas && <p className="mt-1 text-xs text-muted-foreground">{b.notas}</p>}
                </div>
                <EliminarPatrimonioButton id={b.id} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NovoPatrimonioDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await criarPatrimonio(formData)
        toast.success('Bem adicionado')
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
        Adicionar bem
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar bem ao património</DialogTitle>
          <DialogDescription>
            Ex: mobiliário, equipamento ou sistema de segurança do condomínio.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required placeholder="Ex: Portão automático" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" name="categoria" placeholder="Ex: Segurança" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dataAquisicao">Data de aquisição</Label>
            <Input id="dataAquisicao" name="dataAquisicao" type="date" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valorAquisicao">Valor de aquisição (€)</Label>
              <Input
                id="valorAquisicao"
                name="valorAquisicao"
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="valorAtual">Valor atual (€)</Label>
              <Input
                id="valorAtual"
                name="valorAtual"
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" name="notas" rows={2} placeholder="Opcional" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar bem'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EliminarPatrimonioButton({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    startTransition(async () => {
      try {
        await eliminarPatrimonio(id)
        toast.success('Bem eliminado')
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
      aria-label="Eliminar bem"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
