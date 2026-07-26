// Helpers puros usados por app/actions/condominio.ts:importarCondominio ao
// recriar, num condomínio novo, os dados de um ficheiro produzido por
// exportarCondominio. Isolados aqui (sem `db`, sem sessão) para poderem ser
// testados diretamente, sem precisar de um pedido HTTP nem de uma BD real.

/** Converte um valor vindo de JSON.parse (sempre string, nunca Date) numa Date. */
export function paraData(valor: unknown): Date {
  return new Date(valor as string)
}

/** Como paraData, mas devolve null quando o valor de origem é null/undefined. */
export function paraDataOuNula(valor: unknown): Date | null {
  return valor ? new Date(valor as string) : null
}

/**
 * Traduz um id do condomínio de origem (exportado) para o id correspondente
 * já inserido no condomínio novo. Lança erro se o id de origem não tiver
 * sido registado no mapa — sinal de um ficheiro de importação inconsistente
 * (referência a um registo que a própria exportação não incluiu).
 */
export function remapear(mapa: Map<number, number>, idAntigo: number): number {
  const idNovo = mapa.get(idAntigo)
  if (idNovo === undefined) {
    throw new Error('Ficheiro de importação inconsistente (referência a um registo inexistente)')
  }
  return idNovo
}

/** Como remapear, mas para FKs opcionais — passa null através sem remapear. */
export function remapearOpcional(mapa: Map<number, number>, idAntigo: number | null): number | null {
  return idAntigo === null || idAntigo === undefined ? null : remapear(mapa, idAntigo)
}
