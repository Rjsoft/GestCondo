'use client'

import { useState, useTransition } from 'react'
import { atualizarMembro } from '@/app/actions/fracoes'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string }
type FornecedorOpcao = { id: number; nome: string }

const SEM_FRACAO = '__sem_fracao__'
const SEM_FORNECEDOR = '__sem_fornecedor__'

export function EditarMembroDialog({
  id,
  nome,
  fracaoId,
  fornecedorId,
  telefone,
  fracoes,
  fornecedores,
}: {
  id: number
  nome: string
  fracaoId: number | null
  fornecedorId: number | null
  telefone: string | null
  fracoes: FracaoOpcao[]
  fornecedores: FornecedorOpcao[]
}) {
  const [open, setOpen] = useState(false)
  const [fracaoSelecionada, setFracaoSelecionada] = useState(
    fracaoId ? String(fracaoId) : SEM_FRACAO,
  )
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(
    fornecedorId ? String(fornecedorId) : SEM_FORNECEDOR,
  )
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    formData.set(
      'fracaoId',
      fracaoSelecionada === SEM_FRACAO ? '' : fracaoSelecionada,
    )
    formData.set(
      'fornecedorId',
      fornecedorSelecionado === SEM_FORNECEDOR ? '' : fornecedorSelecionado,
    )
    startTransition(async () => {
      try {
        await atualizarMembro(formData)
        toast.success('Condómino atualizado')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao atualizar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon" aria-label="Editar condómino" />}
      >
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar condómino</DialogTitle>
          <DialogDescription>
            Atualize os dados de contacto e associe a fração de que é
            proprietário ou arrendatário (o perfil &ldquo;Condómino&rdquo;
            ou &ldquo;Inquilino&rdquo; define qual dos dois).
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" defaultValue={id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={nome} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Fração</Label>
              <Select
                value={fracaoSelecionada}
                onValueChange={(value) => value && setFracaoSelecionada(value)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(v: string | null) => {
                      if (v === SEM_FRACAO || v == null) return 'Sem fração associada'
                      const f = fracoes.find((f) => String(f.id) === v)
                      return f ? f.identificacao : 'Sem fração associada'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_FRACAO}>Sem fração associada</SelectItem>
                  {fracoes.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.identificacao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                defaultValue={telefone ?? ''}
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Fornecedor associado (só para perfil &ldquo;Fornecedor&rdquo;)</Label>
            <Select
              value={fornecedorSelecionado}
              onValueChange={(value) => value && setFornecedorSelecionado(value)}
            >
              <SelectTrigger>
                <SelectValue>
                  {(v: string | null) => {
                    if (v === SEM_FORNECEDOR || v == null) return 'Sem fornecedor associado'
                    const f = fornecedores.find((f) => String(f.id) === v)
                    return f ? f.nome : 'Sem fornecedor associado'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_FORNECEDOR}>Sem fornecedor associado</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Liga este login à ficha de fornecedor em &ldquo;Fornecedores&rdquo;,
              para o portal do fornecedor mostrar as ocorrências e orçamentos
              atribuídos a ele.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar...' : 'Guardar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
