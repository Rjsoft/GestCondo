# Revisão de acessibilidade — simulação técnica (2026-07-31)

**O que é isto:** análise de código (leitura de componentes/páginas reais) mais navegação
simulada por personas — **não é um teste real com NVDA, VoiceOver ou qualquer outra
tecnologia de apoio a correr de facto**, nem medição instrumentada de contraste. É uma
peça de `docs/audit/USER_PERSONAS.md` (30 personas) e do pedido de simulação aprofundada
de usabilidade de 2026-07-31 — âmbito: secção 10 (acessibilidade) e secção 12, só as
partes "Pessoas cegas" e "Pessoas surdas".

**Não declara conformidade WCAG.** Cruza com o que já existe em
`docs/audit/ACCESSIBILITY_AUDIT.md` (achados A1-A9, a maioria já corrigida e
reverificada em runtime com `document.activeElement` real) e `docs/GUIA_NVDA_NARRADOR.md`
— não repete o que esses documentos já cobrem, só acrescenta o que ainda não tinha sido
olhado: tabelas financeiras, o fluxo de deliberação de assembleia, e a interação entre a
funcionalidade "Ler em voz alta" e um leitor de ecrã real.

## 1. O que foi efetivamente analisado

Código lido nesta revisão: `components/app-shell.tsx`, `components/auth-form.tsx`,
`app/(app)/page.tsx`, `components/ui/confirm-dialog.tsx`, `components/ui/dialog.tsx`
(já coberto por A3/6.2, não repetido), `app/(app)/financas/page.tsx`,
`app/(app)/assembleias/[id]/page.tsx`, `components/assembleias/resultado-botoes.tsx`,
`components/leitura-voz/use-leitura-voz.ts`, `components/leitura-voz/leitura-voz-controls.tsx`,
`app/(app)/avisos/page.tsx`, `app/(app)/assembleias/ata/[id]/page.tsx`.

## 2. Achados novos (não cobertos por A1-A9)

### AR1 — Deliberação de assembleia sem confirmação, ao contrário da convenção do projeto
**Gravidade: Alta.** Frequência: ocasional (só durante assembleias). Abrangência: perfil
específico (admin/gestor a registar deliberações) mas com impacto legal/documental
relevante.
- **Página/módulo:** `app/(app)/assembleias/[id]/page.tsx`, componente
  `components/assembleias/resultado-botoes.tsx`.
