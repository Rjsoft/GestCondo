import Link from 'next/link'
import { pesquisaGlobal, type ResultadoPesquisa } from '@/app/actions/pesquisa'
import { requireMembroPagina } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CATEGORIAS: { chave: keyof Awaited<ReturnType<typeof pesquisaGlobal>>; titulo: string; href: string }[] = [
  { chave: 'avisos', titulo: 'Avisos', href: '/avisos' },
  { chave: 'documentos', titulo: 'Documentos', href: '/documentos' },
  { chave: 'ocorrencias', titulo: 'Ocorrências', href: '/ocorrencias' },
  { chave: 'condominos', titulo: 'Condóminos', href: '/condominos' },
  { chave: 'movimentos', titulo: 'Movimentos financeiros', href: '/financas' },
]

function ListaResultados({ itens }: { itens: ResultadoPesquisa[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((item, i) => (
        <li key={i} className="text-sm">
          <p className="font-medium text-foreground">{item.titulo}</p>
          {item.subtitulo && (
            <p className="truncate text-muted-foreground">{item.subtitulo}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

export default async function PesquisaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireMembroPagina()
  const { q } = await searchParams
  const termo = (q ?? '').trim()
  const resultados = termo.length >= 2 ? await pesquisaGlobal(termo) : null
  const totalResultados = resultados
    ? CATEGORIAS.reduce((s, c) => s + resultados[c.chave].length, 0)
    : 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pesquisa"
        description="Procure em avisos, documentos, ocorrências, condóminos e movimentos financeiros, tudo num só sítio."
      />

      <SearchInput placeholder="Pesquisar em toda a aplicação..." />

      {termo.length > 0 && termo.length < 2 && (
        <p className="text-sm text-muted-foreground">Escreva pelo menos 2 caracteres.</p>
      )}

      {resultados && totalResultados === 0 && (
        <p className="text-sm text-muted-foreground">
          Sem resultados para &ldquo;{termo}&rdquo;.
        </p>
      )}

      {resultados && totalResultados > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CATEGORIAS.filter((c) => resultados[c.chave].length > 0).map((c) => (
            <Card key={c.chave}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-base">{c.titulo}</CardTitle>
                <Link
                  href={`${c.href}?q=${encodeURIComponent(termo)}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver todos
                </Link>
              </CardHeader>
              <CardContent>
                <ListaResultados itens={resultados[c.chave]} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
