# Revisão de uso por perfil funcional

**Estado:** simulação técnica baseada em código real (leitura de rotas, server actions,
schema e componentes) + personas de `USER_PERSONAS.md` — não é teste real com
utilizadores. Ver limites completos em `USER_PERSONAS.md`. **Data:** 2026-07-31.

Base de permissões usada (`lib/perfis.ts`): papéis `admin`, `gestor`, `condomino`,
`inquilino`, `fornecedor`, `auditor`; `isSuperAdmin`/`isOperadorPlataforma` ortogonais.
Um `membro` pertence a 1 condomínio e no máximo 1 fração (`membro.fracaoId`), com índice
único `membro_user_condominio_idx` em `(userId, condominioId)` (`lib/db/schema.ts:206`).

---

## Condóminos

### Achado C1 — modelo não suporta um condómino com várias frações no mesmo condomínio
- **Página/módulo:** `lib/db/schema.ts:172-211` (`membro`), toda a área de Condóminos/Finanças.
- **Persona afetada:** Sandra Melo (5, senhoria com 3 frações), Vítor Almeida (15,
  condómino com 2 frações).
- **Tarefa:** consultar/gerir a situação financeira de mais do que uma fração própria
  sob uma única conta.
- **Passos para reproduzir:** ler `membro_user_condominio_idx` (`lib/db/schema.ts:206`,
  índice único em `userId`+`condominioId`) e `membro.fracaoId` (linha 189, campo
  singular). Uma conta (`userId`) só pode ter **uma** linha `membro` por condomínio, e
  essa linha só aponta para **uma** fração.
- **Comportamento observado:** não há forma, dentro do modelo de dados atual, de uma
  mesma conta ser simultaneamente "condómino da fração A" e "condómino da fração B" no
  mesmo condomínio. O único contorno seria criar uma segunda conta (email diferente),
  o que quebra a experiência de "ver tudo num sítio".
- **Comportamento esperado:** a persona espera ver a situação financeira consolidada de
  todas as frações que possui no mesmo condomínio, numa única sessão.
- **Impacto:** confusão, necessidade de contas múltiplas, ou simplesmente impossibilidade
  de usar a app como seria de esperar — cenário comum em condomínios reais (investidores,
  heranças).
- **Gravidade:** Alto (afeta diretamente a tarefa central da persona, sem contorno
  razoável) — **Tipo: falta de funcionalidade** (limitação do esquema, não bug).
- **Frequência:** ocasional (nem todo condómino tem várias frações, mas é um caso comum
  o suficiente para aparecer em condomínios reais).
- **Abrangência:** perfil específico.
- **Recomendação:** não implementar agora — registar como decisão de arquitetura a
  avaliar (permitir várias linhas `membro` por conta+condomínio, cada uma com a sua
  fração, com um seletor de fração equivalente ao seletor de condomínio já existente).
- **Teste de aceitação proposto:** um `userId` consegue ter duas linhas `membro`
  aprovadas no mesmo `condominioId`, cada uma ligada a uma fração diferente, e a UI
  permite alternar entre elas sem ambiguidade.

### Achado C2 — "Rascunho — ata ainda não aprovada" pode ser mal interpretado como final
- **Página/módulo:** `app/(app)/assembleias/ata/[id]/page.tsx:60-69`.
- **Persona afetada:** Miguel Fonseca (25, conselho fiscal).
- **Tarefa:** confirmar que as contas apresentadas em assembleia batem certo.
- **Passos para reproduzir:** abrir a ata de uma assembleia cujo `estado !== 'aprovada'`.
- **Comportamento observado:** aparece um badge "Rascunho — ata ainda não aprovada",
  mas o resto do ecrã (presenças, deliberações, valores) tem exatamente o mesmo aspeto
  visual de uma ata final — o aviso é um único badge pequeno no topo.
- **Comportamento esperado:** um utilizador a validar contas rapidamente não deveria
  correr o risco de tratar um rascunho como definitivo.
- **Impacto:** validação de um valor que ainda pode mudar.
- **Gravidade:** Médio.
- **Frequência:** ocasional (só entre a assembleia acontecer e a ata ser formalmente
  aprovada).
- **Abrangência:** grupo significativo (qualquer condómino/auditor que consulte atas
  recentes).
- **Tipo:** usabilidade / prevenção de erros.
- **Recomendação:** reforçar visualmente o estado de rascunho (ex. marca d'água ou
  fundo diferenciado em toda a área do conteúdo, não só um badge).
- **Teste de aceitação proposto:** um utilizador consegue identificar o estado de
  rascunho sem ler o badge, só pelo aspeto geral da página.