- **Persona afetada:** #7 Rui Antunes (condómino administrador, cego, NVDA+teclado);
  também relevante para #13 André Lima (tremor, só teclado) e qualquer administrador
  sob pressão de tempo durante uma assembleia ao vivo (contexto "utilização sob pressão
  de tempo", secção 3 do pedido).
- **Tarefa:** "registar deliberações" (secção 6, bloco Assembleias).
- **Passos para reproduzir:** abrir a página de uma assembleia com pontos por decidir →
  `Tab` até um dos três botões "Aprovar"/"Reprovar"/"Adiar" (`resultado-botoes.tsx:30-42`)
  → `Enter`.
- **Comportamento observado:** a ação é executada imediatamente
  (`definirResultadoPonto(pontoId, resultado)`, linha 20) sem qualquer diálogo de
  confirmação — três botões de texto curto, lado a lado, sem separação semântica de
  grupo (`role="group"`/`aria-label` em falta no `<div>` da linha 29). **Verificado
  também (correção a uma leitura anterior deste achado):** os três botões só existem no
  DOM enquanto o ponto não tiver resultado —
  `{!p.resultado && <ResultadoBotoesClient pontoId={p.id} />}`
  (`app/(app)/assembleias/[id]/page.tsx:273`) — e não há, em toda a `app/actions/
  assembleias.ts`, nenhuma outra função que volte a escrever `resultado` a partir da UI.
  Ou seja, **não existe** na aplicação o cenário "mudar uma decisão já tomada": depois de
  um clique, os botões desaparecem e ficam substituídos por um badge fixo
  (linhas 235-247). O risco real não é "alterar uma decisão existente sem confirmação" —
  é o oposto: um clique errado na **primeira e única oportunidade** fica registado sem
  qualquer via de correção visível na interface (a função do servidor até permitiria
  reescrever `resultado`, mas nada na UI expõe essa chamada uma segunda vez).
- **Comportamento esperado:** o próprio `CLAUDE.md` do projeto documenta a convenção
  "Ações destrutivas usam `components/ui/confirm-dialog.tsx` antes de chamar a server
  action — não disparar eliminação direta no `onClick`". Registar o resultado de uma
  deliberação de assembleia (potencialmente com efeito legal) devia seguir o mesmo
  padrão antes do único clique que a fixa; e devia existir alguma forma de a corrigir
  depois, mesmo que restrita a admin, em vez de nenhuma.
- **Impacto:** um clique/Enter em falso (comum em navegação só por teclado a meio de uma
  assembleia ao vivo, sob pressão de tempo, ou por ativar por engano o botão vizinho sem
  agrupamento semântico) regista um resultado de deliberação errado sem aviso nem
  confirmação — e, ao contrário do que uma leitura anterior deste achado sugeria, **não
  há forma de o corrigir pela interface depois**, só ficando indefinidamente errado até
  alguém com acesso direto à base de dados intervir (ou, presumivelmente, até o ponto
  deixar de estar `editavel` se a assembleia avançar de estado).
- **Recomendação:** exigir confirmação (`ConfirmDialog` ou equivalente) antes do único
  clique que regista o resultado, já que não há correção possível depois; e, sobretudo,
  acrescentar uma forma de reverter/corrigir um resultado já registado (ex. um botão
  "Corrigir" visível a admin enquanto o ponto continuar `editavel`, que volte a mostrar os
  três botões) — hoje essa capacidade não existe de todo. Agrupar também os três botões
  com `role="group"` e `aria-label="Resultado da deliberação"`.
- **Teste de aceitação proposto:** com NVDA e só teclado, confirmar que registar um
  resultado pede confirmação explícita antes de gravar, e que existe uma forma de o
  corrigir depois sem intervenção direta na base de dados.

### AR2 — `aria-pressed` usado incorretamente nos controlos de "Ler em voz alta"
**Gravidade: Baixa.** Frequência: sempre que o componente é usado (Ajuda, Instruções,
Avisos, Ata). Abrangência: todos os utilizadores de leitor de ecrã que cheguem a este
controlo.
- **Página/módulo:** `components/leitura-voz/leitura-voz-controls.tsx:63,69,75`.
- **Persona afetada:** #7 Rui Antunes, #8 Carla Nogueira.
- **Comportamento observado:** `aria-pressed={false}` no botão "Ler esta secção" (linha
  63) e `aria-pressed={true}` nos botões "Pausar" (69) e "Continuar" (75) — mas são três
  botões **diferentes**, renderizados condicionalmente (só um existe de cada vez no DOM),
  não um único botão que alterna estado. `aria-pressed` destina-se a um botão de
  alternância persistente (ex. "Negrito" ligado/desligado); aqui não tem efeito útil
  porque o botão "pressionado" nunca coexiste com o "não pressionado" para o utilizador
  comparar.
- **Comportamento esperado:** ou remover `aria-pressed` (o texto do botão já muda —
  "Ler esta secção" → "Pausar" → "Continuar" — o que já comunica o estado
  adequadamente), ou usar a região `role="status"` já existente (linha 163-165) como
  única fonte de anúncio de estado.
- **Impacto:** não bloqueia a tarefa (o texto do botão já é suficiente), é uma
  inconsistência semântica que pode confundir um leitor de ecrã mais rigoroso na
  interpretação do atributo.
- **Recomendação:** remover `aria-pressed` dos três botões.

### AR3 — Risco de dupla leitura entre "Ler em voz alta" e um leitor de ecrã real
**Gravidade: Média** (mitigado por aviso textual, não por comportamento). Frequência:
depende do utilizador (só quem usa NVDA/VoiceOver **e** decide clicar no botão).
Abrangência: perfil específico (#7, #8).
- **Página/módulo:** `components/leitura-voz/leitura-voz-controls.tsx:144-149`.
- **Comportamento observado:** existe um aviso textual explícito, mas dentro de um
  `Collapsible` fechado por omissão ("Sobre a leitura em voz alta"): *"Está a utilizar
  uma funcionalidade de leitura do browser. Caso já use um leitor de ecrã (como o NVDA),
  poderá preferir manter esta função desligada"*. Não há nenhuma deteção automática de
  leitor de ecrã ativo (tecnicamente não é possível de forma fiável a partir do
  JavaScript da página) nem aviso mais visível fora do disclosure.
- **Impacto:** um utilizador NVDA que clique em "Ler esta secção" sem abrir o
  disclosure informativo ouve duas vozes simultâneas (a do NVDA a navegar/anunciar o
  botão, e a do `speechSynthesis` a ler o conteúdo). Como é uma ação explícita (o botão
  não arranca sozinho), o risco é de descoberta acidental, não de comportamento
  automático intrusivo — mitigação parcial já existe.
  Nota positiva confirmada por leitura de código: `use-leitura-voz.ts:283-303` cancela a
  leitura de forma síncrona ao mudar de secção/página ou ao iniciar noutra instância, e
  o texto extraído para fala (`use-leitura-voz.ts:189-220`) já exclui explicitamente
  `[hidden]`, `aria-hidden="true"` e `.sr-only` — não lê "texto invisível" pensado
  só para leitores de ecrã, o que evita um tipo diferente de dupla-leitura (ler texto
  que só devia ser dito pelo NVDA).
- **Recomendação:** considerar mover a frase de aviso para fora do disclosure (texto
  sempre visível, pequeno, acima do botão) em vez de dentro de "Sobre a leitura em voz
  alta" — não é uma correção urgente, é uma melhoria de descoberta.
- **Teste de aceitação proposto:** confirmar com um utilizador NVDA real se a colocação
  atual do aviso é suficiente para o encontrar antes de clicar, ou se precisa de estar
  mais visível — só um teste real responde a isto com confiança.

### AR4 — Tabelas financeiras densas sem resumo/orientação prévia para leitor de ecrã
**Gravidade: Média.** Frequência: frequente (Finanças é um módulo central). Abrangência:
perfil específico (#7, #8, #9 Fernando Sousa com zoom).
- **Página/módulo:** `app/(app)/financas/page.tsx` (várias tabelas: movimentos, mapa de
  saldos, mapa mensal, dívidas). Estrutura `TableHead`/`TableHeader` confirmada
  corretamente usada (linhas 170-177 de `assembleias/[id]/page.tsx` como exemplo do
  mesmo padrão partilhado) — a associação técnica cabeçalho↔célula está correta por
  construção (componente `components/ui/table.tsx`, não lido linha a linha nesta
  revisão mas já confirmado como padrão consistente no resto do código).
- **Comportamento observado:** não há nenhum resumo textual antes de cada tabela densa
  (ex. "12 movimentos, total 1.250,00€") — um utilizador de leitor de ecrã só sabe a
  dimensão da tabela ao navegar célula a célula com `Ctrl+Alt+Setas` (`T` para entrar,
  per `GUIA_NVDA_NARRADOR.md` secção 5.8).
- **Comportamento esperado:** um pequeno resumo (`aria-describedby` na tabela ou texto
  visível acima) ajudaria a decidir se vale a pena percorrer a tabela célula a célula ou
  ir direto a outro sítio.
- **Impacto:** aumenta a carga cognitiva e o tempo necessário para um utilizador cego
  perceber "há aqui muita informação" antes de começar a explorar.
- **Recomendação:** melhoria de curto prazo, não crítica — acrescentar uma frase de
  resumo antes das tabelas mais densas.

### AR5 — Nenhum conteúdo multimédia identificado — secção "Pessoas surdas" sem achados negativos
Análise de código não encontrou vídeos, áudios nem gravações na aplicação — não há
legendas/transcrições em falta porque não há conteúdo desse tipo. Toda a comunicação
observada (avisos, atas, mensagens, notificações) é já texto, o que por si só evita
dependência de som. Não foi encontrado nenhum padrão de notificação que dependa
exclusivamente de som (nenhum `<audio>`, nenhum "beep" identificado no código) — os
`toast` (biblioteca `sonner`) são visuais com região `aria-live`, conforme já confirmado
em `ACCESSIBILITY_AUDIT.md`. O suporte da aplicação (contactos) não foi localizado nesta
revisão — não é possível confirmar se depende só de telefone; ficar como pendente de
verificação, não como achado confirmado.

## 3. Pessoas cegas — avaliação específica (secção 12 do pedido)

| Critério | Estado | Evidência |
|---|---|---|
| Concluir tarefas sem rato | Bom, com uma exceção nova | A5/A6 já corrigidos (`ACCESSIBILITY_AUDIT.md`); AR1 acima é o único ponto novo de risco — não é impossibilidade de operar por teclado, é a ausência de qualquer via de correção depois de um clique/Enter errado |
| Ordem de leitura | Não verificável sem NVDA real — código usa HTML semântico (`h1`-`h3`, `ul`/`li`, `table`) na ordem visual em todos os ficheiros lidos, sem posicionamento CSS que inverta a ordem do DOM | Análise de código apenas |
| Contexto dos botões | Bom — todos os botões só-ícone revistos têm `aria-label` (confirmado em `ACCESSIBILITY_AUDIT.md` e nos ficheiros novos lidos aqui: `aria-label="Terminar sessão"`, `"Abrir menu"`, `"Fechar menu"` em `app-shell.tsx`) | Código |
| Identificação de erros | Bom onde já auditado (L3); não revisto de novo aqui | `ACCESSIBILITY_AUDIT.md` |
| Tabelas complexas | Estrutura correta; falta resumo prévio (AR4) | Código |
| Alteração dinâmica de conteúdo | `toast` com `aria-live`; região `role="status"` no leitura-voz; sem outros pontos de mudança dinâmica de relevo encontrados nos ficheiros revistos | Código |
| Foco após abrir/fechar diálogos | Confirmado correto em `ACCESSIBILITY_AUDIT.md` secção 6.2 | Já testado em runtime |
| Distinção entre ações semelhantes | AR1 é exatamente um caso de risco (3 botões parecidos, sem confirmação nem agrupamento) | Código |
| Risco de dupla leitura com "Ler em voz alta" | Mitigado por aviso textual, não por deteção automática (AR3) | Código |

## 4. Pessoas surdas — avaliação específica (secção 12 do pedido)

| Critério | Estado | Evidência |
|---|---|---|
| Dependência exclusiva de som | Não encontrada | Código |
| Alternativas visuais | Toda a comunicação é texto/visual | Código |
| Clareza de notificações | `toast` visível + página `/notificacoes` dedicada (não lida em detalhe nesta revisão) | Parcial |
| Transcrições/legendas | Não aplicável — sem conteúdo multimédia identificado | Código |
| Instruções escritas suficientes | Sim, extensamente (Ajuda, Instruções, guias NVDA) | Código/documentação |
| Contacto de suporte não dependente de telefone | Não verificado nesta revisão | Pendente |

## 5. Limitações desta revisão (não confundir ausência de achado com conformidade)

- **Não foi usado NVDA, VoiceOver, JAWS nem Narrador reais** — tudo o que está acima
  sobre "ordem de leitura", "anúncio de estado" e "dupla leitura" é inferência a partir
  do HTML/ARIA no código-fonte, não confirmação auditiva real.
- **Não foi medido contraste instrumentalmente** para os componentes novos desde a
  verificação A2 (2026-07-22) — reutilizam as mesmas classes Tailwind já validadas, mas
  isso não foi remedido aqui.
- **Zoom 200%/400% não testado em runtime** — a limitação de ferramenta já registada em
  `ACCESSIBILITY_AUDIT.md` (4a.5) mantém-se; esta revisão não teve acesso a um browser
  real com zoom configurável.
- **`prefers-reduced-motion` só confirmado num ponto** (`use-leitura-voz.ts:310`, scroll
  automático durante a leitura) — não foi verificado sistematicamente se outras
  transições/animações da aplicação (ex. abertura de diálogos, drawer mobile) respeitam
  esta preferência; ficheiros de transição não foram todos revistos.
- **Não foram lidas todas as páginas da aplicação** — esta revisão cobriu os módulos
  listados na secção 1, escolhidos por serem os mais usados pelas personas cegas/surdas
  (Painel, Finanças, Assembleias, Avisos, Ata, navegação principal) mais os componentes
  de leitura em voz alta já existentes; não é uma cobertura exaustiva de todas as ~35
  rotas.
- **Tamanho de áreas clicáveis não medido em pixels reais** — só inspeção visual do
  código (classes Tailwind `size="icon"` etc.), sem medição em dispositivo físico.

## 6. Lista consolidada por gravidade

**Alta:** AR1 (deliberação de assembleia sem confirmação).
**Média:** AR3 (risco de dupla leitura, mitigado por texto), AR4 (tabelas densas sem
resumo prévio).
**Baixa:** AR2 (`aria-pressed` incorreto).
**Sem achado / pendente de verificação:** AR5 (pessoas surdas — nada de negativo
encontrado, mas contacto de suporte não verificado).

Estes achados juntam-se a A1-A9 (`ACCESSIBILITY_AUDIT.md`, na sua maioria já corrigidos)
e não os substituem — L4/L5/L6/L8 desse documento (teste real com NVDA, navegação
completa só por teclado, zoom/reflow, teste com pessoa sem formação técnica) continuam
pendentes e são a validação que mais falta para qualquer declaração de acessibilidade
consolidada.
