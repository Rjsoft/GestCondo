'use client'

import { useState, useTransition } from 'react'
import {
  aceitarOcorrenciaFornecedor,
  atualizarEstadoOcorrencia,
  atribuirFornecedorOcorrencia,
  concluirOcorrenciaFornecedor,
  eliminarOcorrencia,
} from '@/app/actions/ocorrencias'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RecusarOcorrenciaDialog } from '@/components/ocorrencias/recusar-ocorrencia-dialog'
import { Check, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const ESTADOS = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_curso', label: 'Em curso' },
  { value: 'resolvida', label: 'Resolvida' },
]

const SEM_FORNECEDOR = '__sem_fornecedor__'

export function OcorrenciaActions({
  id,
  estado,
  isAdmin,
  isOwner,
  isFornecedorResponsavel,
  fornecedorId,
  fornecedores,
}: {
  id: number
  estado: string
  isAdmin: boolean
  isOwner: boolean
  /** O chamador é o fornecedor a quem esta ocorrência está atribuída
   * (portal do fornecedor) — mostra aceitar/recusar/concluir em vez dos
   * controlos completos de admin. */
  isFornecedorResponsavel: boolean
  fornecedorId: number | null
  fornecedores: { id: number; nome: string }[]
}) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [recusarOpen, setRecusarOpen] = useState(false)

  const mudarEstado = (novoEstado: string) => {
    startTransition(async () => {
      try {
        await atualizarEstadoOcorrencia(id, novoEstado)
        toast.success('Estado atualizado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const mudarFornecedor = (valor: string) => {
    const novoFornecedorId = valor === SEM_FORNECEDOR ? null : Number(valor)
    startTransition(async () => {
      try {
        await atribuirFornecedorOcorrencia(id, novoFornecedorId)
        toast.success(novoFornecedorId ? 'Fornecedor atribuído' : 'Fornecedor removido')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarOcorrencia(id)
        toast.success('Ocorrência eliminada')
        setConfirmOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const aceitar = () => {
    startTransition(async () => {
      try {
        await aceitarOcorrenciaFornecedor(id)
        toast.success('Trabalho aceite')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  const concluir = () => {
    startTransition(async () => {
      try {
        await concluirOcorrenciaFornecedor(id)
        toast.success('Marcado como concluído')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  if (!isAdmin && !isOwner && !isFornecedorResponsavel) return null

  if (isFornecedorResponsavel && !isAdmin) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        {estado === 'aberta' && (
          <Button size="sm" disabled={pending} onClick={aceitar}>
            <Check className="h-4 w-4" />
            Aceitar
          </Button>
        )}
        {estado === 'em_curso' && (
          <Button size="sm" disabled={pending} onClick={concluir}>
            <Check className="h-4 w-4" />
            Marcar concluída
          </Button>
        )}
        {estado !== 'resolvida' && (
          <Button variant="outline" size="sm" disabled={pending} onClick={() => setRecusarOpen(true)}>
            <X className="h-4 w-4" />
            Recusar
          </Button>
        )}
        <RecusarOcorrenciaDialog id={id} open={recusarOpen} onOpenChange={setRecusarOpen} />
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {isAdmin && (
        <Select
          value={estado}
          onValueChange={(value) => value && mudarEstado(value)}
          disabled={pending}
        >
          <SelectTrigger size="sm">
            <SelectValue>
              {(v: string | null) => ESTADOS.find((e) => e.value === v)?.label ?? ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {isAdmin && (
        <Select
          value={fornecedorId ? String(fornecedorId) : SEM_FORNECEDOR}
          onValueChange={(value) => value && mudarFornecedor(value)}
          disabled={pending}
        >
          <SelectTrigger size="sm">
            <SelectValue>
              {(v: string | null) =>
                v && v !== SEM_FORNECEDOR
                  ? (fornecedores.find((f) => String(f.id) === v)?.nome ?? '')
                  : 'Sem fornecedor'
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEM_FORNECEDOR}>Sem fornecedor</SelectItem>
            {fornecedores.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Eliminar ocorrência"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar ocorrência"
        description="Esta ação não pode ser desfeita. O registo da ocorrência e o seu histórico são removidos."
        onConfirm={remover}
        pending={pending}
      />
    </div>
  )
}