---

## Administração

### Achado A1 — painel inicial não distingue "assunto urgente" de "assunto normal" para quem chega de novo
- **Página/módulo:** `app/(app)/page.tsx` (painel).
- **Persona afetada:** Carlos Vaz (22, administrador substituto temporário).
- **Tarefa:** perceber em poucos minutos o que precisa de atenção num condomínio que
  não conhece.
- **Passos para reproduzir:** ler `app/(app)/page.tsx:130-243` — "Avisos recentes" e
  "Ocorrências recentes" mostram sempre os últimos N registos, sem indicar quais são
  realmente urgentes fora do badge de prioridade em cada item.
- **Comportamento observado:** o cartão "Verificações" (linhas 245-271, ligado a
  `getInconsistencias`) é o único destaque de "isto precisa de atenção" — o resto do
  painel é uma lista cronológica neutra.
- **Comportamento esperado:** alguém sem contexto prévio do condomínio precisa de um
  sinal claro do que é urgente vs. informativo.
- **Impacto:** algo urgente pode passar despercebido no meio de itens rotineiros.
- **Gravidade:** Médio.
- **Frequência:** rara (só afeta quem entra pela primeira vez ou raramente).
- **Abrangência:** perfil específico.
- **Tipo:** usabilidade.
- **Recomendação:** nenhuma sugerida nesta fase — sinalizado para avaliação futura.
- **Teste de aceitação proposto:** N/A nesta fase.

---

## Empresas gestoras

### Achado G1 — indicador de condomínio ativo é discreto demais para uso intensivo
- **Página/módulo:** `components/app-shell.tsx:181-190`, `components/condominio-selector.tsx`.
- **Persona afetada:** Sofia Cardoso (19, 18 condomínios), André Lima (13, tremor/só
  teclado, muitos condomínios por dia), Ricardo Nunes (20, tarefas repetitivas).
- **Tarefa:** trocar de condomínio ativo e confiar que qualquer lançamento seguinte vai
  para o condomínio certo.
- **Passos para reproduzir:** ler `components/app-shell.tsx:181-190` — o nome do
  condomínio ativo aparece como texto `text-xs` (12px), cinzento
  (`text-sidebar-foreground/60`), sem cor ou destaque próprio por condomínio. O
  `CondominioSelector` (`components/condominio-selector.tsx:48-59`) é um `<Select>`
  discreto, sem borda (`border-none`), no mesmo estilo visual. Depois de trocar, só há
  um `toast` transitório (linha 37) — nenhuma confirmação persistente no ecrã seguinte
  além desse mesmo texto pequeno.
- **Correção a uma leitura anterior deste achado:** a linha 37 citada acima é
  `toast.error(...)`, disparado **só quando a troca falha** — ao contrário do que "só há
  um toast transitório" podia sugerir, não existe **nenhum** toast de sucesso quando a
  troca funciona (confirmado por leitura direta do ficheiro: o caminho de sucesso é só
  `await definirCondominioAtivo(id); router.refresh()`, sem `toast.success`). Isto torna
  o problema mais grave do que "confirmação transitória a mais": não há confirmação
  alguma além do nome mudar discretamente na barra lateral.
- **Comportamento observado:** o único indicador permanente de "em que condomínio estou"
  é um texto pequeno no canto superior esquerdo da barra lateral — nada no corpo da
  página, nos formulários de lançamento, nem nos cabeçalhos de Finanças/Avisos.
- **Comportamento esperado:** um utilizador que gere muitos condomínios sob pressão de
  tempo precisa de um sinal difícil de ignorar (ex. no cabeçalho da própria página, não
  só na barra lateral) antes de confirmar uma ação que grava dados.
- **Impacto:** lançar uma despesa, publicar um aviso ou criar uma assembleia no
  condomínio errado — erro financeiro/comunicacional real, potencialmente confuso de
  corrigir depois.
- **Gravidade:** Alto (persona sob pressão de tempo + ação financeira + sinal fraco).
- **Frequência:** ocasional a frequente, proporcional ao número de condomínios geridos.
- **Abrangência:** perfil específico (empresas gestoras multi-condomínio), mas com
  impacto financeiro real quando ocorre.
- **Tipo:** prevenção de erros / usabilidade.
- **Recomendação (melhoria de curto prazo):** repetir o nome do condomínio ativo, com
  mais destaque visual, no cabeçalho de páginas onde se grava dados (Finanças, Avisos,
  Assembleias, Documentos) — não só na barra lateral.
- **Teste de aceitação proposto:** ao abrir qualquer formulário de criação/edição, o
  nome do condomínio ativo é visível sem precisar de olhar para a barra lateral.

