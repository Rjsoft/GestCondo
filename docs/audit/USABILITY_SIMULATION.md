# Simulação de usabilidade — percursos por persona e tarefa

**Estado:** simulação técnica baseada em código real e personas fictícias, não teste
real. Ver limites completos em `USER_PERSONAS.md`. **Âmbito deste ficheiro:** Entrada e
orientação inicial, Condóminos e frações, Finanças, Assembleias. Fornecedores e Auditoria
estão em `ROLE_BASED_USAGE_REVIEW.md`; Avisos, Ata e Ajuda/Acessibilidade estão em
`ACCESSIBILITY_REVIEW.md`. **Correção a uma versão anterior desta nota:** Documentos e
Mensagens **não foram efetivamente revistos por nenhuma das três peças** — nenhuma lê
`app/(app)/documentos/page.tsx`, `app/actions/documentos.ts`, `app/(app)/mensagens/
page.tsx` nem `app/actions/mensagens.ts` em detalhe (`ROLE_BASED_USAGE_REVIEW.md` só
menciona "Documentos" de passagem, como um dos cabeçalhos onde repetir o nome do
condomínio ativo em F02/G1; `ACCESSIBILITY_REVIEW.md` não os inclui na lista de ficheiros
lidos). Estes dois módulos ficam por rever nesta ronda de simulação — não confundir com
"coberto noutra peça".

Notação de gravidade (secção 13 do pedido): **Crítico** / **Alto** / **Médio** / **Baixo**.

---

## Bloco 1 — Entrada e orientação inicial

Ficheiros analisados: `app/sign-in/page.tsx`, `app/onboarding/page.tsx`,
`app/(app)/page.tsx` (painel), `components/app-shell.tsx`, `components/auth-form.tsx`,
`components/condominio-selector.tsx`, `app/(app)/condominos/page.tsx`.

### Percurso 1.1 — Rosa Pinto (persona 3) tenta ver o saldo pela primeira vez
- **Entrada:** recebe um link do administrador, abre no smartphone.
- **Expectativa:** "vou ver quanto devo, tal como no banco."
- **Ação:** procura o campo de login; o formulário (`components/auth-form.tsx`) pede
  email/password sem instrução prévia sobre o que fazer se nunca teve conta.
- **Observação:** a app tem, desde a alteração mais recente, um link "Como começar" →
  `/instrucoes` no formulário (`components/auth-form.tsx:310`) — mitiga parcialmente o
  problema de orientação inicial para quem nunca usou a app.
- **Dúvida:** depois do primeiro login sem `membro`, é enviada para `/onboarding`
  (`app/onboarding/page.tsx:12`) — ecrã não lido em detalhe aqui, mas o nome do
  componente (`OnboardingForm`) sugere pedir código de convite ou criar condomínio; para
  Rosa, que só quer "ver a app do prédio", perceber a diferença entre "criar um
  condomínio" e "juntar-me a um condomínio existente" é um ponto de fricção real —
  qualquer erro aqui (ex. criar um condomínio novo em vez de pedir para entrar no
  existente) é difícil de desfazer sozinha.
- **Resultado:** provável sucesso com ajuda de terceiros; sem ajuda, risco de desistência
  no ecrã de onboarding.
- **Gravidade:** Médio (mitigado parcialmente pelo link "Como começar", mas o próprio
  onboarding não foi coberto pela simulação de código nesta peça — ver recomendação de
  validação real).

### Percurso 1.2 — Carlos Vaz (persona 22) substitui o administrador habitual
- **Entrada:** login válido, `membro.estado = 'aprovado'`, perfil `admin`.
- **Expectativa:** "o painel vai dizer-me o que está pendente."
- **Ação:** abre `/` (painel).
- **Informação percebida:** vê saldo, receitas, despesas, ocorrências abertas, avisos
  recentes, ocorrências recentes e (se `gerePermissoes && inconsistencias.length > 0`) um
  cartão "Verificações" (`app/(app)/page.tsx:245-271`).
- **Comportamento observado:** o painel **não mostra** pedidos de acesso pendentes
  (`membro.estado = 'pendente'`, só visível em `/condominos`, `app/(app)/condominos/
  page.tsx:69-94`) nem assembleias marcadas/próximas. Carlos só descobre um condómino à
  espera de aprovação se for a `/condominos` por iniciativa própria — não há nenhum sinal
  no painel nem contagem na barra lateral para isso (comparar com "Mensagens" e
  "Notificações", que já têm uma contagem visível na barra lateral via `contagensNav`,
  `components/app-shell.tsx:215-219`, alimentado em `app/(app)/layout.tsx:66-69` — hoje
  só para essas duas rotas, não para "Condóminos"; correção a uma leitura anterior deste
  achado, que dizia "só usado para mensagens").
