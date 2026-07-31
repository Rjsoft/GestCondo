# Plano de melhorias — proposta a partir da simulação de usabilidade/acessibilidade

**Nada neste documento está aprovado.** É uma proposta, resultado de uma simulação
técnica (ver limites em `USER_PERSONAS.md`), para o utilizador decidir o que entra em
desenvolvimento e por que ordem. Referências completas de cada achado em
`USABILITY_FINDINGS.md` (F01-F22).

---

## Verificações de código a fazer antes de qualquer decisão (custo quase zero)

Duas peças da simulação não conseguiram confirmar comportamento só por leitura parcial
do código — vale a pena resolver antes de decidir prioridades, porque podem mudar a
gravidade real:

- **F21** — confirmar se `app/actions/assembleias.ts` bloqueia no servidor a edição de
  uma assembleia já aprovada (hoje só confirmado bloqueado na UI).
- **F22** — confirmar se `AssembleiaActions` (cancelar assembleia) usa `ConfirmDialog`
  como o resto da app.

---

## 1. Correções imediatas
*Críticos, acessibilidade, segurança/permissões, ou risco de erro com impacto
financeiro/jurídico direto.*

| Achado | Benefício | Beneficia | Risco mitigado | Esforço | Dependências | Dados/permissões | Teste real necessário? |
|---|---|---|---|---|---|---|---|
| **F05** — confirmação ao registar resultado de deliberação + forma de o corrigir depois | Evita registar deliberações erradas por engano; hoje, uma vez registado, não há nenhuma via na interface para corrigir (confirmado: os botões desaparecem após o único clique e não existe outra ação que reescreva o resultado) | Todos os admins, sobretudo utilizadores de teclado/leitor de ecrã | Erro legal/documental numa ata sem correção possível | Baixo/Médio — reutilizar `ConfirmDialog` já existente para a confirmação; acrescentar um botão de correção é esforço adicional | Nenhuma | Não altera dados nem permissões | Recomendado (NVDA real) antes de fechar |
| **F12** — esconder outros fornecedores de uma conta `fornecedor` | Evita expor dados comerciais de terceiros a concorrentes | Todos os fornecedores com conta | Exposição de dados de terceiros | Baixo — condicionar a tab/query a `isFornecedor` | Nenhuma | Sim — é uma correção de permissões | Não |
| **F01** — aviso de duplicado no momento de lançar um movimento | Evita distorcer o saldo mostrado a todos os condóminos | Qualquer perfil de gestão | Erro financeiro | Médio — reutilizar `lib/inconsistencias.ts` no próprio diálogo | Nenhuma | Não | Não |
| **F02** — condomínio ativo mais visível + confirmação de troca | Evita lançar dados no condomínio errado | Empresas gestoras multi-condomínio | Erro financeiro/comunicacional | Médio — UI em vários cabeçalhos + toast | Nenhuma | Não | Não |

---

## 2. Melhorias de curto prazo
*Alto benefício, esforço baixo a médio.*

| Achado | Benefício | Beneficia | Esforço | Dependências |
|---|---|---|---|---|
| **F06** — sinalizar pendências (pedidos de acesso, próxima assembleia) no painel | Administrador novo/substituto não perde tarefas | Admins ocasionais, substitutos | Médio — reaproveita padrão do cartão "Verificações" | Nenhuma |
| **F09** — não pré-selecionar "A favor" no registo de voto | Reduz erro de registo em série | Quem regista votos em assembleia | Muito baixo | Nenhuma |
| **F10** — destacar mais o estado "Rascunho" da ata | Evita validar valores ainda não definitivos | Auditores, conselho fiscal, condóminos | Baixo — CSS/classe condicional | Nenhuma |
| **F11** — filtro por data em `/auditoria` | Supervisão e conferência de contas mais rápidas | Supervisores, contabilistas, auditores | Baixo/Médio — `WHERE` + 2 campos de data | Nenhuma |
| **F14** — mover aviso de dupla leitura para fora do disclosure | Reduz risco de duas vozes simultâneas para quem usa NVDA/VoiceOver | Utilizadores cegos que também usam "Ler em voz alta" | Muito baixo | Nenhuma |
| **F15** — resumo textual antes de tabelas financeiras densas | Reduz carga cognitiva para leitor de ecrã | Utilizadores cegos, baixa visão | Baixo | Nenhuma |
| **F16** — heading semântico a agrupar os cartões do painel | Melhora navegação por NVDA | Utilizadores de leitor de ecrã | Muito baixo | Nenhuma |
| **F17** — tooltip/`title` em termos técnicos (ex. permilagem) fora de `/ajuda` | Reduz dependência de ir a outra página | Utilizadores com português não nativo, baixa literacia | Muito baixo — reaproveita texto já escrito em `secoes.tsx` | Nenhuma |
| **F18** — `aria-label` de agrupamento nos resultados de votação | Contexto mais claro por NVDA | Utilizadores cegos | Muito baixo | Nenhuma |
| **F19** — remover `aria-pressed` incorreto dos botões de leitura em voz alta | Correção semântica, sem impacto funcional | Utilizadores de leitor de ecrã | Muito baixo | Nenhuma |

