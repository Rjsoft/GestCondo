import { notFound } from 'next/navigation'
import { requireMembroPagina, temPermissaoGestao, getCondominioAtual } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { EditarCondominioForm } from '@/components/condominio/editar-condominio-form'
import { CodigoConviteCard } from '@/components/condominio/codigo-convite-card'

export default async function CondominioPage() {
  const membro = await requireMembroPagina()
  if (!temPermissaoGestao(membro)) notFound()

  const condominio = await getCondominioAtual(membro.condominioId)
  if (!condominio) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Condomínio"
        description="Dados de identificação do condomínio, usados nos recibos e relatórios."
      />
      <Card>
        <CardContent className="p-5">
          <EditarCondominioForm nome={condominio.nome} morada={condominio.morada} nif={condominio.nif} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <h2 className="font-serif text-sm font-bold text-foreground">Convidar novos membros</h2>
          <CodigoConviteCard codigoConvite={condominio.codigoConvite} />
        </CardContent>
      </Card>
    </div>
  )
}
