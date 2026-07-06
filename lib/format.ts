export function formatEuro(value: number | string) {
  const n = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number.isFinite(n) ? n : 0)
}

export function formatData(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDataHora(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}
