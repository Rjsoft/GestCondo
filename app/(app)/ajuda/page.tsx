import { requireMembroPagina } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { AjudaTabs } from '@/components/ajuda/ajuda-tabs'

export default async function AjudaPage() {
  await requireMembroPagina()

  return (
    <div>
      <PageHeader
        title="Ajuda"
        description="Como funciona cada módulo do GestCondo."
      />
      <AjudaTabs />
    </div>
  )
}