- **Comportamento esperado:** um utilizador novo no condomínio (mesmo sendo admin)
  deveria ver, no painel, os itens que tipicamente pedem atenção de um administrador:
  pedidos de acesso pendentes, próxima assembleia agendada.
- **Impacto:** Carlos pode passar a substituição inteira sem saber que há um condómino à
  espera de aprovação há semanas.
- **Gravidade:** Médio (não é um erro que perde dados, mas é uma tarefa de administração
  ignorada por falta de visibilidade).
- **Recomendação:** adicionar ao painel, condicional a `temPermissaoGestao`, uma
  contagem/link para pedidos de acesso pendentes (reaproveitando o padrão já existente do
  cartão "Verificações").
- **Teste de aceitação:** com 1+ `membro.estado='pendente'`, o painel de um admin mostra
  um indicador visível e um link direto para `/condominos`.

### Percurso 1.3 — Sofia Cardoso (persona 19) troca de condomínio ativo
- **Ação tentada:** usa o `CondominioSelector` no topo da barra lateral
  (`components/condominio-selector.tsx`).
- **Informação percebida:** o seletor é um `<Select>` compacto, texto `text-xs`, sem
  título "Condomínio ativo:" — só o nome do condomínio muda.
- **Observação:** ao trocar, `definirCondominioAtivo` corre e `router.refresh()`
  recarrega os dados da página atual — não há nenhuma confirmação visual explícita (ex.
  toast "Agora em: Nome do Condomínio") além do próprio nome mudar de forma discreta no
  canto superior esquerdo.
- **Risco:** para alguém a trabalhar rapidamente entre 18 condomínios (persona 19) ou sob
  pressão de tempo, é fácil não reparar que a troca teve sucesso (ou falhou — o erro só
  aparece como `toast.error`, que desaparece sozinho) e continuar a trabalhar assumindo o
  condomínio errado.
- **Gravidade:** Médio–Alto — um lançamento financeiro ou aviso publicado no condomínio
  errado tem impacto financeiro/reputacional real, e o modelo multi-tenant da app
  depende inteiramente do utilizador confirmar visualmente o condomínio certo (não há
  segunda confirmação no momento de, por exemplo, `criarMovimento`).
- **Recomendação:** toast de confirmação explícito ao trocar ("Agora a trabalhar em: X"),
  e considerar destacar visualmente o nome do condomínio ativo (não só texto pequeno).
- **Teste de aceitação:** trocar de condomínio produz um toast de sucesso nomeando o
  condomínio, e o nome do condomínio ativo é visualmente distinto (não apenas
  `text-xs`/`text-sidebar-foreground/60`) da restante navegação.

### Percurso 1.4 — Rui Antunes (persona 7) navega o painel com NVDA
- **Observação de código:** `app-shell.tsx:150-156` move o foco para `#main-content`
  a cada mudança de página (exceto a primeira) — implementado especificamente para não
  prender utilizadores de teclado na barra lateral. Bom padrão, já testado nesta sessão
  (commit `2f5f3ab`).
- **Painel:** os `StatCard` (saldo, receitas, despesas, ocorrências) são `<div>`/`<p>`
  sem nenhum heading semântico a agrupá-los nem `aria-label` a dar contexto ao valor —
  para NVDA, cada cartão lê-se como "Saldo atual" seguido de "1 250,00 €" em elementos
  separados, o que funciona mas depende de navegação sequencial; não há um heading `h2`
  "Resumo financeiro" a anunciar o bloco antes dos 4 números (ver `ACCESSIBILITY_REVIEW.md`
  para o levantamento completo de hierarquia de títulos).
- **Gravidade:** Baixo — funciona, mas falta contexto de agrupamento.

### Percurso 1.5 — Yulia Kovalenko (persona 16) e Hugo Martins (persona 18) — vocabulário
- **Observação:** `PageHeader` do painel usa "Bem-vindo, {nome}" e "Visão geral do estado
  atual do condomínio" — claro. Mas o cartão "Verificações" usa a frase "Situações que
  costumam ser esquecidas por engano" (`app/(app)/page.tsx:255-257`) — natural para um
  falante nativo, potencialmente ambíguo para Yulia (expressão idiomática "por engano").
  Termos como "permilagem" aparecem sem explicação no cartão "Condomínio" do painel
  (`app/(app)/page.tsx:182-186`) — só explicado em `/ajuda`, não junto ao valor.
