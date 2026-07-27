import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDataHora } from '@/lib/format'
import { PERFIL_LABEL, type Perfil } from '@/lib/perfis'

type ConversaItem = {
  userId: string
  nome: string
  perfil: string | null
  ultimaMensagem: string
  ultimaData: Date
  naoLidas: number
}

export function ListaConversas({ conversas }: { conversas: ConversaItem[] }) {
  if (conversas.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          Ainda não há nenhuma conversa.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {conversas.map((c) => (
        <Link key={c.userId} href={`/mensagens/${c.userId}`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-foreground">{c.nome}</h3>
                  {c.perfil && (
                    <Badge variant="outline">{PERFIL_LABEL[c.perfil as Perfil] ?? c.perfil}</Badge>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {c.ultimaMensagem}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">
                  {formatDataHora(c.ultimaData)}
                </span>
                {c.naoLidas > 0 && (
                  <Badge>{c.naoLidas} nova{c.naoLidas > 1 ? 's' : ''}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
