# Revisão dos Termos de Utilização — GestCondo

Data: 2026-07-22. Analisa `app/termos/page.tsx` contra a checklist da secção 6 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. **Atualização 2026-07-22 (mesmo dia, sessão seguinte): a maioria das alterações da secção 4 foi aplicada à página**, com autorização expressa do utilizador. Ficam por resolver TU-1 (identidade/foro, decisão pendente do utilizador) e TU-7 (classificação B2B/B2C/misto, precisa de confirmação jurídica, não aplicada por prudência).

## 1. O que já está bem resolvido

Objeto (secção 1), contas/credenciais/perfis (secção 2), exatidão dos dados e o que a auditoria interna cobre (secção 3), limitação de responsabilidade razoável sem prometer disponibilidade absoluta (secção 4), cláusula de alterações (secção 5).

## 2. Gaps encontrados

| # | Gap | Estado |
|---|---|---|
| TU-1 | Sem identificação da entidade (nome/NIF do operador da plataforma) | ❌ **Aberto** — depende de decisão do utilizador; placeholder `[A preencher]` visível no topo da página |
| TU-2 | Sem cláusula de propriedade intelectual | ✅ Resolvido — secção 4 |
| TU-3 | Sem cláusula sobre documentos carregados | ✅ Resolvido — secção 4 (mesma cláusula de propriedade intelectual) |
| TU-4 | Sem menção a pagamentos/faturação/cancelamento | ✅ Resolvido para o estado atual — secção 1 declara expressamente "piloto gratuito, sem modelo de pagamento definido"; cláusulas de faturação/renovação/cancelamento ficam para quando existir um modelo pago real (confirmado pelo utilizador que ainda não há) |
| TU-5 | Sem cláusula de lei aplicável nem foro competente | 🟡 Parcialmente resolvido — secção 8 fixa a lei portuguesa; o foro exato depende da sede do operador, ainda por definir (mesmo placeholder de TU-1) |
| TU-6 | Sem menção a RAL/ODR | ✅ Resolvido — secção 8, com entidades genéricas (portal do consumidor, plataforma ODR europeia), sem comprometer-se com uma entidade de RAL setorial específica |
| TU-7 | Não define se o modelo é B2B, B2C ou misto | ❌ **Não aplicado deliberadamente** — precisa de confirmação jurídica que não posso dar; escrever uma classificação errada seria pior do que não escrever nenhuma |
| TU-8 | Sem cláusula sobre utilização proibida | ✅ Resolvido — secção 3 |
| TU-9 | Sem cláusula sobre representação do condomínio | ✅ Resolvido — secção 2 (declaração de legitimidade ao criar um condomínio) |
| TU-10 | Sem cláusula sobre exportação/eliminação de dados no fim da relação | ✅ Resolvido — secção 7 |
| TU-11 | Sem cláusula de força maior nem de notificações formais | ✅ Resolvido — secção 9 |
| TU-12 | Data da versão desatualizada | ✅ Resolvido — atualizada para 22 de julho de 2026 |

## 3. Achado adicional relevante (não da checklist, mas descoberto ao rever TU-9)

**`criarCondominio` (`app/actions/condominio.ts`) não verifica que quem cria o condomínio tem legitimidade para o representar** — qualquer conta autenticada pode criar um condomínio e tornar-se automaticamente o seu `admin`. Continua a ser uma decisão de produto deliberada (onboarding sem fricção), não alterada tecnicamente; os Termos de Utilização passaram a declarar (secção 2) que **quem cria o condomínio garante essa legitimidade**, transferindo o risco contratual para quem afirmar falsamente representar um condomínio.

## 4. Alterações aplicadas 2026-07-22

Todos os itens marcados ✅ acima foram fechados diretamente em `app/termos/page.tsx`, com autorização expressa do utilizador. A página cresceu de 5 para 10 secções.

## 5. Dúvidas que não posso resolver sozinho

- Identidade/NIF da entidade a publicar e o foro exato (TU-1/TU-5, igual a PP-1) — perguntado diretamente em 2026-07-22, o utilizador respondeu "ainda não decidido"/"decido depois".
- Classificação B2B/B2C/misto (TU-7) — decisão que precisa de confirmação jurídica, não escrita por prudência.