### Achado G2 — papel "gestor" não distingue colaborador operacional de gestor/admin completo
- **Página/módulo:** `lib/perfis.ts:26-41,54,96-98`.
- **Persona afetada:** Ricardo Nunes (20, colaborador operacional), Ana Beatriz Teixeira
  (21, supervisora), Sofia Cardoso (19, gestora principal).
- **Tarefa:** segregação de funções — um colaborador que só devia registar documentos,
  despesas e ocorrências não devia poder, por exemplo, mudar perfis de outros membros,
  eliminar fornecedores ou alterar dados do condomínio.
- **Passos para reproduzir:** `PERFIS_GESTAO = ['admin', 'gestor']` (`lib/perfis.ts:54`)
  e `temPermissaoGestao` (linhas 96-98) tratam **qualquer** conta com perfil `gestor`
  como tendo exatamente os mesmos poderes de escrita em qualquer módulo — não existe
  hoje um nível intermédio (ex. "gestor operacional" vs. "gestor supervisor").
- **Comportamento observado:** todos os `gestor` de uma empresa gestora têm o mesmo
  nível de acesso: qualquer colaborador com uma conta `gestor` pode fazer tudo o que a
  gestora principal pode fazer.
- **Comportamento esperado:** segundo a persona (Ricardo Nunes), o colaborador
  operacional só deveria poder registar documentos/despesas/ocorrências, não gerir
  membros, condomínio ou fornecedores.
- **Impacto:** risco de segregação de funções fraca — um colaborador júnior com conta
  comprometida ou erro humano tem alcance total sobre o condomínio.
- **Gravidade:** Alto — **Tipo: falta de funcionalidade** (o auditoria (`registarAuditoria`)
  regista quem fez o quê, o que mitiga parcialmente ao permitir deteção a posteriori,
  mas não impede a ação em si).
- **Frequência:** estrutural (afeta todas as empresas gestoras com mais do que uma pessoa).
- **Abrangência:** grupo significativo (qualquer empresa gestora com colaboradores).
- **Recomendação (melhoria de médio prazo):** avaliar um nível de permissão adicional
  dentro de `gestor` — fora do âmbito desta simulação implementar, só regista o gap.
- **Teste de aceitação proposto:** N/A nesta fase (funcionalidade a desenhar).

### Achado G3 — auditoria (`/auditoria`) não é filtrável por período nem por autor
- **Página/módulo:** `app/(app)/auditoria/page.tsx`, `app/actions/auditoria.ts:10-36`.
- **Persona afetada:** Ana Beatriz Teixeira (21, supervisora), Teresa Vieira (26,
  contabilista externa), Miguel Fonseca (25, auditor interno).
- **Tarefa:** confirmar rapidamente o que um colaborador específico fez, ou o que
  aconteceu num período específico.
- **Passos para reproduzir:** `getAuditLog` (`app/actions/auditoria.ts:10-36`) só aceita
  `search` (texto livre contra `actorNome`/`detalhes`, linhas 14-21) — não existe
  parâmetro de intervalo de datas nem filtro estruturado por autor ou por
  `entidade`/`acao`. A UI (`app/(app)/auditoria/page.tsx:82-84`) só expõe essa mesma
  caixa de pesquisa livre.
- **Comportamento observado:** para encontrar "tudo o que o colaborador X fez em
  julho", é preciso escrever o nome exato no texto livre e percorrer manualmente as
  páginas de resultados (30 por página, `PAGE_SIZE` linha 8) sem poder restringir por
  data.
- **Comportamento esperado:** a persona espera um filtro por período e por autor,
  típico de qualquer ecrã de auditoria.
- **Impacto:** supervisão e conferência de contas mais lentas e propensas a saltar
  registos relevantes.
- **Gravidade:** Médio.
- **Frequência:** frequente para quem audita/supervisiona regularmente.
- **Abrangência:** perfil específico (auditor, gestor, contabilista externa).
- **Tipo:** falta de funcionalidade.
- **Recomendação (melhoria de curto prazo):** adicionar filtro por intervalo de datas
  a `getAuditLog` — mudança pequena e localizada (WHERE adicional + dois campos de
  data na UI), sem alterar o modelo de dados.
- **Teste de aceitação proposto:** é possível filtrar `/auditoria` por um intervalo de
  datas e ver só os registos desse período.

---

## Fornecedores

### Achado F1 — um fornecedor vê a lista completa dos outros fornecedores do condomínio
- **Página/módulo:** `app/actions/fornecedores.ts:10-17` (`getFornecedores`),
  `components/fornecedores/fornecedores-tabs.tsx:106-185`.
