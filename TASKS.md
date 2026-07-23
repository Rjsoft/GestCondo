# GestCondo — Tarefas

## Concluídas

### UI-001 — Aproveitamento integral da área de trabalho

**Tipo:** Melhoria de interface
**Prioridade:** Média
**Estado:** Concluído (2026-07-23)

#### Objetivo

Rever toda a aplicação GestCondo para garantir que a área de trabalho
aproveita corretamente a largura útil disponível em cada resolução.

#### Requisitos

- Evitar espaços vazios excessivos.
- Aproveitar melhor a largura disponível em ecrãs grandes.
- Manter margens equilibradas.
- Garantir boa apresentação de tabelas, cartões, listas e formulários.
- Evitar scroll horizontal desnecessário.
- Manter responsividade em desktop, tablet e telemóvel.
- Corrigir preferencialmente layouts e componentes globais.
- Não alterar lógica funcional, permissões ou dados.

#### Análise (causa raiz)

Uma única origem para o problema em toda a app: `components/app-shell.tsx`
— o `<main>` que envolve o conteúdo de **todas** as páginas autenticadas
(via `app/(app)/layout.tsx`) tinha `max-w-6xl` (1152px). Em qualquer ecrã
mais largo do que sidebar (256px) + 1152px + padding, sobrava uma margem
vazia à direita, independentemente da página — daí o problema ser
transversal e não específico de nenhuma tabela/formulário em particular.

As páginas imprimíveis (recibo, ata, minutas, relatórios, balanço,
declaração de dívida, interpelação, mapa mensal) têm o seu próprio
`max-w` intencional, para imitar uma folha A4 — não fazem parte deste
problema e não foram alteradas. Páginas de autenticação/onboarding
(fora do `AppShell`) também ficaram de fora, por não serem "área de
trabalho".

#### Solução aplicada

Ficheiro alterado: `components/app-shell.tsx` (única alteração).

`max-w-6xl` (1152px) → `max-w-[1600px]` no wrapper do `<main>`. Em ecrãs
até ~1600px de largura de conteúdo (a maioria dos portáteis/desktops), o
conteúdo passa a ocupar toda a largura disponível; em monitores
ultra-largos mantém-se um limite generoso para não esticar
absurdamente linhas de texto/tabelas. Sem qualquer alteração em ecrãs
estreitos (telemóvel/tablet) — o limite só atua quando há espaço a mais.

#### Validação

Comandos executados (adaptados para `npx`, já que `pnpm` não estava no
`PATH` desta sessão — ver gotcha no `CLAUDE.md`):

```bash
npx eslint components/app-shell.tsx   # sem erros/avisos
npx tsc --noEmit                      # sem erros
npx vitest run                        # 67/67 testes
npx next build                        # build de produção concluído com sucesso
```

Verificação visual no browser (dev, conta real), janela larga (1920px):
Painel e Finanças confirmados a usar a largura disponível corretamente,
sem scroll horizontal introduzido, sidebar e tabelas intactas.

## Por executar

(nenhuma tarefa pendente neste momento)
