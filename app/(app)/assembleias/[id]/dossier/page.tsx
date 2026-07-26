import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAssembleiaDetalhe } from '@/app/actions/assembleias'
import { getResumoFinanceiro, getMapaSaldos } from '@/app/actions/financas'
import { getExercicios } from '@/app/actions/exercicios'
import { getBalancoPatrimonial } from '@/app/actions/contas-financeiras'
import { getCondominioAtual, requireAcessoFinanceiro } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { ImprimirButton } from '@/components/imprimir-button'
import { VoltarButton } from '@/components/voltar-button'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatData, formatDataHora, formatEuro } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

// Consolida num único documento imprimível as peças de apoio à assembleia
// que já existiam em separado: convocatória (resumo, não a minuta legal
// completa — essa continua em /convocatoria), resumo financeiro, mapa de
// saldos por fração e balanço patrimonial. Decisão do utilizador
// (2026-07-26, ver RAT.md secção 4): mostra nome completo e saldo de
// dívida de todos os condóminos — réplica deliberada da prática de
// mercado, base legal art. 1436.º/j do Código Civil (dever de prestação
// de contas). Por isso exige acesso financeiro (mais restritivo que a
// convocatória/ata, que qualquer membro aprovado, incluindo inquilino,
// já podia consultar) — inquilino nunca vê dados financeiros na
// aplicação, e este documento não é exceção.
export default async function DossierAssembleiaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membro = await requireAcessoFinanceiro()
  const { id } = await params
  const assembleiaId = Number(id)
  if (!Number.isInteger(assembleiaId)) notFound()

  const detalhe = await getAssembleiaDetalhe(assembleiaId)
  if (!detalhe) notFound()
  const { assembleia, pontos, anexos } = detalhe

  const [condominio, resumoFinanceiro, mapaSaldos, exercicios] = await Promise.all([
    getCondominioAtual(membro.condominioId),
    getResumoFinanceiro(),
    getMapaSaldos(),
    getExercicios(),
  ])

  // Mesmo critério de "exercício em vista" já usado em /financas: o aberto
  // mais recente, senão o mais recente de todos, senão nenhum.
  const exercicioEmVistaId =
    exercicios.find((e) => e.estado === 'aberto')?.id ?? exercicios[0]?.id ?? null
  const balanco = exercicioEmVistaId ? await getBalancoPatrimonial(exercicioEmVistaId) : null

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="mb-4 flex justify-between print:hidden">
        <VoltarButton />
        <ImprimirButton />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardContent className="flex flex-col gap-8 p-8 print:p-0">
          <CabecalhoDocumento
            condominio={condominio}
            titulo="Dossier de apoio à assembleia"
            subtitulo={`Assembleia ${TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo}${assembleia.numero ? ` nº ${assembleia.numero}` : ''} — ${formatDataHora(assembleia.dataPrimeiraConvocatoria)}, ${assembleia.local}`}
          />

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Ordem de trabalhos
            </h2>
            {pontos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não existem pontos na ordem de trabalhos.
              </p>
            ) : (
              <ol className="flex flex-col gap-1 text-sm text-foreground">
                {pontos.map((p) => (
                  <li key={p.id}>
                    {p.ordem}. {p.titulo}
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-2 text-xs text-muted-foreground print:hidden">
              Minuta legal completa da convocatória disponível em{' '}
              <Link
                href={`/assembleias/${assembleia.id}/convocatoria`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Convocatória (PDF)
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Resumo financeiro
            </h2>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="font-serif font-bold text-emerald-600">
                  {formatEuro(resumoFinanceiro.receitas)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="font-serif font-bold text-red-600">
                  {formatEuro(resumoFinanceiro.despesas)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="font-serif font-bold text-foreground">
                  {formatEuro(resumoFinanceiro.saldo)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Mapa de saldos por fração
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fração</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead className="text-right">Lançado</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead className="text-right">Em dívida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mapaSaldos.map((s) => (
                  <TableRow key={s.fracaoId}>
                    <TableCell>{s.identificacao}</TableCell>
                    <TableCell>{s.proprietario}</TableCell>
                    <TableCell className="text-right">{formatEuro(s.totalLancado)}</TableCell>
                    <TableCell className="text-right">{formatEuro(s.totalPago)}</TableCell>
                    <TableCell
                      className={`text-right ${s.emDivida > 0 ? 'font-medium text-red-600' : ''}`}
                    >
                      {formatEuro(s.emDivida)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
              Balanço patrimonial
            </h2>
            {balanco ? (
              <>
                <p className="mb-2 text-xs text-muted-foreground">
                  Exercício: {balanco.exercicio.designacao}
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Ativo</p>
                    <p className="font-serif font-bold text-emerald-600">
                      {formatEuro(balanco.ativo.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passivo</p>
                    <p className="font-serif font-bold text-red-600">
                      {formatEuro(balanco.passivo.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Situação líquida</p>
                    <p className="font-serif font-bold text-foreground">
                      {formatEuro(balanco.situacaoLiquida.total)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem exercício financeiro configurado.
              </p>
            )}
          </div>

          {anexos.length > 0 && (
            <div>
              <h2 className="mb-2 font-serif text-sm font-bold text-foreground">Anexos</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {anexos.map((a) => (
                  <li key={a.id}>
                    <a
                      href={`/api/ficheiros?url=${encodeURIComponent(a.url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline print:text-foreground"
                    >
                      {a.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Documento gerado automaticamente pelo GestCondo em {formatData(new Date())} — dossier
            de apoio à prestação de contas em assembleia (art. 1436.º, n.º 1, alínea j) do Código
            Civil). Não substitui a ata nem a convocatória, que continuam a ser os documentos
            legalmente vinculativos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