- **Persona afetada:** Manuel Costa (23), Cristina Alves (24), Diogo Pereira (11) —
  qualquer fornecedor com conta.
- **Tarefa:** um fornecedor consulta o separador "Fornecedores" da página
  `/fornecedores` (não escondido para o perfil `fornecedor`).
- **Passos para reproduzir:** `getFornecedores()` usa `requireMembroPagina()`
  (`app/actions/fornecedores.ts:11`) — qualquer membro aprovado, incluindo perfil
  `fornecedor`, recebe a lista completa de `fornecedor` do condomínio (nome, categoria,
  contactoEmail, contactoTelefone, NIF, notas). A tabela (`fornecedores-tabs.tsx:106+`)
  não esconde este separador para `isFornecedor`, só esconde as ações de edição
  (`isAdmin`).
- **Comportamento observado:** um eletricista com conta na app vê nome, contacto e NIF
  de todos os outros fornecedores (incluindo concorrentes diretos, ex. outro
  eletricista) do mesmo condomínio. **Confirmado adicionalmente, não mencionado na
  primeira leitura deste achado:** o campo `notas` (texto livre, tipicamente preenchido
  pela administração sobre o fornecedor) também é mostrado sem filtro, logo abaixo do
  nome, na mesma linha (`fornecedores-tabs.tsx:139-141`) — visível a qualquer fornecedor,
  não só ao próprio a quem a nota se refere.
- **Comportamento esperado:** a persona (Cristina Alves) só espera ver o necessário
  para responder aos seus próprios pedidos — não a lista de concorrentes do condomínio.
- **Impacto:** exposição de dados comerciais de terceiros (não é dado pessoal sensível
  no sentido RGPD estrito quando é uma empresa, mas é informação que um concorrente não
  deveria ver por defeito) a uma contraparte externa ao condomínio.
- **Gravidade:** Médio — **Tipo:** permissões / privacidade.
- **Frequência:** frequente (qualquer visita de um fornecedor a `/fornecedores`).
- **Abrangência:** perfil específico (todos os fornecedores com conta).
- **Recomendação (correção de curto prazo):** esconder o separador "Fornecedores" (ou
  filtrar para mostrar só a própria ficha) quando `isFornecedor` é verdadeiro.
- **Teste de aceitação proposto:** uma conta com perfil `fornecedor` deixa de ver dados
  de outros fornecedores em `/fornecedores`.

### Achado F2 — portal do fornecedor cobre só "Orçamentos de obra", não pedidos/ocorrências atribuídas
- **Página/módulo:** `lib/db/schema.ts:192-199` (comentário sobre `fornecedorId`),
  `app/actions/orcamentos-obra.ts:19-31` (scoping correto confirmado).
- **Persona afetada:** Diogo Pereira (11), Manuel Costa (23), Cristina Alves (24).
- **Tarefa:** "ver pedido de orçamento, submeter proposta" (persona 11/23) e "acompanhar
  estado de um trabalho" (persona 24).
- **Passos para reproduzir:** o próprio schema documenta explicitamente
  (`lib/db/schema.ts:192-196`) que "o fluxo de atribuição de ocorrências/orçamentos a
  um fornecedor é trabalho futuro". Confirmado: `getOrcamentosObra` filtra
  corretamente por `fornecedorId` quando o chamador é fornecedor (linhas 21-30, sem
  problema de isolamento), mas não existe um fluxo de "ocorrência atribuída a este
  fornecedor com estado a acompanhar" — só orçamentos de obra.
- **Comportamento observado:** o portal do fornecedor hoje é, na prática, só "submeter
  e ver as minhas propostas de orçamento de obra" — não um acompanhamento de trabalho
  atribuído com estados.
- **Comportamento esperado:** as personas esperam "ver o estado do trabalho" de forma
  mais ampla do que só orçamentos.
- **Impacto:** nenhum risco — é uma limitação de âmbito já documentada no próprio
  código como intencional (P2, `FUNCTIONAL_GAPS.md`).
- **Gravidade:** Baixo — **Tipo:** falta de funcionalidade (já conhecida e registada).
- **Frequência:** N/A.
- **Abrangência:** perfil específico.
- **Recomendação:** nenhuma nova — confirma que `FUNCTIONAL_GAPS.md` já reflete
  corretamente este gap; não duplicar o achado lá.
- **Teste de aceitação proposto:** N/A (gap já documentado, fora do âmbito desta peça).

---

## Auditores / fiscalização

Achado G3 acima (auditoria não filtrável por período/autor) aplica-se diretamente a
este grupo — não duplicado aqui.