- **Gravidade:** Baixo — termo técnico legítimo do domínio (não há forma simples de o
  evitar), mas beneficiaria de um `title`/tooltip com a definição, já que existe uma
  definição pronta em `components/ajuda/secoes.tsx`.

**Avaliação (critérios secção 8) — Bloco 1 Entrada e orientação**
| Critério | Nota | Nota (explicação se ≤3) |
|---|---|---|
| Facilidade de aprendizagem | 3 | Onboarding não simulado em detalhe; painel é claro mas incompleto (1.2) |
| Eficiência | 4 | |
| Clareza | 4 | |
| Previsibilidade | 3 | Troca de condomínio pouco visível (1.3) |
| Consistência | 4 | |
| Prevenção de erros | 3 | Troca de condomínio sem confirmação forte (1.3) |
| Recuperação de erros | 3 | Erro de troca só em toast passageiro |
| Acessibilidade | 4 | Bom padrão de foco (1.4); falta agrupamento semântico |
| Legibilidade | 4 | |
| Carga cognitiva | 3 | Painel não distingue "para agir" de "para informação" (1.2) |
| Confiança | 4 | |
| Transparência | 4 | |
| Privacidade | 5 | |
| Adequação de permissões | 4 | |
| Mobile | 4 | Drawer lateral testado nesta sessão, funcional |
| Uso ocasional | 3 | Rosa/Hugo dependem de ajuda externa no arranque |
| Uso profissional intensivo | 3 | Falta visão consolidada multi-condomínio (ver `ROLE_BASED_USAGE_REVIEW.md`) |

---

## Bloco 2 — Condóminos e frações

Ficheiros: `app/(app)/condominos/page.tsx`, `app/(app)/fracoes/page.tsx`,
`components/condominos/*`, `components/fracoes/*`.

### Percurso 2.1 — Sandra Melo (persona 5) com 3 frações no mesmo condomínio
- **Base de dados:** confirmado em `lib/db/schema.ts` que `membro.fracaoId` é singular —
  uma pessoa com 3 frações precisa de 3 linhas `membro` (mesmo `userId`, mesmo
  `condominioId`, `fracaoId` diferente).
- **Observação:** não foi encontrada, na análise desta peça, nenhuma UI de admin em
  `components/condominos/*` para criar deliberadamente uma segunda/terceira linha
  `membro` para a mesma pessoa no mesmo condomínio — o fluxo de "aprovar pedido de
  acesso" (`MembroStatusActions`) pressupõe um pedido novo por email, não uma associação
  adicional a partir de uma conta já aprovada.
- **Risco:** ou (a) esta funcionalidade não existe mesmo na prática — Sandra teria de
  contactar o administrador para "algo" que a app não suporta claramente — ou (b) existe
  por outra via não identificada nesta simulação. **Não confirmado** — necessita
  verificação direta no código de `app/actions/condominos.ts`/onboarding antes de se
  considerar um problema confirmado.
- **Gravidade:** Médio, classificado como **hipótese**, não confirmado.

### Percurso 2.2 — Miguel Fonseca (auditor, persona 25) confere quem tem acesso a quê
- **Observação:** `condominos/page.tsx` mostra Fração e Fornecedor associados na mesma
  tabela, com pesquisa (`removerAcentos`, sem distinção de maiúsculas/acentos — boa
  prevenção de erro de pesquisa). Perfis `PERFIS_CONSULTA_GESTAO` (inclui `auditor`)
  conseguem ver mas não editar (`podeGerir` controla os botões de edição,
  `condominos/page.tsx:136-160`) — consistente com `podeEscrever`.
- **Gravidade:** sem problema encontrado — bom exemplo de separação clara entre consulta
  e gestão.

### Percurso 2.3 — André Lima (persona 13, só teclado, tremor) edita uma fração
- **Observação de código:** `EditarFracaoDialog`/`FracaoActions` não foram lidos em
  detalhe nesta peça (ver `ACCESSIBILITY_REVIEW.md` para o levantamento de foco em
  diálogos/tabelas). A tabela de frações tem 5-7 colunas com `hidden sm:table-cell` /
  `hidden xl:table-cell` — em ecrã pequeno, várias colunas desaparecem (bom para mobile),
  mas um utilizador só de teclado num ecrã grande **não tem forma alternativa** de saltar
  diretamente para a linha de uma fração específica sem percorrer a tabela inteira célula
  a célula (não há atalho “ir para a pesquisa” documentado além do foco natural do Tab) —
  mitigado parcialmente pelo campo de pesquisa já existir no topo da página.
