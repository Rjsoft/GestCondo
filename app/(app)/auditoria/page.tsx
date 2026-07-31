import { notFound } from 'next/navigation'
import { requireMembroPagina, temConsultaGestao } from '@/lib/session'
import { getAuditLog } from '@/app/actions/auditoria'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import { PaginationControls } from '@/components/ui/pagination-controls'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDataHora } from '@/lib/format'

const ACAO_LABEL: Record<string, string> = {
  criar: 'Criou',
  atualizar: 'Atualizou',
  eliminar: 'Eliminou',
  aprovar: 'Aprovou',
  rejeitar: 'Rejeitou',
  login: 'Iniciou sessão',
  login_falhado: 'Falha de login',
  pedido_reset_password: 'Pediu reposição de palavra-passe',
}

const ENTIDADE_LABEL: Record<string, string> = {
  movimento: 'Movimento financeiro',
  aviso: 'Aviso',
  documento: 'Documento',
  fracao: 'Fração',
  membro: 'Condómino',
  ocorrencia: 'Ocorrência',
  orcamento: 'Orçamento',
  seguro: 'Seguro',
  assembleia: 'Assembleia',
  extratoBancario: 'Extrato bancário',
  condominio: 'Condomínio',
  fornecedor: 'Fornecedor',
  exercicioFinanceiro: 'Exercício financeiro',
  contaFinanceira: 'Conta financeira',
  documentoFornecedor: 'Documento de fornecedor',
  contactoEmergencia: 'Contacto de emergência',
  patrimonio: 'Património',
  mensagem: 'Mensagem',
  orcamentoObra: 'Orçamento de obra',
  fracaoCredito: 'Crédito de fração',
  contrato: 'Contrato',
  acessoConvidado: 'Acesso convidado',
}

type CampoAlterado = { campo: string; label: string; antes: unknown; depois: unknown }

function formatarValor(v: unknown) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não'
  return String(v)
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; de?: string; ate?: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temConsultaGestao(membro)) notFound()

  const params = await searchParams
  const search = params.q ?? ''
  const page = Math.max(1, Number(params.page) || 1)
  // "ate" cobre o dia inteiro (23:59:59.999), não só a meia-noite.
  const dataInicio = params.de ? new Date(`${params.de}T00:00:00`) : undefined
  const dataFim = params.ate ? new Date(`${params.ate}T23:59:59.999`) : undefined
  const { registos, totalPages } = await getAuditLog({ page, search, dataInicio, dataFim })

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Registo de ações sensíveis realizadas no condomínio."
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput placeholder="Pesquisar por autor ou detalhes..." />
        <DateRangeFilter />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="hidden sm:table-cell">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {search ? 'Nenhum registo encontrado.' : 'Ainda não existem registos de auditoria.'}
                  </TableCell>
                </TableRow>
              )}
              {registos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDataHora(r.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{r.actorNome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ACAO_LABEL[r.acao] ?? r.acao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ENTIDADE_LABEL[r.entidade] ?? r.entidade} #{r.entidadeId}
                  </TableCell>
                  <TableCell className="hidden max-w-sm text-muted-foreground sm:table-cell">
                    <span className="block truncate">{r.detalhes || '—'}</span>
                    {Array.isArray(r.alteracoes) && r.alteracoes.length > 0 && (
                      <ul className="mt-1 list-disc pl-4 text-xs">
                        {(r.alteracoes as CampoAlterado[]).map((a) => (
                          <li key={a.campo}>
                            {a.label}: de &ldquo;{formatarValor(a.antes)}&rdquo; para &ldquo;{formatarValor(a.depois)}&rdquo;
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PaginationControls
        page={page}
        totalPages={totalPages}
        buildHref={(p) =>
          `/auditoria?${new URLSearchParams({
            ...(search ? { q: search } : {}),
            ...(params.de ? { de: params.de } : {}),
            ...(params.ate ? { ate: params.ate } : {}),
            page: String(p),
          }).toString()}`
        }
      />
    </div>
  )
}
