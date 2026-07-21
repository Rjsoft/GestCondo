import Image from 'next/image'
import { requireMembroPagina, podeEscrever, temPermissaoGestao } from '@/lib/session'
import { getOcorrencias } from '@/app/actions/ocorrencias'
import { PageHeader } from '@/components/page-header'
import { NovaOcorrenciaDialog } from '@/components/ocorrencias/nova-ocorrencia-dialog'
import { OcorrenciaActions } from '@/components/ocorrencias/ocorrencia-actions'
import { PrioridadeBadge, EstadoBadge } from '@/components/badges'
import { Card, CardContent } from '@/components/ui/card'
import { SearchInput } from '@/components/ui/search-input'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { formatData } from '@/lib/format'
import { Wrench } from 'lucide-react'

export default async function OcorrenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const membro = await requireMembroPagina()
  const isAdmin = temPermissaoGestao(membro)
  const params = await searchParams
  const search = params.q ?? ''
  const page = Math.max(1, Number(params.page) || 1)
  const { ocorrencias, totalPages } = await getOcorrencias({ page, search })

  return (
    <div>
      <PageHeader
        title="Ocorrências"
        description="Pedidos de manutenção e reportes dos condóminos."
      >
        {podeEscrever(membro) && <NovaOcorrenciaDialog />}
      </PageHeader>

      <div className="mb-4">
        <SearchInput placeholder="Pesquisar ocorrências..." />
      </div>

      {ocorrencias.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Wrench className="h-8 w-8" />
            <p>{search ? 'Nenhuma ocorrência encontrada.' : 'Sem ocorrências registadas.'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="flex flex-col gap-3">
          {ocorrencias.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{o.titulo}</h3>
                    <PrioridadeBadge prioridade={o.prioridade} />
                    <EstadoBadge estado={o.estado} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {o.descricao}
                  </p>
                  {o.fotoUrl && (
                    <a href={o.fotoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block w-fit">
                      <Image
                        src={o.fotoUrl}
                        alt="Foto da ocorrência"
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-md border border-border object-cover"
                      />
                    </a>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {o.reporterNome}
                    {o.local ? ` · ${o.local}` : ''} · {formatData(o.createdAt)}
                  </p>
                </div>
                <OcorrenciaActions
                  id={o.id}
                  estado={o.estado}
                  isAdmin={isAdmin}
                  isOwner={o.userId === membro.userId}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          buildHref={(p) => `/ocorrencias?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(p) }).toString()}`}
        />
        </>
      )}
    </div>
  )
}