- **Gravidade:** Baixo.

**Avaliação — Bloco 2 Condóminos e frações**
| Critério | Nota | Nota (explicação se ≤3) |
|---|---|---|
| Facilidade de aprendizagem | 4 | |
| Eficiência | 4 | |
| Clareza | 4 | |
| Previsibilidade | 4 | |
| Consistência | 5 | Mesmo padrão lista+pesquisa+diálogo em todo o módulo |
| Prevenção de erros | 3 | Multi-fração por pessoa não claramente suportada na UI (2.1) |
| Recuperação de erros | 4 | |
| Acessibilidade | 3 | Tabelas densas, não verificado em detalhe (ver ACCESSIBILITY_REVIEW.md) |
| Legibilidade | 4 | |
| Carga cognitiva | 4 | |
| Confiança | 4 | |
| Transparência | 5 | Distinção clara consulta vs. gestão (2.2) |
| Privacidade | 5 | Contactos escondidos de quem não gere/audita (S13, já mitigado) |
| Adequação de permissões | 5 | |
| Mobile | 4 | |
| Uso ocasional | 4 | |
| Uso profissional intensivo | 3 | Sem ações em lote (relevante para persona 19/20) |

---

## Bloco 3 — Finanças

Ficheiros: `app/(app)/financas/page.tsx`, `components/financas/novo-movimento-dialog.tsx`,
`components/financas/movimento-actions.tsx`, `app/actions/financas.ts`, `lib/rateio.ts`
(referenciado, não lido linha a linha nesta peça), `lib/inconsistencias.ts` (deteção de
duplicados já implementada, ver painel).

### Percurso 3.1 — Carlos Vaz (admin substituto) lança uma despesa urgente
- **Ação:** abre "Novo movimento" (`novo-movimento-dialog.tsx`).
- **Informação percebida:** formulário com tipo, valor, fração/fornecedor, e um bloco
  "Mais opções" recolhido por omissão (destino, ligação a assembleia, "requer aprovação",
  "obra urgente" com justificação obrigatória). Boa aplicação do princípio "simplicidade
  visual" — a complexidade fica escondida até ser pedida.
- **Observação positiva:** o botão só fica ativo com `justificacaoUrgencia` preenchida
  quando "urgente" está marcado (`novo-movimento-dialog.tsx:419`) — bloqueia
  corretamente o lançamento de uma obra urgente (art. 1427º CC) sem justificação.
- **Comportamento observado — sem deteção de duplicado no momento da criação:**
  `criarMovimento` (`app/actions/financas.ts:748`) valida campos obrigatórios, destino e
  justificação de urgência, mas não compara com movimentos existentes semelhantes (mesma
  fração/fornecedor + valor + data). A deteção de duplicados só existe depois, no cartão
  "Verificações" do painel (`lib/inconsistencias.ts:
  detetarMovimentosDuplicados`), visível só a quem tem `temPermissaoGestao` e só se
  alguém visitar o painel.
- **Cenário de erro:** Carlos, sob pressão (é substituto, não conhece o histórico),
  regista a mesma fatura duas vezes (ex. depois de a página não confirmar visualmente
  que guardou, ver 3.3). Só descobre — se descobrir — dias depois, no painel.
- **Gravidade:** **Alto** — impacto financeiro direto (duplicar uma despesa ou uma
  receita distorce o saldo mostrado a todos os condóminos), afeta qualquer perfil de
  gestão, é razoavelmente provável (não há nenhuma barreira no momento da introdução).
