// Deteção preventiva de inconsistências — determinística, sem IA (ver
// docs/audit/AI_FEATURES_VIABILITY.md, item P0 "deteção de inconsistências"
// e item P0 "pesquisa melhorada"). Cada verificação está ligada a um estado
// real e possível no schema (lib/db/schema.ts) — não inventa uma condição
// que a base de dados não permite acontecer.

import { formatData } from '@/lib/format'

export type TipoInconsistencia =
  | 'fracao_sem_permilagem'
  | 'movimento_duplicado'
  | 'ata_por_escrever'
  | 'ponto_sem_resultado'

export type Inconsistencia = {
  tipo: TipoInconsistencia
  titulo: string
  detalhe: string
  href: string
}

export type FracaoParaVerificacao = {
  id: number
  identificacao: string
  permilagem: number
}

/**
 * `permilagem` tem `.notNull().default("0")` no schema — nunca é null, mas
 * uma fração criada sem preencher este campo fica silenciosamente a 0‰,
 * distorcendo o rateio de despesas de todas as outras frações sem que
 * ninguém dê por isso ao consultar só essa fração isoladamente.
 */
export function detetarFracoesSemPermilagem(
  fracoes: FracaoParaVerificacao[],
): Inconsistencia[] {
  return fracoes
    .filter((f) => f.permilagem === 0)
    .map((f) => ({
      tipo: 'fracao_sem_permilagem' as const,
      titulo: `Fração ${f.identificacao} está com 0‰ de permilagem`,
      detalhe:
        'Provavelmente esquecida ao registar a fração — enquanto ficar a 0‰, esta fração não paga a sua parte de nenhuma despesa comum.',
      href: '/fracoes',
    }))
}

export type MovimentoParaVerificacao = {
  id: number
  fracaoId: number | null
  valor: number
  data: Date
  tipo: string
  descricao: string
}

/**
 * Mesma fração + mesmo valor + mesmo dia + mesmo tipo (receita/despesa) é
 * indício forte de lançamento em duplicado (ex: importado duas vezes da
 * conciliação bancária) — não prova, por isso é sempre apresentado como
 * "possível", nunca eliminado automaticamente.
 */
export function detetarMovimentosDuplicados(
  movimentos: MovimentoParaVerificacao[],
): Inconsistencia[] {
  const grupos = new Map<string, MovimentoParaVerificacao[]>()
  for (const m of movimentos) {
    if (m.fracaoId === null) continue
    const chave = `${m.fracaoId}|${m.valor}|${formatarData(m.data)}|${m.tipo}`
    const grupo = grupos.get(chave)
    if (grupo) grupo.push(m)
    else grupos.set(chave, [m])
  }

  const inconsistencias: Inconsistencia[] = []
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue
    inconsistencias.push({
      tipo: 'movimento_duplicado',
      titulo: `Possível movimento duplicado: "${grupo[0].descricao}"`,
      detalhe: `${grupo.length} movimentos com a mesma fração, o mesmo valor e a mesma data (${formatData(grupo[0].data)}).`,
      href: '/financas',
    })
  }
  return inconsistencias
}

export type AssembleiaParaVerificacao = {
  id: number
  dataPrimeiraConvocatoria: Date
  estado: string
  textoAta: string | null
}

/**
 * Uma assembleia com estado "realizada" já aconteceu — se passar muito
 * tempo sem a ata ser escrita, arrisca perder-se o registo do que foi
 * decidido. `prazoDias` por omissão alinhado com o prazo comum de boas
 * práticas para lavrar a ata, não um prazo legal fixo no Código Civil.
 */
export function detetarAtasPorEscrever(
  assembleias: AssembleiaParaVerificacao[],
  hoje: Date,
  prazoDias = 30,
): Inconsistencia[] {
  return assembleias
    .filter((a) => a.estado === 'realizada' && !a.textoAta?.trim())
    .filter((a) => diasEntre(a.dataPrimeiraConvocatoria, hoje) >= prazoDias)
    .map((a) => ({
      tipo: 'ata_por_escrever' as const,
      titulo: `Assembleia de ${formatData(a.dataPrimeiraConvocatoria)} sem ata escrita`,
      detalhe: `Já foi realizada há mais de ${prazoDias} dias, mas ainda não tem o texto da ata preenchido.`,
      href: '/assembleias',
    }))
}

export type PontoParaVerificacao = {
  id: number
  assembleiaId: number
  titulo: string
  resultado: string | null
}

/**
 * Um ponto da ordem de trabalhos sem resultado registado, numa assembleia
 * já realizada/aprovada, significa que a votação desse ponto ficou por
 * concluir no sistema — mesmo que tenha sido decidida presencialmente.
 */
export function detetarPontosSemResultado(
  assembleias: AssembleiaParaVerificacao[],
  pontos: PontoParaVerificacao[],
): Inconsistencia[] {
  const idsConcluidas = new Set(
    assembleias.filter((a) => a.estado === 'realizada' || a.estado === 'aprovada').map((a) => a.id),
  )
  return pontos
    .filter((p) => idsConcluidas.has(p.assembleiaId) && !p.resultado)
    .map((p) => ({
      tipo: 'ponto_sem_resultado' as const,
      titulo: `Ponto "${p.titulo}" sem resultado registado`,
      detalhe: 'A assembleia já foi realizada, mas este ponto ainda não tem um resultado de votação (aprovado/reprovado/adiado).',
      href: '/assembleias',
    }))
}

function diasEntre(inicio: Date, fim: Date): number {
  return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
}

function formatarData(d: Date): string {
  return d.toISOString().slice(0, 10)
}
