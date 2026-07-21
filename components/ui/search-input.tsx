'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchInput({
  placeholder = 'Pesquisar...',
  paramName = 'q',
}: {
  placeholder?: string
  paramName?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [valor, setValor] = useState(() => searchParams.get(paramName) ?? '')

  useEffect(() => {
    const atual = searchParams.get(paramName) ?? ''
    if (valor === atual) return

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (valor) {
        params.set(paramName, valor)
      } else {
        params.delete(paramName)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}