- **Recomendação:** aviso não bloqueante no próprio formulário/confirmação ("já existe um
  movimento parecido: [data] [valor] [categoria] — continuar?") reaproveitando a lógica
  já existente em `lib/inconsistencias.ts`.
- **Teste de aceitação:** ao introduzir valor+data+categoria/fração iguais a um movimento
  existente não eliminado, o formulário mostra um aviso antes de submeter.

### Percurso 3.2 — Teresa Vieira (contabilista, persona 26) fecha um exercício
- **Observação:** todas as escritas relevantes passam por `garantirExercicioAberto`
  (confirmado por grep em `app/actions/financas.ts`: usado em `criarMovimento`,
  `editarMovimento`, `eliminarMovimento`, `alternarPago`, lançamento de juros, entre
  outros) — consistente com a convenção documentada em `CLAUDE.md`. Boa prevenção
  estrutural de escrita em exercício fechado.
- **Risco residual:** a mensagem de erro exata devolvida por `garantirExercicioAberto`
  não foi lida nesta peça (está em `lib/contas-financeiras.ts`) — se for um erro técnico
  genérico em vez de "este exercício está fechado, motivo: X, reabra em Finanças >
  Exercícios", o utilizador não perceberá porque falhou. **Não confirmado nesta peça** —
  candidato a validação direta.
- **Gravidade:** Médio (hipótese).

### Percurso 3.3 — Rosa Pinto (persona 3) marca uma quota como paga, sem confirmação visual clara
- **Observação:** `MovimentoActions` usa `toast.success('Movimento eliminado')` /
  equivalentes para todas as ações — funciona bem para quem vê a tela, mas o toast
  desaparece sozinho ao fim de poucos segundos; para alguém com memória de trabalho
  reduzida (persona 3, 15) ou baixa visão sem zoom a tempo de o ler, a única confirmação
  duradoura é a mudança de estado na própria linha da tabela (ex. ícone
  `CheckCircle2`/`Circle`).
- **Gravidade:** Baixo — a confirmação persistente existe (o estado na tabela), só a
  confirmação imediata é efémera.

### Percurso 3.4 — situações adversas em Finanças (secção 11)
- **Duplo clique em "Guardar movimento":** o botão fica `disabled={pending || ...}`
  durante a `startTransition` (`novo-movimento-dialog.tsx:416-423`) — **bem prevenido**,
  não deveria ser possível duplicar por duplo clique.
- **Abandono do formulário a meio:** o `Dialog` (base-ui) fecha com Escape/clique fora
  sem qualquer aviso de "tens alterações não guardadas" — confirmado pela ausência de
  qualquer handler de `onOpenChange` que verifique campos preenchidos em
  `novo-movimento-dialog.tsx`. Um formulário longo (Novo movimento tem ~15 campos
  possíveis) perdido por um clique acidental fora do diálogo é frustrante, sobretudo para
  utilizadores com dificuldade de concentração (persona 15) ou tremor (persona 13, que
  pode ativar um clique fora do diálogo sem intenção).
  **Gravidade:** Médio. Padrão observado é sistémico (mesmo componente `Dialog` usado em
  toda a app), não específico de Finanças — retomado em `USABILITY_FINDINGS.md` como
  achado transversal.
- **Sessão expirada a meio de um lançamento:** não testado (exigiria expirar uma sessão
  real, fora do âmbito de uma simulação de código) — **não verificado**, recomenda-se
  teste manual dirigido: preencher o formulário, esperar a sessão expirar, e confirmar se
  os dados do formulário sobrevivem a um redirecionam".
- **Duas pessoas a editar o mesmo movimento em simultâneo:** `editarMovimento`
  (`app/actions/financas.ts:867+`) não foi visto a implementar nenhum controlo de
  concorrência (ex. versão/`updatedAt` comparado antes do `UPDATE`) — a última escrita
  ganha silenciosamente, sem avisar quem perdeu a sua alteração. Cenário plausível numa
  empresa gestora com vários colaboradores (personas 13, 19, 20, 21) a trabalhar no mesmo
  condomínio. **Gravidade:** Médio — baixa frequência, mas quando acontece perde uma
  edição sem aviso.
- **Botão "Voltar" do browser depois de submeter:** as ações usam Server Actions +
  `revalidatePath`, não navegação de página — "Voltar" não deveria reenviar o formulário
  (comportamento típico de POST clássico); não identificado nenhum risco aqui.
- **Repetir uma operação já concluída** (ex. clicar "Marcar como pago" duas vezes em
  separadores diferentes): `alternarPago` é idempotente por natureza (define o campo
  `pago` para um valor fixo) — sem risco de duplicação.

**Avaliação — Bloco 3 Finanças**
| Critério | Nota | Nota (explicação se ≤3) |
|---|---|---|
| Facilidade de aprendizagem | 3 | Formulário de movimento é extenso, mesmo com "Mais opções" |
| Eficiência | 4 | |
| Clareza | 4 | |
| Previsibilidade | 3 | Sem aviso de duplicado (3.1) |
| Consistência | 4 | |
| Prevenção de erros | 2 | Duplicados só detetados depois (3.1); edição concorrente sem aviso (3.4) |
| Recuperação de erros | 3 | Eliminar tem confirmação clara; duplicar não tem forma fácil de desfazer em massa |
| Acessibilidade | 3 | Não verificado em detalhe nesta peça — ver ACCESSIBILITY_REVIEW.md |
| Legibilidade | 4 | |
| Carga cognitiva | 3 | Formulário denso (mitigado por "Mais opções") |
| Confiança | 4 | Disclaimers claros (fundo de reserva, retenção legal) |
| Transparência | 5 | Mensagem de eliminação explica retenção legal (movimento-actions.tsx:140) |
| Privacidade | 4 | |
| Adequação de permissões | 4 | `requireAdmin`/`temAcessoFinanceiro` consistentes |
| Mobile | 3 | Formulário longo em ecrã pequeno não testado (persona 11, 18) |
| Uso ocasional | 3 | Densidade de campos exige leitura cuidadosa |
| Uso profissional intensivo | 3 | Sem lançamento em lote nem atalhos de teclado dedicados |

---

## Bloco 4 — Assembleias

Ficheiros: `app/(app)/assembleias/page.tsx`, `app/(app)/assembleias/[id]/page.tsx`,
`components/assembleias/registar-voto-dialog.tsx`, `app/actions/assembleias.ts`.

### Percurso 4.1 — Rui Antunes (cego, NVDA) prepara e conduz uma assembleia
- **Observação positiva:** a página de detalhe explica em texto simples, junto ao
  quórum, que "a app calcula e mostra o quórum; a qualificação de maioria legal para cada
  deliberação cabe ao administrador" (`assembleias/[id]/page.tsx:139-142`) — transparência
  clara sobre o que é automático e o que é responsabilidade humana, importante para
  confiança (heurística "correspondência com o mundo real").
  Cada ponto da ordem de trabalhos mostra três blocos de percentagem (a favor/contra/
  abstenção) como `<div>` com texto — legível por NVDA sequencialmente, mas sem
  `aria-label` a identificar claramente "resultados da votação para o ponto X" como um
  grupo (ver `ACCESSIBILITY_REVIEW.md`).
- **Gravidade:** Baixo.

### Percurso 4.2 — Registar votos em sequência (qualquer admin, ex. Carlos Vaz)
- **Observação de código:** `RegistarVotoDialog` (`registar-voto-dialog.tsx:44`) começa
  sempre com `voto = 'favor'` pré-selecionado e não reabre limpo depois de guardar
  (`setVoto('favor')` no sucesso, `registar-voto-dialog.tsx:56`, o que é o comportamento
  correto — mas confirma que "favor" é sempre o ponto de partida).
- **Cenário de erro:** ao registar vários votos seguidos para frações diferentes num
  ponto polémico, é fisicamente fácil confirmar sem mudar o valor pré-selecionado
  ("favor"), registando por engano um voto "contra"/"abstenção" pretendido como "favor".
- **Mitigação existente:** os totais de a favor/contra/abstenção na página atualizam-se
  (via `revalidatePath`) depois de cada voto — um administrador atento pode detetar o
  desvio comparando com o que esperava. O servidor usa `onConflictDoUpdate`
  (`app/actions/assembleias.ts:373-379`) — corrigir um voto errado é possível (reabrir o
  diálogo e voltar a registar a mesma fração), sem criar duplicados.
- **Gravidade:** Médio — erro plausível em votações longas, mas com dois mecanismos de
  mitigação (totais visíveis e correção sem duplicar). Numa deliberação que "exige
  unanimidade" (`p.exigeUnanimidade`), um único voto mal registado muda o resultado
  legal.
- **Recomendação:** não pré-selecionar um valor (obrigar escolha explícita), ou mostrar
  de forma mais visível, dentro do próprio diálogo, quantos votos já foram registados
  para aquele ponto antes deste.
- **Teste de aceitação:** o campo "voto" não tem valor por omissão / exige seleção
  explícita antes de permitir submeter.

### Percurso 4.3 — Miguel Fonseca (auditor) confirma que uma ata é definitiva
- **Observação:** a ata (`app/(app)/assembleias/ata/[id]/page.tsx`, já revisto nesta
  sessão) mostra um badge "Rascunho — ata ainda não aprovada" quando
  `assembleia.estado !== 'aprovada'` — bom sinal visual e textual, não dependente só de
  cor.
- **Gravidade:** sem problema — boa prática confirmada.

### Percurso 4.4 — situações adversas em Assembleias
- **Editar depois de aprovada:** `editavel = estado === 'convocada' || estado ===
  'realizada'` (`assembleias/[id]/page.tsx:67`) — uma vez `'aprovada'`, os diálogos de
  edição (presenças, pontos, votos, anexos) deixam de aparecer na UI. Boa prevenção
  estrutural contra alteração de uma ata já fechada. Não confirmado se a Server Action
  correspondente também bloqueia no servidor (defesa em profundidade) — **não
  verificado nesta peça**.
- **Cancelar uma assembleia por engano:** `AssembleiaActions` não foi lido em detalhe
  nesta peça — recomenda-se confirmar que usa `ConfirmDialog` como o resto da app antes
  de considerar isto coberto.

**Avaliação — Bloco 4 Assembleias**
| Critério | Nota | Nota (explicação se ≤3) |
|---|---|---|
| Facilidade de aprendizagem | 3 | Muitos conceitos legais (quórum, unanimidade, procuração) |
| Eficiência | 4 | |
| Clareza | 4 | |
| Previsibilidade | 3 | Voto pré-selecionado em "favor" (4.2) |
| Consistência | 4 | |
| Prevenção de erros | 3 | Voto pré-selecionado; edição bloqueada após aprovação (positivo) |
| Recuperação de erros | 4 | Voto corrigível sem duplicar |
| Acessibilidade | 3 | Blocos de resultado sem agrupamento semântico — ver ACCESSIBILITY_REVIEW.md |
| Legibilidade | 4 | |
| Carga cognitiva | 3 | Muita informação legal simultânea (quórum, maiorias, unanimidade) |
| Confiança | 5 | Disclaimers claros sobre responsabilidade legal do admin |
| Transparência | 5 | Badge de rascunho, distinção clara de estados |
| Privacidade | 4 | |
| Adequação de permissões | 4 | |
| Mobile | 3 | Tabelas de presenças/votos não testadas em ecrã pequeno |
| Uso ocasional | 3 | Vocabulário jurídico (persona 16, 18) |
| Uso profissional intensivo | 4 | |

---

## Avaliação heurística transversal (secção 9) — Entrada, Condóminos/Frações, Finanças, Assembleias

1. **Visibilidade do estado do sistema** — boa em geral (toasts, badges de estado,
   totais de votação ao vivo); fraca na troca de condomínio ativo (1.3) e nos pedidos
   pendentes ausentes do painel (1.2).
2. **Correspondência com a linguagem do utilizador** — boa (português corrente,
   disclaimers em linguagem simples sobre responsabilidade legal); pontos técnicos
   (permilagem, unanimidade) sem explicação no contexto imediato, só em `/ajuda`.
3. **Controlo e liberdade do utilizador** — boa (diálogos fecham livremente, `ConfirmDialog`
   em eliminações); mas sem aviso ao fechar formulário com dados não guardados (3.4).
4. **Consistência** — muito boa: o padrão lista + pesquisa + diálogo + `DropdownMenu` de
   ações repete-se de forma previsível em Condóminos, Frações e Finanças.
5. **Prevenção de erros** — o ponto mais fraco encontrado nestes 4 módulos: sem aviso de
   duplicado ao lançar movimentos (3.1), voto pré-selecionado (4.2), sem controlo de
   edição concorrente (3.4).
6. **Reconhecimento em vez de memorização** — boa: formulários mostram sempre as opções
   válidas em `<Select>`, não exigem memorizar códigos.
7. **Flexibilidade e eficiência** — fraca para uso profissional intensivo: sem ações em
   lote em nenhum dos 4 módulos (relevante para personas 19, 20, 21).
8. **Simplicidade visual** — boa: uso extensivo de `Collapsible`/"Mais opções" para
   esconder complexidade até ser pedida (finanças, especialmente).
9. **Mensagens de erro úteis** — mistas: erros de validação (`throw new Error(...)`) são
   específicos e em português claro; não verificado se `garantirExercicioAberto` explica
   como resolver (3.2).
10. **Ajuda e documentação** — coberta noutro módulo (`ACCESSIBILITY_REVIEW.md`,
    `docs/audit`), não repetida aqui.
11. **Acessibilidade por teclado** — não testada ao vivo nesta peça (ver
    `ACCESSIBILITY_REVIEW.md`); código sugere boa base (gestão de foco em
    `app-shell.tsx`).
12. **Compatibilidade com tecnologia de apoio** — idem, remetido para
    `ACCESSIBILITY_REVIEW.md`.
13. **Clareza de permissões** — muito boa: `temPermissaoGestao`/`temConsultaGestao`/
    `temAcessoFinanceiro`/`podeEscrever` aplicados de forma consistente e visível (botões
    de edição só aparecem quando `isAdmin`/`podeGerir`).
14. **Confirmação de ações críticas** — boa para eliminação (`ConfirmDialog` com
    explicação); fraca para troca de condomínio ativo e para registo de voto.
15. **Possibilidade de cancelar/corrigir** — boa (votos corrigíveis, movimentos
    editáveis/elimináveis com auditoria).
16. **Rastreabilidade** — muito boa: `registarAuditoria` chamado consistentemente com
    `alteracoes` explícitas (ex. `assembleias.ts:381-391`).

---

## Lista consolidada de problemas — Bloco Entrada/Condóminos/Finanças/Assembleias

1. **[Médio]** Painel não mostra pedidos de acesso pendentes nem assembleias próximas a
   um administrador — `app/(app)/page.tsx`. Persona: Carlos Vaz (22). Percurso 1.2.
2. **[Médio–Alto]** Troca de condomínio ativo pouco visível/confirmada —
   `components/condominio-selector.tsx`. Personas: Sofia Cardoso (19), André Lima (13).
   Percurso 1.3.
3. **[Baixo]** Cartões do painel sem heading semântico a agrupá-los para leitores de
   ecrã — `app/(app)/page.tsx`. Persona: Rui Antunes (7). Percurso 1.4.
4. **[Baixo]** Termos técnicos (permilagem) sem explicação contextual fora de `/ajuda`.
   Personas: Yulia Kovalenko (16), Hugo Martins (18). Percurso 1.5.
5. **[Médio, hipótese não confirmada]** Sem UI clara para associar uma segunda fração a
   uma conta já aprovada no mesmo condomínio — `components/condominos/*`. Persona:
   Sandra Melo (5). Percurso 2.1. **Requer verificação direta antes de agir.**
6. **[Alto]** Sem deteção de movimento duplicado no momento da criação (só depois, no
   painel, e só para quem gere) — `components/financas/novo-movimento-dialog.tsx`,
   `app/actions/financas.ts:748`. Qualquer perfil de gestão. Percurso 3.1.
7. **[Médio, hipótese não confirmada]** Mensagem de erro de `garantirExercicioAberto` não
   verificada quanto a clareza/instrução de resolução — `lib/contas-financeiras.ts`
   (não lido nesta peça). Persona: Teresa Vieira (26). Percurso 3.2.
8. **[Médio]** Diálogos (ex. Novo movimento) fecham sem aviso de dados não guardados —
   padrão sistémico do componente `Dialog`, ilustrado em
   `components/financas/novo-movimento-dialog.tsx`. Personas: Vítor Almeida (15), André
   Lima (13). Percurso 3.4.
9. **[Médio]** Edição concorrente de um movimento por duas pessoas não tem controlo nem
   aviso — `app/actions/financas.ts:867+`. Personas: equipas de empresas gestoras (13,
   19, 20, 21). Percurso 3.4.
10. **[Médio]** Campo "voto" pré-selecionado em "A favor" no diálogo de registo de voto
    — `components/assembleias/registar-voto-dialog.tsx:44`. Qualquer admin a registar
    votos em série. Percurso 4.2.
11. **[Baixo]** Blocos de resultado de votação (a favor/contra/abstenção) sem
    `aria-label` de agrupamento — `app/(app)/assembleias/[id]/page.tsx:251-268`. Persona:
    Rui Antunes (7). Percurso 4.1.
12. **[Não verificado]** Bloqueio de edição de assembleia aprovada não confirmado do lado
    do servidor (só na UI) — `app/actions/assembleias.ts` (ações de edição não lidas
    integralmente nesta peça).
13. **[Não verificado]** `AssembleiaActions` (cancelar assembleia) não revisto quanto a
    uso de `ConfirmDialog`.

Achados transversais (afetam também outros módulos, não duplicar em
`ROLE_BASED_USAGE_REVIEW.md`/`ACCESSIBILITY_REVIEW.md` sem referenciar este número):
#8 (padrão de `Dialog` sem aviso de abandono) e #2 (visibilidade do condomínio ativo)
são candidatos a problema transversal — confirmar abrangência real na consolidação final
(`USABILITY_FINDINGS.md`).
