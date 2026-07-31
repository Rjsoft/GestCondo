'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Filtro por intervalo de datas via parâmetros de URL (`de`/`ate`),
 * mesmo padrão de components/ui/search-input.tsx — mantém o estado na URL
 * para poder partilhar/voltar ao mesmo filtro. */
export function DateRangeFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const de = searchParams.get('de') ?? ''
  const ate = searchParams.get('ate') ?? ''

  const atualizar = (campo: 'de' | 'ate', valor: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) {
      params.set(campo, valor)
    } else {
      params.delete(campo)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-data-de" className="text-xs text-muted-foreground">
          De
        </Label>
        <Input
          id="filtro-data-de"
          type="date"
          value={de}
          onChange={(e) => atualizar('de', e.target.value)}
          className="w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-data-ate" className="text-xs text-muted-foreground">
          Até
        </Label>
        <Input
          id="filtro-data-ate"
          type="date"
          value={ate}
          onChange={(e) => atualizar('ate', e.target.value)}
          className="w-40"
        />
      </div>
    </div>
  )
}
