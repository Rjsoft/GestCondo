# Achados consolidados — simulação de usabilidade e acessibilidade

**Estado:** consolidação de três simulações técnicas paralelas — não é teste real. Ver
limites em `USER_PERSONAS.md`. **Fontes:** `USABILITY_SIMULATION.md` (13 achados),
`ACCESSIBILITY_REVIEW.md` (4 achados + 1 sem achado negativo), `ROLE_BASED_USAGE_REVIEW.md`
(9 achados). **Data:** 2026-07-31.

Este documento funde os três relatórios, remove duplicados reais (o mesmo problema visto
de ângulos diferentes) e ordena por prioridade. Cada achado preserva a referência à peça
de origem para quem quiser o detalhe completo (passos de reprodução extensos, tabelas de
avaliação por critério).

Durante a consolidação, verifiquei diretamente `lib/contas-financeiras.ts:96-99` para
resolver uma hipótese que ficou em aberto em duas peças (`USABILITY_SIMULATION.md` #7 e
`ROLE_BASED_USAGE_REVIEW.md` AU1 — mensagem de erro ao escrever num exercício financeiro
fechado). **Resultado: não é um achado.** A mensagem é clara e acionável: *"Este exercício
está fechado. Para alterar movimentos deste período, reabra primeiro o exercício e indique
o motivo."* Fica confirmado como boa prática, não entra na lista abaixo.

**Lacuna de cobertura, não corrigida nesta peça:** nenhuma das três simulações reviu de
facto os módulos Documentos (`app/(app)/documentos/page.tsx`, `app/actions/documentos.ts`)
nem Mensagens (`app/(app)/mensagens/page.tsx`, `app/actions/mensagens.ts`) — ver a
correção feita em `USABILITY_SIMULATION.md`. Não tratar a ausência de achados nesses dois
módulos como sinal de que estão bem, apenas como não revistos.

---

## Gravidade Alta (5)

