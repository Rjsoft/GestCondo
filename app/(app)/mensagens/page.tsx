import { notFound } from 'next/navigation'
import { getConversas, getMinhaConversa, enviarMensagemPropria } from '@/app/actions/mensagens'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/ui/search-input'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { ListaConversas } from '@/components/mensagens/lista-conversas'
import { Conversa } from '@/components/mensagens/conversa'

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const membro = await requireMembroPagina()
  // Canal privado — o auditor (consulta apenas) fica deliberadamente de
  // fora por completo, tal como já não tem acesso a IBAN/contactos.
  if (membro.perfil === 'auditor' && !membro.isSuperAdmin) notFound()

  if (temPermissaoGestao(membro)) {
    const params = await searchParams
    const search = params.q ?? ''
    const page = Math.max(1, Number(params.page) || 1)
    const { conversas, totalPages } = await getConversas({ page, search })

    return (
      <div>
        <PageHeader
          title="Mensagens"
          description="Conversas dos condóminos, inquilinos e fornecedores com a administração."
        />
        <div className="mb-4">
          <SearchInput placeholder="Pesquisar por nome..." />
        </div>
        <ListaConversas conversas={conversas} />
        <PaginationControls
          page={page}
          totalPages={totalPages}
          buildHref={(p) => `/mensagens?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(p) }).toString()}`}
        />
      </div>
    )
  }

  const mensagens = await getMinhaConversa()

  return (
    <div>
      <PageHeader
        title="Mensagens"
        description="A sua conversa privada com a administração do condomínio."
      />
      <Conversa mensagens={mensagens} souGestao={false} onEnviar={enviarMensagemPropria} />
    </div>
  )
}
