import { requireMembroPagina } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { AjudaTabs } from '@/components/ajuda/ajuda-tabs'
import { LeituraVozControls } from '@/components/leitura-voz/leitura-voz-controls'

export default async function AjudaPage() {
  await requireMembroPagina()

  return (
    <div>
      <PageHeader
        title="Ajuda"
        description="Como funciona cada módulo do GestCondo."
      >
        <LeituraVozControls targetId="ajuda-conteudo" />
      </PageHeader>
      <AjudaTabs />
    </div>
  )
}