### F01 — Sem deteção de movimento duplicado no momento da criação
- **Origem:** `USABILITY_SIMULATION.md` percurso 3.1 (achado #6).
- **Página/módulo:** `components/financas/novo-movimento-dialog.tsx`,
  `app/actions/financas.ts:748` (`criarMovimento`).
- **Persona:** Carlos Vaz (22, admin substituto, sem contexto do histórico).
- **Tarefa:** registar uma despesa/receita.
- **Observado vs. esperado:** a deteção de duplicados (`lib/inconsistencias.ts:
  detetarMovimentosDuplicados`) só corre depois, no cartão "Verificações" do painel,
  visível só a quem gere e só se visitar o painel — não há aviso no momento de criar o
  movimento.
- **Impacto:** duplicar uma despesa/receita distorce o saldo mostrado a todos os
  condóminos; pode passar semanas sem deteção.
- **Frequência:** ocasional. **Abrangência:** grupo significativo (qualquer perfil de
  gestão). **Tipo:** prevenção de erros / bug funcional (deteção existe, só chega tarde).
- **Recomendação:** aviso não bloqueante no próprio formulário, reaproveitando a lógica já
  existente de `lib/inconsistencias.ts`.
- **Teste de aceitação:** valor+data+categoria/fração iguais a um movimento existente não
  eliminado geram aviso antes de submeter.

### F02 — Indicador de condomínio ativo demasiado discreto para uso intensivo multi-condomínio
- **Origem:** `USABILITY_SIMULATION.md` percurso 1.3 (achado #2) **+**
  `ROLE_BASED_USAGE_REVIEW.md` G1 — mesmo problema, duas peças independentes chegaram à
  mesma conclusão por ângulos diferentes.
- **Página/módulo:** `components/app-shell.tsx:181-190`,
  `components/condominio-selector.tsx:48-59`.
- **Persona:** Sofia Cardoso (19, 18 condomínios), André Lima (13, tremor/só teclado),
  Ricardo Nunes (20, tarefas repetitivas).
- **Tarefa:** trocar de condomínio ativo e confiar que o próximo lançamento vai para o
  condomínio certo.
- **Observado vs. esperado:** o único indicador permanente é texto `text-xs`,
  `text-sidebar-foreground/60`, só na barra lateral; a confirmação da troca é um `toast`
  transitório. Nada no corpo da página, formulários ou cabeçalhos de Finanças/Avisos
  repete o condomínio ativo.
- **Impacto:** lançar uma despesa, publicar um aviso ou criar uma assembleia no
  condomínio errado — erro financeiro/comunicacional real.
- **Frequência:** ocasional a frequente (proporcional ao nº de condomínios geridos).
  **Abrangência:** perfil específico (empresas gestoras multi-condomínio), impacto
  financeiro real quando ocorre. **Tipo:** prevenção de erros / usabilidade.
- **Recomendação:** repetir o nome do condomínio ativo, com mais destaque, no cabeçalho
  de páginas que gravam dados (Finanças, Avisos, Assembleias, Documentos); toast de
  confirmação explícito ("Agora a trabalhar em: X") ao trocar.
- **Teste de aceitação:** o nome do condomínio ativo é visível, com destaque, ao abrir
  qualquer formulário de criação/edição, sem olhar para a barra lateral; a troca produz
  um toast nomeando o condomínio.

### F03 — Papel "gestor" sem segregação entre colaborador operacional e gestor/admin completo
- **Origem:** `ROLE_BASED_USAGE_REVIEW.md` G2.
- **Página/módulo:** `lib/perfis.ts:26-41,54,96-98` (`PERFIS_GESTAO`,
  `temPermissaoGestao`).
- **Persona:** Ricardo Nunes (20, colaborador operacional), Ana Beatriz Teixeira (21,
  supervisora), Sofia Cardoso (19, gestora principal).
- **Tarefa:** segregação de funções — um colaborador que só devia registar
  documentos/despesas/ocorrências não devia poder alterar dados do condomínio, membros
  ou fornecedores.
- **Observado vs. esperado:** qualquer conta com perfil `gestor` tem exatamente os mesmos
  poderes de escrita em qualquer módulo — não existe nível intermédio.
- **Impacto:** um colaborador júnior com conta comprometida ou erro humano tem alcance
  total sobre o condomínio; `registarAuditoria` mitiga só a posteriori (deteção, não
  prevenção).
- **Frequência:** estrutural. **Abrangência:** grupo significativo (qualquer empresa
  gestora com colaboradores). **Tipo:** falta de funcionalidade / permissões.
- **Recomendação:** avaliar um nível de permissão adicional dentro de `gestor` —
  redesenho de médio prazo, não implementar sem decisão explícita do utilizador (afeta
  modelo de permissões).
- **Teste de aceitação:** N/A nesta fase — funcionalidade a desenhar, não a corrigir.

### F04 — Modelo de dados não suporta um condómino com várias frações no mesmo condomínio
- **Origem:** `USABILITY_SIMULATION.md` percurso 2.1 (achado #5, ali classificado como
  hipótese não confirmada) **confirmado** por `ROLE_BASED_USAGE_REVIEW.md` C1, que leu
  diretamente o índice único `membro_user_condominio_idx` em `(userId, condominioId)`
  (`lib/db/schema.ts:206`) e o campo singular `membro.fracaoId` (linha 189).
- **Persona:** Sandra Melo (5, senhoria com 3 frações), Vítor Almeida (15, condómino com
  2 frações).
- **Tarefa:** consultar/gerir a situação financeira de mais do que uma fração própria
  sob uma única conta.
- **Observado vs. esperado:** uma conta (`userId`) só pode ter uma linha `membro` por
  condomínio, ligada a uma fração; não há forma de ser simultaneamente "condómino da
  fração A" e "da fração B" sob a mesma conta. O único contorno é criar uma segunda conta
  (email diferente), o que quebra a experiência de "ver tudo num sítio".
- **Impacto:** cenário comum em condomínios reais (investidores, heranças) sem solução
  razoável na aplicação hoje.
- **Frequência:** ocasional. **Abrangência:** perfil específico. **Tipo:** falta de
  funcionalidade (limitação de esquema, não bug).
- **Recomendação:** registar como decisão de arquitetura a avaliar (permitir várias
  linhas `membro` por conta+condomínio, cada uma com a sua fração, com seletor de fração
  equivalente ao seletor de condomínio já existente) — redesenho de médio prazo.
- **Teste de aceitação:** um `userId` consegue ter duas linhas `membro` aprovadas no
  mesmo `condominioId`, cada uma ligada a uma fração diferente, com UI para alternar sem
  ambiguidade.

### F05 — Deliberação de assembleia registada sem confirmação
- **Origem:** `ACCESSIBILITY_REVIEW.md` AR1.
- **Página/módulo:** `app/(app)/assembleias/[id]/page.tsx`,
  `components/assembleias/resultado-botoes.tsx:20-42`.
- **Persona:** Rui Antunes (7, cego, NVDA+teclado); também André Lima (13, tremor) e
  qualquer administrador sob pressão de tempo numa assembleia ao vivo.
- **Tarefa:** registar o resultado de uma deliberação (Aprovar/Reprovar/Adiar).
- **Observado vs. esperado:** a ação (`definirResultadoPonto`) executa imediatamente ao
  `Enter`/clique, sem `ConfirmDialog` nem `role="group"`/`aria-label` a agrupar os três
  botões semanticamente relacionados — ao contrário da convenção documentada no próprio
  `CLAUDE.md` do projeto ("Ações destrutivas usam `confirm-dialog.tsx` antes de chamar a
  server action"). **Confirmado adicionalmente:** os três botões só existem no DOM
  enquanto o ponto não tiver resultado (`{!p.resultado && <ResultadoBotoesClient .../>}`,
  `app/(app)/assembleias/[id]/page.tsx:273`) e não há nenhuma outra função em
  `app/actions/assembleias.ts` que volte a escrever `resultado` a partir da UI — não
  existe, portanto, o cenário "mudar uma decisão já tomada"; depois de um clique, os
  botões desaparecem e ficam substituídos por um badge fixo.
- **Impacto:** um clique/Enter em falso (plausível em navegação só por teclado, sob
  pressão de tempo, ou ao ativar por engano o botão vizinho sem agrupamento semântico)
  regista um resultado de deliberação errado, com efeito legal potencial, sem aviso — e,
  ao contrário de uma versão anterior deste achado, **não há forma de o corrigir pela
  interface depois**, só através de intervenção direta na base de dados.
- **Frequência:** ocasional (só durante assembleias). **Abrangência:** perfil específico,
  impacto legal/documental relevante. **Tipo:** prevenção de erros / acessibilidade.
- **Recomendação:** exigir confirmação (`ConfirmDialog` ou equivalente) antes do único
  clique que regista o resultado, já que não há correção possível depois; acrescentar uma
  forma de corrigir um resultado já registado (ex. botão "Corrigir" visível a admin
  enquanto o ponto continuar editável) — hoje essa capacidade não existe; agrupar os três
  botões com `role="group" aria-label="Resultado da deliberação"`.
- **Teste de aceitação:** com NVDA e só teclado, registar um resultado pede confirmação
  explícita antes de gravar, e existe uma forma de o corrigir depois sem intervenção
  direta na base de dados.

---

## Gravidade Média (10)

### F06 — Painel inicial não sinaliza pendências nem urgência para um administrador sem contexto
- **Origem:** `USABILITY_SIMULATION.md` percurso 1.2 (achado #1) **+**
  `ROLE_BASED_USAGE_REVIEW.md` A1 — mesma área do painel, duas facetas do mesmo problema.
- **Página/módulo:** `app/(app)/page.tsx:130-271`.
- **Persona:** Carlos Vaz (22, administrador substituto temporário).
- **Observado vs. esperado:** o painel mostra saldo, receitas/despesas, ocorrências e
  avisos recentes, e (condicional) o cartão "Verificações" — mas **não** mostra pedidos
  de acesso pendentes (`membro.estado='pendente'`, só visível em `/condominos`) nem
  assembleias próximas/marcadas, e não distingue "urgente" de "informativo" fora do badge
  de prioridade em cada item.
- **Impacto:** um administrador novo no condomínio pode passar a substituição inteira sem
  saber que há um condómino à espera de aprovação há semanas, ou sem perceber o que é
  realmente urgente no meio de itens rotineiros.
- **Frequência:** rara (afeta sobretudo quem entra pela primeira vez ou raramente).
  **Abrangência:** perfil específico. **Tipo:** usabilidade.
- **Recomendação:** adicionar ao painel, condicional a `temPermissaoGestao`, uma
  contagem/link para pedidos de acesso pendentes e para a próxima assembleia agendada
  (reaproveitando o padrão do cartão "Verificações").
- **Teste de aceitação:** com 1+ `membro.estado='pendente'`, o painel mostra um indicador
  visível e um link direto para `/condominos`.

### F07 — Diálogos fecham sem aviso de dados não guardados (padrão sistémico)
- **Origem:** `USABILITY_SIMULATION.md` percurso 3.4 (achado #8) — identificado como
  achado transversal candidato, confirmado aqui como sistémico (componente `Dialog`
  partilhado por toda a app, não específico de Finanças).
- **Página/módulo:** componente `Dialog` (base-ui) em geral; ilustrado em
  `components/financas/novo-movimento-dialog.tsx` (~15 campos possíveis).
- **Persona:** Vítor Almeida (15, dificuldade de concentração), André Lima (13, tremor —
  pode ativar um clique fora do diálogo sem intenção).
- **Observado vs. esperado:** `onOpenChange` fecha com Escape/clique fora sem verificar
  campos preenchidos nem pedir confirmação.
- **Impacto:** perda de um formulário longo por um clique acidental.
- **Frequência:** ocasional. **Abrangência:** todos os utilizadores (qualquer diálogo com
  formulário longo). **Tipo:** prevenção de erros.
- **Recomendação:** confirmar antes de fechar quando há campos preenchidos e não
  guardados — melhoria transversal ao componente `Dialog`, não módulo a módulo.
- **Teste de aceitação:** fechar um diálogo com campos preenchidos por Escape/clique fora
  pede confirmação.

### F08 — Edição concorrente do mesmo movimento sem controlo nem aviso
- **Origem:** `USABILITY_SIMULATION.md` percurso 3.4 (achado #9).
- **Página/módulo:** `app/actions/financas.ts:867+` (`editarMovimento`).
- **Persona:** equipas de empresas gestoras com vários colaboradores no mesmo condomínio
  (13, 19, 20, 21).
- **Observado vs. esperado:** sem comparação de versão/`updatedAt` antes do `UPDATE` — a
  última escrita ganha silenciosamente, sem avisar quem perdeu a sua alteração.
- **Impacto:** perda silenciosa de uma edição.
- **Frequência:** rara. **Abrangência:** grupo específico (equipas). **Tipo:** prevenção
  de erros.
- **Recomendação:** melhoria de médio prazo — controlo otimista de concorrência
  (comparar `updatedAt`) nas escritas financeiras mais editadas.
- **Teste de aceitação:** duas edições concorrentes ao mesmo movimento produzem aviso de
  conflito em vez de sobreposição silenciosa.

### F09 — Campo "voto" pré-selecionado em "A favor"
- **Origem:** `USABILITY_SIMULATION.md` percurso 4.2 (achado #10).
- **Página/módulo:** `components/assembleias/registar-voto-dialog.tsx:44`.
- **Persona:** qualquer administrador a registar votos em série num ponto polémico.
- **Observado vs. esperado:** o diálogo abre sempre com `voto = 'favor'`; em registo
  rápido de vários votos, é fisicamente fácil confirmar sem mudar o valor, registando por
  engano "favor" em vez do voto pretendido. Mitigado por: totais visíveis que atualizam
  logo a seguir, e correção possível sem duplicar (`onConflictDoUpdate`).
- **Impacto:** numa deliberação que exige unanimidade, um único voto mal registado muda o
  resultado legal.
- **Frequência:** ocasional. **Abrangência:** perfil específico (quem regista votos).
  **Tipo:** prevenção de erros.
- **Recomendação:** não pré-selecionar valor (exigir escolha explícita), ou mostrar de
  forma mais visível quantos votos já foram registados para aquele ponto.
- **Teste de aceitação:** o campo "voto" não tem valor por omissão.

### F10 — Ata "Rascunho — ainda não aprovada" pouco destacada visualmente
- **Origem:** `ROLE_BASED_USAGE_REVIEW.md` C2.
- **Página/módulo:** `app/(app)/assembleias/ata/[id]/page.tsx:60-69`.
- **Persona:** Miguel Fonseca (25, conselho fiscal).
- **Observado vs. esperado:** o aviso é um único badge pequeno no topo; o resto do
  conteúdo (presenças, deliberações, valores) tem exatamente o mesmo aspeto de uma ata
  final.
- **Impacto:** validação de um valor que ainda pode mudar.
- **Frequência:** ocasional (só entre a assembleia e a aprovação formal da ata).
  **Abrangência:** grupo significativo (qualquer condómino/auditor que consulte atas
  recentes). **Tipo:** usabilidade / prevenção de erros.
- **Recomendação:** reforço visual mais forte (ex. marca d'água ou fundo diferenciado em
  toda a área do conteúdo).
- **Teste de aceitação:** o estado de rascunho é identificável só pelo aspeto geral da
  página, sem precisar de ler o badge.

### F11 — `/auditoria` sem filtro por período nem por autor
- **Origem:** `ROLE_BASED_USAGE_REVIEW.md` G3 (aplica-se também ao grupo Auditores).
- **Página/módulo:** `app/actions/auditoria.ts:10-36` (`getAuditLog`),
  `app/(app)/auditoria/page.tsx:82-84`.
- **Persona:** Ana Beatriz Teixeira (21), Teresa Vieira (26), Miguel Fonseca (25).
- **Observado vs. esperado:** só existe pesquisa de texto livre (`search`); sem
  intervalo de datas nem filtro estruturado por autor/entidade/ação.
- **Impacto:** supervisão e conferência de contas mais lentas, propensas a saltar
  registos relevantes.
- **Frequência:** frequente (para quem audita/supervisiona regularmente). **Abrangência:**
  perfil específico. **Tipo:** falta de funcionalidade.
- **Recomendação:** adicionar filtro por intervalo de datas — mudança pequena e
  localizada (WHERE adicional + dois campos de data na UI), sem alterar o modelo de
  dados.
- **Teste de aceitação:** é possível filtrar `/auditoria` por um intervalo de datas.

### F12 — Um fornecedor vê a lista completa dos outros fornecedores do condomínio
- **Origem:** `ROLE_BASED_USAGE_REVIEW.md` F1.
- **Página/módulo:** `app/actions/fornecedores.ts:10-17` (`getFornecedores`),
  `components/fornecedores/fornecedores-tabs.tsx:106-185`.
- **Persona:** Manuel Costa (23), Cristina Alves (24), Diogo Pereira (11).
- **Observado vs. esperado:** `getFornecedores()` usa só `requireMembroPagina()` —
  qualquer membro aprovado, incluindo perfil `fornecedor`, recebe nome, categoria,
  contacto e NIF de todos os outros fornecedores do condomínio; a UI só esconde as ações
  de edição, não os dados em si. Inclui também o campo `notas` (texto livre da
  administração sobre o fornecedor, `fornecedores-tabs.tsx:139-141`), visível a qualquer
  fornecedor, não só ao próprio a quem a nota se refere.
- **Impacto:** exposição de dados comerciais de terceiros (incluindo concorrentes
  diretos) a uma contraparte externa ao condomínio.
- **Frequência:** frequente (qualquer visita de um fornecedor a `/fornecedores`).
  **Abrangência:** perfil específico (todos os fornecedores com conta). **Tipo:**
  permissões / privacidade.
- **Recomendação:** esconder o separador "Fornecedores" (ou filtrar para mostrar só a
  própria ficha) quando `isFornecedor` é verdadeiro.
- **Teste de aceitação:** uma conta `fornecedor` deixa de ver dados de outros
  fornecedores em `/fornecedores`.

### F13 — Sem mecanismo de acesso convidado, delimitado e temporário
- **Origem:** `ROLE_BASED_USAGE_REVIEW.md` O1.
- **Página/módulo:** modelo de permissões completo (`lib/perfis.ts`, `lib/session.ts`) —
  ausência transversal.
- **Persona:** Filipa Ramos (28, advogada), Duarte Pinho (29, candidato a comprar
  fração), Bruno Cabral (27, DPO, parcialmente).
- **Observado vs. esperado:** todos os 6 papéis pressupõem uma linha `membro` completa e
  aprovada; não há partilha pontual de um documento/registo com alguém fora desse
  modelo.
- **Impacto:** hoje resolvido por fora da app (email, PDF) — não é falha de segurança em
  si, mas empurra dados sensíveis para canais menos controlados, sem a proveniência que a
  app poderia garantir.
- **Frequência:** ocasional (venda de frações, litígios). **Abrangência:** caso
  específico, recorrente ao longo da vida de um condomínio. **Tipo:** falta de
  funcionalidade.
- **Recomendação:** registar como funcionalidade futura a desenhar; não implementar sem
  decisão explícita (afeta modelo de permissões e segurança).
- **Teste de aceitação:** N/A nesta fase.

### F14 — Risco de dupla leitura entre "Ler em voz alta" e um leitor de ecrã real
- **Origem:** `ACCESSIBILITY_REVIEW.md` AR3.
- **Página/módulo:** `components/leitura-voz/leitura-voz-controls.tsx:144-149`.
- **Persona:** Rui Antunes (7), Carla Nogueira (8).
- **Observado vs. esperado:** existe aviso textual claro, mas dentro de um `Collapsible`
  fechado por omissão; sem deteção automática de leitor de ecrã ativo (tecnicamente não
  fiável a partir de JavaScript).
- **Impacto:** um utilizador NVDA que clique em "Ler esta secção" sem abrir o disclosure
  ouve duas vozes simultâneas — risco de descoberta acidental, não de comportamento
  automático intrusivo (ação sempre explícita).
- **Frequência:** depende do utilizador (só quem usa NVDA/VoiceOver e decide clicar).
  **Abrangência:** perfil específico. **Tipo:** acessibilidade.
- **Recomendação:** mover a frase de aviso para fora do disclosure (texto sempre visível,
  pequeno, acima do botão) — melhoria de descoberta, não correção urgente.
- **Teste de aceitação:** só um teste real com utilizador NVDA confirma se a nova
  colocação é suficiente — candidato a `docs/GUIA_TESTE_NVDA.md`.

### F15 — Tabelas financeiras densas sem resumo/orientação prévia para leitor de ecrã
- **Origem:** `ACCESSIBILITY_REVIEW.md` AR4.
- **Página/módulo:** `app/(app)/financas/page.tsx` (movimentos, mapa de saldos, mapa
  mensal, dívidas).
- **Persona:** Rui Antunes (7), Carla Nogueira (8), Fernando Sousa (9, zoom).
- **Observado vs. esperado:** associação cabeçalho↔célula está tecnicamente correta, mas
  não há resumo textual antes de cada tabela densa (ex. "12 movimentos, total
  1.250,00€").
- **Impacto:** aumenta carga cognitiva e tempo para perceber a dimensão da tabela antes
  de explorar célula a célula.
- **Frequência:** frequente (Finanças é módulo central). **Abrangência:** perfil
  específico. **Tipo:** acessibilidade.
- **Recomendação:** acrescentar frase de resumo antes das tabelas mais densas — melhoria
  de curto prazo, não crítica.
- **Teste de aceitação:** N/A formal — validação por teste real com leitor de ecrã.

---

## Gravidade Baixa (5)

### F16 — Cartões do painel sem heading semântico a agrupá-los
`app/(app)/page.tsx`. Persona Rui Antunes (7). Leitura sequencial funciona, mas falta um
`h2` "Resumo financeiro" a anunciar o bloco de 4 números antes deles. *(`USABILITY_SIMULATION.md` #3)*

### F17 — Termos técnicos (ex. "permilagem") sem explicação contextual fora de `/ajuda`
`app/(app)/page.tsx:182-186`. Personas Yulia Kovalenko (16), Hugo Martins (18). Já
existe definição pronta em `components/ajuda/secoes.tsx` — falta só um `title`/tooltip
junto ao valor. *(`USABILITY_SIMULATION.md` #4)*

### F18 — Blocos de resultado de votação sem `aria-label` de agrupamento
`app/(app)/assembleias/[id]/page.tsx:251-268`. Persona Rui Antunes (7). Legível
sequencialmente por NVDA, mas sem identificar o grupo como "resultados da votação para o
ponto X". *(`USABILITY_SIMULATION.md` #11 — distinto de F05/AR1, que é sobre os botões de
decisão, não a exibição dos resultados.)*

### F19 — `aria-pressed` usado incorretamente nos controlos de "Ler em voz alta"
`components/leitura-voz/leitura-voz-controls.tsx:63,69,75`. Três botões diferentes
(renderização condicional), não um único botão de alternância — o atributo não comunica o
que deveria. Não bloqueia a tarefa (o texto do botão já muda). *(`ACCESSIBILITY_REVIEW.md`
AR2)*

### F20 — Portal do fornecedor limitado a "orçamentos de obra", sem acompanhamento mais
amplo de ocorrências atribuídas
`lib/db/schema.ts:192-199` (comentário já documenta isto como trabalho futuro). Gap já
conhecido e registado em `FUNCTIONAL_GAPS.md` — sem novidade, não requer ação adicional
aqui. *(`ROLE_BASED_USAGE_REVIEW.md` F2)*

---

## Não verificado / requer confirmação direta (2)

### F21 — Bloqueio de edição de assembleia aprovada: confirmado só na UI, não no servidor
A UI esconde os diálogos de edição quando `estado === 'aprovada'`
(`assembleias/[id]/page.tsx:67`), mas não foi confirmado se a Server Action
correspondente também recusa a escrita (defesa em profundidade). Ficheiro a verificar:
`app/actions/assembleias.ts` (ações de edição, não lidas integralmente em nenhuma das
três peças). *(`USABILITY_SIMULATION.md` #12)*

### F22 — `AssembleiaActions` (cancelar assembleia) não revisto quanto ao uso de `ConfirmDialog`
Nenhuma das três peças leu este componente em detalhe. *(`USABILITY_SIMULATION.md` #13)*

---

## Resumo por gravidade

| Gravidade | Nº de achados |
|---|---|
| Alta | 5 (F01-F05) |
| Média | 10 (F06-F15) |
| Baixa | 5 (F16-F20) |
| Não verificado | 2 (F21-F22) |
| **Total** | **22** |

Acrescido de: 1 verificação feita durante a consolidação que **não** confirmou problema
(mensagem de `garantirExercicioAberto`, já clara) e 1 secção sem achado negativo (pessoas
surdas — AR5, sem conteúdo multimédia nem dependência de som identificada no código).
