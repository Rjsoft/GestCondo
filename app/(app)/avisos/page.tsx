import { getMembroAtual, temPermissaoGestao } from '@/lib/session'
import { getAvisos } from '@/app/actions/avisos'
import { PageHeader } from '@/components/page-header'
import { NovoAvisoDialog } from '@/components/avisos/novo-aviso-dialog'
import { AvisoActions } from '@/components/avisos/aviso-actions'
import { PrioridadeBadge } from '@/components/badges'
import { Card, CardContent } from '@/components/ui/card'
import { formatDataHora } from '@/lib/format'
import { Megaphone } from 'lucide-react'

export default async function AvisosPage() {
  const membro = (await getMembroAtual())!
  const isAdmin = temPermissaoGestao(membro)
  const avisos = await getAvisos()

  return (
    <div>
      <PageHeader
        title="Avisos"
        description="Comunicados e informações para todos os condóminos."
      >
        {isAdmin && <NovoAvisoDialog />}
      </PageHeader>

      {avisos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Megaphone className="h-8 w-8" />
            <p>Ainda não existem avisos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {avisos.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{a.titulo}</h3>
                    <PrioridadeBadge prioridade={a.prioridade} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {a.conteudo}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {a.autorNome} · {formatDataHora(a.createdAt)}
                  </p>
                </div>
                {isAdmin && <AvisoActions id={a.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