---

## 3. Melhorias de médio prazo
*Exigem redesenho de fluxo, componente novo, ou decisão de arquitetura — não avançar sem
decisão explícita do utilizador, todas têm impacto em dados/permissões/modelo.*

| Achado | Benefício | Beneficia | Risco mitigado | Esforço | Impacto em dados/permissões |
|---|---|---|---|---|---|
| **F03** — nível de permissão intermédio dentro de `gestor` | Segregação de funções real | Empresas gestoras com colaboradores | Alcance excessivo de contas júnior/comprometidas | Alto — novo enum/lógica de permissões, testar todos os módulos | Sim — altera o modelo de permissões |
| **F04** — suportar um condómino com várias frações no mesmo condomínio | Elimina necessidade de contas múltiplas | Investidores, heranças (senhorios com várias frações) | Confusão/impossibilidade de uso normal | Alto — muda `membro`/índice único, novo seletor de fração | Sim — altera schema |
| **F07** — aviso de dados não guardados ao fechar diálogos | Evita perda de formulários longos | Todos, sobretudo utilizadores com dificuldade de concentração ou tremor | Perda de trabalho por clique acidental | Médio — mudança no componente `Dialog` partilhado, testar em toda a app | Não |
| **F08** — controlo de concorrência em `editarMovimento` | Evita perda silenciosa de edições | Equipas de empresas gestoras | Edição concorrente sobreposta sem aviso | Médio — comparação de `updatedAt`, decidir política de conflito | Não |
| **F13** — mecanismo de acesso convidado, delimitado e temporário | Documentos sensíveis deixam de circular só por email/PDF | Advogados, compradores de fração, DPO | Dados fora de canais controlados | Alto — funcionalidade nova completa | Sim — novo modelo de acesso |

**F20** (portal do fornecedor limitado a orçamentos) não entra aqui — já está registado em
`FUNCTIONAL_GAPS.md`, sem novidade desta simulação.

---

## 4. Validação com utilizadores reais
*Nenhuma simulação técnica substitui isto — ver `USER_PERSONAS.md`.*

- **Teste NVDA já planeado** (`docs/GUIA_TESTE_NVDA.md`, memória
  `teste-nvda-amigo-invisual`) continua a ser a validação mais importante em falta —
  cobre diretamente F05, F14, F15, F16, F18, F19 e o risco geral de "ordem de leitura"
  mencionado em `ACCESSIBILITY_REVIEW.md`.
- **Onboarding para um utilizador sem experiência nenhuma** (persona Rosa Pinto) — o
  ecrã `/onboarding` não foi lido em detalhe nesta simulação; só um teste real (ou, no
  mínimo, uma leitura de código dedicada) confirma se a distinção "criar condomínio" vs.
  "juntar-me a um condomínio existente" é clara para alguém sem contexto.
- **Formulários longos em ecrã pequeno** (ex. "Novo movimento" com ~15 campos possíveis)
  — persona Diogo Pereira (fornecedor, só smartphone) e Hugo Martins — não testado em
  viewport móvel real.
- **Zoom 200%/400% em runtime** — limitação de ferramenta já registada em
  `ACCESSIBILITY_AUDIT.md`; permanece por confirmar visualmente.
- **F02** (indicador de condomínio ativo) — depois de qualquer alteração, validar com um
  utilizador real que gere vários condomínios se o novo destaque é realmente suficiente
  sob pressão de tempo (uma opinião de código não substitui a perceção real de urgência).

---

## Ordem sugerida (não vinculativa)

1. Verificações de código de custo zero (F21, F22).
2. Correções imediatas (F05, F12, F01, F02).
3. Melhorias de curto prazo de esforço muito baixo (F09, F14, F16, F17, F18, F19) —
   podem avançar quase em bloco, mesma sessão.
4. Restantes melhorias de curto prazo (F06, F10, F11, F15).
5. Decisão do utilizador sobre cada melhoria de médio prazo — nenhuma delas deveria
   avançar sem conversa dedicada, dado o impacto em modelo de dados/permissões.
6. Teste NVDA real — pode correr em paralelo com qualquer um dos pontos acima, não
   depende deles.