### Achado AU1 — sem indicação de "versão final" clara na exportação/consulta financeira
- **Página/módulo:** relacionado com Achado C2 (ata rascunho) — extensível a
  exercícios financeiros ainda abertos (`garantirExercicioAberto`,
  `lib/contas-financeiras.ts`, referido em `CLAUDE.md`).
- **Persona afetada:** Teresa Vieira (26, contabilista externa), Miguel Fonseca (25).
- **Tarefa:** "fechar as contas sem reconciliação manual fora da app".
- **Comportamento observado (por análise, não testado ao vivo nesta peça):** não foi
  possível, dentro do âmbito desta peça, confirmar visualmente se `/financas/relatorio`
  ou `/financas/balanco` assinalam de forma proeminente quando o exercício em causa
  ainda está aberto — recomenda-se verificação direta em `USABILITY_SIMULATION.md`
  (módulo Finanças) em vez de aqui, para não duplicar sem evidência direta de código
  desta página.
- **Gravidade:** não classificada aqui — ver `USABILITY_SIMULATION.md`.
- **Tipo:** encaminhado, não um achado fechado desta peça.

---

## Outros intervenientes

### Achado O1 — não existe mecanismo de acesso convidado, delimitado e temporário
- **Página/módulo:** modelo de permissões completo (`lib/perfis.ts`, `lib/session.ts`) —
  ausência transversal, não um ficheiro específico.
- **Persona afetada:** Filipa Ramos (28, advogada), Duarte Pinho (29, candidato a
  comprar fração), Bruno Cabral (27, DPO, parcialmente).
- **Tarefa:** aceder a um documento ou informação específica (ata, extrato, situação de
  dívida de uma fração) sem se tornar `membro` completo do condomínio.
- **Passos para reproduzir:** todos os 6 papéis de `Perfil` (`lib/perfis.ts:26-32`)
  pressupõem uma linha `membro` completa e aprovada, ligada a um `condominioId`. Não
  existe nenhum mecanismo de partilha pontual de um documento/registo com alguém fora
  desse modelo (ex. link com expiração, acesso só de leitura a um recurso específico).
- **Comportamento observado:** hoje, a única forma de dar a alguém como um advogado ou
  um comprador acesso a informação da app é: (a) criar-lhe uma conta `membro` completa
  (acesso excessivo face à necessidade), ou (b) exportar/reencaminhar manualmente por
  fora da aplicação (perde-se a proveniência/autenticidade que a app poderia garantir).
- **Comportamento esperado:** as personas esperam um acesso pontual, delimitado ao que
  precisam.
- **Impacto:** hoje resolvido inteiramente por fora da app (email, PDF) — não é uma
  falha de segurança da app em si, mas é uma funcionalidade ausente que empurra dados
  sensíveis (situação financeira de uma fração) para canais menos controlados.
- **Gravidade:** Médio — **Tipo:** falta de funcionalidade.
- **Frequência:** ocasional (venda de frações, litígios).
- **Abrangência:** caso específico, mas recorrente ao longo da vida de um condomínio.
- **Recomendação:** não implementar agora — registar como possível funcionalidade
  futura (fora do âmbito desta simulação decidir o desenho).
- **Teste de aceitação proposto:** N/A nesta fase.

---

## Lista consolidada por gravidade

**Alto**
1. C1 — modelo não suporta condómino com várias frações no mesmo condomínio.
2. G1 — indicador de condomínio ativo demasiado discreto para uso intensivo multi-condomínio.
3. G2 — papel `gestor` sem segregação entre colaborador operacional e gestor completo.

**Médio**
4. C2 — ata "rascunho" pouco destacada visualmente.
5. A1 — painel inicial sem sinal forte de urgência para quem chega sem contexto.
6. G3 — `/auditoria` sem filtro por período/autor.
7. F1 — fornecedor vê lista completa doutros fornecedores (dados comerciais de terceiros).
8. O1 — sem mecanismo de acesso convidado/temporário e delimitado.

**Baixo**
9. F2 — portal do fornecedor limitado a orçamentos de obra (gap já documentado em
   `FUNCTIONAL_GAPS.md`, sem novidade).

**Encaminhado, não avaliado nesta peça**
- AU1 — visibilidade de exercício financeiro aberto/fechado na consulta/exportação —
  a confirmar em `USABILITY_SIMULATION.md` (módulo Finanças).

Nenhum achado desta peça foi inventado sem correspondência direta no código lido —
todas as evidências citam ficheiro:linha. Não foi alterado nenhum ficheiro de código,
dado ou permissão.
