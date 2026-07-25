# Revisão dos Termos de Utilização — GestCondo

Data: 2026-07-22. Analisa `app/termos/page.tsx` contra a checklist da secção 6 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. **Atualização 2026-07-22 (mesmo dia, sessão seguinte): a maioria das alterações da secção 4 foi aplicada à página**, com autorização expressa do utilizador. **Atualização 2026-07-25: TU-1 e TU-5 resolvidos** — identidade do operador (RJCSI - Serviços Informáticos, Unipessoal, Lda., NIF 510666540) preenchida na página, e o foro competente confirmado (Comarca de Lisboa Oeste, secção de Amadora, verificado em fontes do CSM/portal das comarcas). Fica por resolver TU-7 (classificação B2B/B2C/misto, precisa de confirmação jurídica, não aplicada por prudência) — **análise preliminar registada 2026-07-25, ver secção 6**, para servir de ponto de partida a essa consulta.

## 1. O que já está bem resolvido

Objeto (secção 1), contas/credenciais/perfis (secção 2), exatidão dos dados e o que a auditoria interna cobre (secção 3), limitação de responsabilidade razoável sem prometer disponibilidade absoluta (secção 4), cláusula de alterações (secção 5).

## 2. Gaps encontrados

| # | Gap | Estado |
|---|---|---|
| TU-1 | Sem identificação da entidade (nome/NIF do operador da plataforma) | ✅ **Resolvido 2026-07-25** — RJCSI - Serviços Informáticos, Unipessoal, Lda., NIF 510666540, Rua Estêvão de Vasconcelos, 18 R/C-DTO, 2700-351 Amadora |
| TU-2 | Sem cláusula de propriedade intelectual | ✅ Resolvido — secção 4 |
| TU-3 | Sem cláusula sobre documentos carregados | ✅ Resolvido — secção 4 (mesma cláusula de propriedade intelectual) |
| TU-4 | Sem menção a pagamentos/faturação/cancelamento | ✅ Resolvido para o estado atual — secção 1 declara expressamente "piloto gratuito, sem modelo de pagamento definido"; cláusulas de faturação/renovação/cancelamento ficam para quando existir um modelo pago real (confirmado pelo utilizador que ainda não há) |
| TU-5 | Sem cláusula de lei aplicável nem foro competente | ✅ **Resolvido 2026-07-25** — secção 8 fixa a lei portuguesa e a Comarca de Lisboa Oeste (secção de Amadora), confirmada em fontes do CSM/portal das comarcas |
| TU-6 | Sem menção a RAL/ODR | ✅ Resolvido — secção 8, com entidades genéricas (portal do consumidor, plataforma ODR europeia), sem comprometer-se com uma entidade de RAL setorial específica |
| TU-7 | Não define se o modelo é B2B, B2C ou misto | ❌ **Não aplicado deliberadamente** — precisa de confirmação jurídica que não posso dar; escrever uma classificação errada seria pior do que não escrever nenhuma. Análise preliminar em secção 6 |
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

- Identidade/NIF da entidade (TU-1) e foro competente (TU-5) — **ambos resolvidos 2026-07-25**: RJCSI - Serviços Informáticos, Unipessoal, Lda., NIF 510666540, Comarca de Lisboa Oeste (secção de Amadora).
- Classificação B2B/B2C/misto (TU-7) — decisão que precisa de confirmação jurídica, não escrita por prudência. É a única dúvida desta revisão que continua por resolver — ver análise preliminar na secção 6.

## 6. Análise preliminar de TU-7 (2026-07-25) — não é uma decisão, é ponto de partida para consulta jurídica

Dois factos verificados na fonte (não de memória), para dar contexto a uma futura consulta jurídica rápida e barata, em vez de uma auditoria extensa:

**Facto 1 — definição legal de "consumidor" (Lei n.º 24/96, Lei de Defesa do Consumidor)**: um consumidor é sempre uma **pessoa singular**, a quem são fornecidos bens/serviços para uso não profissional, por quem exerce uma atividade económica com caráter profissional. A doutrina (ver fontes) confirma que pessoas coletivas não se enquadram nesta definição, porque existem para prosseguir um fim próprio (económico, social, etc.).

**Facto 2 — estatuto jurídico do condomínio (Código Civil art. 1437º e jurisprudência)**: o condomínio **não tem personalidade jurídica plena** (não é uma "pessoa coletiva" como uma empresa), mas tem **personalidade/capacidade judiciária** — pode agir em juízo, sempre representado pelo administrador. É descrito na jurisprudência como um "centro autónomo de imputação de efeitos jurídicos" sem personalidade jurídica — um estatuto sui generis, a meio caminho entre pessoa singular e pessoa coletiva.

**Leitura preliminar, explicitamente não uma conclusão jurídica**: o condomínio não é uma pessoa singular (não se enquadra na definição clássica de consumidor da Lei 24/96), mas também não é uma pessoa coletiva normal como uma empresa — não há enquadramento óbvio para nenhum dos dois lados. Tende mais para **B2B** (ou "não-consumidor") do que para B2C, por faltar o requisito central de "pessoa singular fora do âmbito profissional". Há, no entanto, uma nuance real: quem assina o contrato é o administrador, que pode ser um simples condómino, pessoa singular, a título não profissional — o que pode reabrir a discussão consoante como o Contrato SaaS definir exatamente quem é "o Cliente" (o condomínio enquanto tal, ou o administrador em nome pessoal).

**Pergunta concreta a colocar ao advogado**, já suficientemente delimitada para não precisar de uma auditoria extensa: *"Um condomínio, representado pelo seu administrador eleito, ao contratar um SaaS de gestão condominial, é B2B, B2C ou algo à parte, para efeitos da Lei 24/96 e do DL 24/2014 (contratos à distância)?"*

**Fontes consultadas 2026-07-25**:
- [Lei de Defesa do Consumidor (Lei n.º 24/96)](https://ciab.pt/wp-content/uploads/2024/01/Lei-de-Defesa-do-Consumidor.pdf)
- [Quem é consumidor? — noção jurídica de consumidor na Lei nº 24/96](https://idconsumo.pt/wp-content/uploads/2024/09/2023Gestin25art041.pdf)
- [Artigo 1437º CC — Representação do condomínio em juízo](https://informador.pt/legislacao/lexit/codigos/direito-civil/codigo-civil/livro-iii-direito-das-coisas/titulo-ii-do-direito-de-propriedade/subtitulo-iv-do-exercicio-e-tutela-dos-direitos-5/capitulo-vi-propriedade-horizontal/seccao-iv-administracao-das-partes-comuns-do-edificio/artigo-1437-o-legitimidade-do-administrador/)
