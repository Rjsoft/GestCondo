'use client'

import { useTransition } from 'react'
import {
  atualizarEstadoOcorrencia,
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
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const ESTADOS = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_curso', label: 'Em curso' },
  { value: 'resolvida', label: 'Resolvida' },
]

export function OcorrenciaActions({
  id,
  estado,
  isAdmin,
  isOwner,
}: {
  id: number
  estado: string
  isAdmin: boolean
  isOwner: boolean
}) {
  const [pending, startTransition] = useTransition()

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

  const remover = () => {
    startTransition(async () => {
      try {
        await eliminarOcorrencia(id)
        toast.success('Ocorrência eliminada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro')
      }
    })
  }

  if (!isAdmin && !isOwner) return null

  return (
    <div className="flex shrink-0 items-center gap-2">
      {isAdmin && (
        <Select
          value={estado}
          onValueChange={(value) => value && mudarEstado(value)}
          disabled={pending}
        >
          <SelectTrigger size="sm">
            <SelectValue />
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
      <Button
        variant="ghost"
        size="icon"
        disabled={pending}
        onClick={remover}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Eliminar ocorrência"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
