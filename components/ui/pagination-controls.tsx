import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function PaginationControls({
  page,
  totalPages,
  buildHref,
}: {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          render={<Link href={buildHref(page - 1)} />}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          render={<Link href={buildHref(page + 1)} />}
        >
          Seguinte
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
