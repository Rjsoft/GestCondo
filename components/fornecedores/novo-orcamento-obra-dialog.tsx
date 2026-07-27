'use client'

import { useState, useTransition } from 'react'
import { criarOrcamentoObra } from '@/app/actions/orcamentos-obra'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

type FornecedorOpcao = { id: number; nome: string }
type OcorrenciaOpcao = { id: number; titulo: string }

const SEM_OCORRENCIA = '__sem_ocorrencia__'

export function NovoOrcamentoObraDialog({
  fornecedores,
  ocorrencias,
  perfilFornecedor = false,
}: {
  fornecedores: FornecedorOpcao[]
  ocorrencias: OcorrenciaOpcao[]
  /** Chamado por um fornecedor (portal do fornecedor) a submeter em seu
   * próprio nome — esconde a escolha de fornecedor (é sempre ele próprio,
   * decidido no servidor a partir da sessão). */
  perfilFornecedor?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [fornecedorId, setFornecedorId] = useState('')
  const [ocorrenciaId, setOcorrenciaId] = useState(SEM_OCORRENCIA)
  const [pending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    if (!perfilFornecedor) formData.set('fornecedorId', fornecedorId)
    if (ocorrenciaId !== SEM_OCORRENCIA) {
      formData.set('ocorrenciaId', ocorrenciaId)
    }
    startTransition(async () => {
      try {
        await criarOrcamentoObra(formData)
        toast.success('Orçamento registado')
        setOpen(false)
        setFornecedorId('')
        setOcorrenciaId(SEM_OCORRENCIA)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao registar')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Novo orçamento de obra
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo orçamento de obra</DialogTitle>
          <DialogDescription>
            Registe a proposta de um fornecedor para uma obra ou intervenção,
            para poder comparar com outras propostas antes de decidir.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              name="assunto"
              required
              placeholder="Ex: Pintura da fachada, Substituição do motor do elevador"
            />
          </div>

          <div className={perfilFornecedor ? '' : 'grid grid-cols-2 gap-3'}>
            {!perfilFornecedor && (
              <div className="flex flex-col gap-2">
                <Label>Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={(v) => v && setFornecedorId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor">
                      {(v: string | null) => {
                        const f = fornecedores.find((f) => String(f.id) === v)
                        return f ? f.nome : 'Selecione o fornecedor'
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fornecedores.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Ainda não existem fornecedores registados — registe um
                    antes de lançar um orçamento.
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor">Valor (€)</Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Ocorrência associada (opcional)</Label>
            <Select value={ocorrenciaId} onValueChange={(v) => v && setOcorrenciaId(v)}>
              <SelectTrigger>
                <SelectValue>
                  {(v: string | null) => {
                    if (v === SEM_OCORRENCIA || v == null) return 'Sem ocorrência associada'
                    const o = ocorrencias.find((o) => String(o.id) === v)
                    return o ? o.titulo : 'Sem ocorrência associada'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_OCORRENCIA}>Sem ocorrência associada</SelectItem>
                {ocorrencias.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea id="descricao" name="descricao" rows={2} placeholder="Detalhes do orçamento" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="anexo">Anexo (PDF ou imagem, opcional, até 15MB)</Label>
            <Input id="anexo" name="anexo" type="file" accept="application/pdf,image/*" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || (!perfilFornecedor && !fornecedorId)}>
              {pending ? 'A guardar...' : 'Guardar orçamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
