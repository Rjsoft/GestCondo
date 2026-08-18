'use client'

import { useState, useTransition } from 'react'
import { criarPlanoReposicao } from '@/app/actions/fundo-reserva'
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
import { PiggyBank } from 'lucide-react'
import { toast } from 'sonner'

type PontoAssembleiaOpcao = { id: number; titulo: string; assembleiaData: string }

const SEM_DELIBERACAO = '__sem_deliberacao__'

export function CriarPlanoReposicaoDialog({
  pontosAssembleia,
  onSucesso,
}: {
  pontosAssembleia: PontoAssembleiaOpcao[]
  onSucesso: () => void
}) {
  const [open, setOpen] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [valorAReposicao, setValorAReposicao] = useState('')
  const [dataLimite, setDataLimite] = useState('')
  const [assembleiaPontoId, setAssembleiaPontoId] = useState(SEM_DELIBERACAO)
  const [notas, setNotas] = useState('')
  const [pending, startTransition] = useTransition()

  const confirmar = () => {
    startTransition(async () => {
      try {
        await criarPlanoReposicao({
          descricao,
          valorAReposicao: Number(valorAReposicao),
          dataLimite: dataLimite ? new Date(dataLimite) : undefined,
          assembleiaPontoId:
            assembleiaPontoId !== SEM_DELIBERACAO ? Number(assembleiaPontoId) : undefined,
          notas: notas || undefined,
        })
        toast.success('Plano de reposição criado')
        setOpen(false)
        setDescricao('')
        setValorAReposicao('')
        setDataLimite('')
        setAssembleiaPontoId(SEM_DELIBERACAO)
        setNotas('')
        onSucesso()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao criar o plano')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PiggyBank className="h-4 w-4" />
        Criar plano de reposição
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar plano de reposição</DialogTitle>
          <DialogDescription>
            Acompanhamento do compromisso de repor o fundo de reserva depois de uma retirada —
            não altera nenhum movimento. O valor reposto é sempre calculado a partir das receitas
            reais lançadas no fundo de reserva a partir de hoje.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="plano-descricao">Descrição</Label>
            <Input
              id="plano-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Reposição após obra de pintura da fachada"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="plano-valor">Valor a repor (€)</Label>
              <Input
                id="plano-valor"
                type="number"
                step="0.01"
                min="0"
                value={valorAReposicao}
                onChange={(e) => setValorAReposicao(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label htmlFor="plano-prazo">Prazo (opcional)</Label>
              <Input
                id="plano-prazo"
                type="date"
                value={dataLimite}
                onChange={(e) => setDataLimite(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="plano-deliberacao">Deliberação de assembleia (opcional)</Label>
            <Select value={assembleiaPontoId} onValueChange={(v) => v && setAssembleiaPontoId(v)}>
              <SelectTrigger id="plano-deliberacao">
                <SelectValue>
                  {(v: string | null) => {
                    if (v === SEM_DELIBERACAO || v == null) return 'Sem ligação'
                    const p = pontosAssembleia.find((p) => String(p.id) === v)
                    return p ? p.titulo : 'Sem ligação'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_DELIBERACAO}>Sem ligação</SelectItem>
                {pontosAssembleia.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="plano-notas">Notas (opcional)</Label>
            <Textarea
              id="plano-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={confirmar}
            disabled={pending || !descricao.trim() || !(Number(valorAReposicao) > 0)}
          >
            {pending ? 'A gravar...' : 'Criar plano'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
