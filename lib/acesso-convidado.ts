/** Um acesso convidado (F13) está ativo quando não foi revogado e ainda
 * não passou do prazo. Extraído para fora dos componentes/páginas porque
 * chama `Date.now()` — a regra de pureza do React aplica-se ao corpo de
 * componentes/hooks, não a uma função utilitária chamada a partir deles. */
export function acessoConvidadoAtivo(a: { revogadoEm: Date | null; expiraEm: Date }): boolean {
  return !a.revogadoEm && a.expiraEm.getTime() > Date.now()
}
