import Link from 'next/link'
import { getNotificacoes, type CategoriaNotificacoes } from '@/app/actions/notificacoes'
import { requireMembroPagina } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CATEGORIAS: { chave: keyof Awaited<ReturnType<typeof getNotificacoes>>; titulo: string }[] = [
  { chave: 'mensagens', titulo: 'Mensagens' },
  { chave: 'avisos', titulo: 'Avisos por confirmar' },
  { chave: 'ocorrencias', titulo: 'Ocorrências' },
]

function Lista({ categoria }: { categoria: CategoriaNotificacoes }) {
  return (
    <ul className="flex flex-col gap-3">
      {categoria.itens.map((item, i) => (
        <li key={i}>
          <Link href={item.href} className="block rounded-md p-2 -m-2 hover:bg-accent">
            <p className="text-sm font-medium text-foreground">{item.titulo}</p>
            <p className="text-xs text-muted-foreground">{item.subtitulo}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function NotificacoesPage() {
  await requireMembroPagina()
  const notificacoes = await getNotificacoes()
  const total = CATEGORIAS.reduce((s, c) => s + notificacoes[c.chave].total, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notificações"
        description="Mensagens por ler, avisos importantes por confirmar e ocorrências que precisam de si, tudo num só sítio."
      />

      {total === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Sem notificações de momento.
          </CardContent>
        </Card>
      )}

      {total > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CATEGORIAS.filter((c) => notificacoes[c.chave].total > 0).map((c) => (
            <Card key={c.chave}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-serif text-base">{c.titulo}</CardTitle>
                <Badge variant="outline">{notificacoes[c.chave].total}</Badge>
              </CardHeader>
              <CardContent>
                <Lista categoria={notificacoes[c.chave]} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
