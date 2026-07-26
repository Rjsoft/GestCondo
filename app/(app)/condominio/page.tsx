import { notFound } from 'next/navigation'
import { requireMembroPagina, temPermissaoGestao, getCondominioAtual } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { EditarCondominioForm } from '@/components/condominio/editar-condominio-form'
import { CodigoConviteCard } from '@/components/condominio/codigo-convite-card'
import { ExportarDadosCondominioButton } from '@/components/condominio/exportar-dados-button'

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
          <EditarCondominioForm
            nome={condominio.nome}
            morada={condominio.morada}
            nif={condominio.nif}
            numeroMatricial={condominio.numeroMatricial}
            conservatoriaRegistoPredial={condominio.conservatoriaRegistoPredial}
            licencaHabitacao={condominio.licencaHabitacao}
            projetoArquiteto={condominio.projetoArquiteto}
            areaConstrucao={condominio.areaConstrucao}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <h2 className="font-serif text-sm font-bold text-foreground">Convidar novos membros</h2>
          <CodigoConviteCard codigoConvite={condominio.codigoConvite} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <h2 className="font-serif text-sm font-bold text-foreground">Exportar dados</h2>
          <p className="text-sm text-muted-foreground">
            Descarrega um ficheiro com todos os dados deste condomínio (frações,
            movimentos, avisos, assembleias, documentos, etc.). Não inclui o
            conteúdo dos ficheiros anexados, nem a lista de condóminos com
            conta — só os dados do próprio condomínio. Pode voltar a carregar
            este ficheiro mais tarde, na criação de um condomínio novo.
          </p>
          <div>
            <ExportarDadosCondominioButton />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
