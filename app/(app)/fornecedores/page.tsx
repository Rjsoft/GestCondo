import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { removerAcentos } from '@/lib/format'
import { getFornecedores } from '@/app/actions/fornecedores'
import { getOrcamentosObra } from '@/app/actions/orcamentos-obra'
import { getOcorrencias } from '@/app/actions/ocorrencias'
import { getContratos } from '@/app/actions/contratos'
import { PageHeader } from '@/components/page-header'
import { FornecedoresTabs } from '@/components/fornecedores/fornecedores-tabs'

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; qOrcamentos?: string; page?: string }>
}) {
  const membro = await requireMembroPagina()
  const isAdmin = temPermissaoGestao(membro)
  const params = await searchParams
  const search = removerAcentos((params.q ?? '').trim().toLowerCase())
  const orcamentosSearch = params.qOrcamentos ?? ''
  const orcamentosPage = Math.max(1, Number(params.page) || 1)

  const [todosFornecedores, { orcamentos, totalPages: orcamentosTotalPages }, { ocorrencias }, contratos] =
    await Promise.all([
      getFornecedores(),
      getOrcamentosObra({ page: orcamentosPage, search: orcamentosSearch }),
      getOcorrencias(),
      getContratos(),
    ])

  // Pesquisa em memória: lista tipicamente pequena por condomínio, mesma
  // decisão já tomada para /fracoes/condominos.
  const fornecedoresFiltrados = search
    ? todosFornecedores.filter(
        (f) =>
          removerAcentos(f.nome.toLowerCase()).includes(search) ||
          removerAcentos((f.categoria ?? '').toLowerCase()).includes(search),
      )
    : todosFornecedores

  return (
    <div>
      <PageHeader
        title="Fornecedores"
        description="Contactos de fornecedores, orçamentos de obra e contratos do condomínio."
      />

      <FornecedoresTabs
        fornecedores={todosFornecedores}
        fornecedoresFiltrados={fornecedoresFiltrados}
        search={search}
        isAdmin={isAdmin}
        orcamentos={orcamentos}
        orcamentosPage={orcamentosPage}
        orcamentosTotalPages={orcamentosTotalPages}
        orcamentosSearch={orcamentosSearch}
        ocorrencias={ocorrencias.map((o) => ({ id: o.id, titulo: o.titulo }))}
        contratos={contratos}
      />
    </div>
  )
}
