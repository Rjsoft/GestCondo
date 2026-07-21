import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  const map: Record<string, { label: string; className: string }> = {
    normal: { label: 'Normal', className: 'bg-secondary text-secondary-foreground' },
    importante: {
      label: 'Importante',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    urgente: {
      label: 'Urgente',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }
  const cfg = map[prioridade] ?? map.normal
  return (
    <Badge variant="outline" className={cn('border', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

export function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; className: string }> = {
    aberta: {
      label: 'Aberta',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    em_curso: {
      label: 'Em curso',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    resolvida: {
      label: 'Resolvida',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
  }
  const cfg = map[estado] ?? map.aberta
  return (
    <Badge variant="outline" className={cn('border', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

export function EstadoMembroBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; className: string }> = {
    aprovado: {
      label: 'Aprovado',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    pendente: {
      label: 'Pendente',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  }
  const cfg = map[estado] ?? map.pendente
  return (
    <Badge variant="outline" className={cn('border', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

export function AssembleiaStatusBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; className: string }> = {
    convocada: {
      label: 'Convocada',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    realizada: {
      label: 'Realizada',
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    aprovada: {
      label: 'Aprovada',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    cancelada: {
      label: 'Cancelada',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }
  const cfg = map[estado] ?? map.convocada
  return (
    <Badge variant="outline" className={cn('border', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

export function TipoMovimentoBadge({ tipo }: { tipo: string }) {
  const isReceita = tipo === 'receita'
  return (
    <Badge
      variant="outline"
      className={cn(
        'border',
        isReceita
          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
          : 'bg-red-100 text-red-800 border-red-200',
      )}
    >
      {isReceita ? 'Receita' : 'Despesa'}
    </Badge>
  )
}
