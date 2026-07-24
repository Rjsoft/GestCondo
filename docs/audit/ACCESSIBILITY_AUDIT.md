# Auditoria de Acessibilidade — GestCondo

Data: 2026-07-22. Âmbito: revisão de código (`app/`, `components/`) mais uma verificação pontual em runtime (árvore de acessibilidade real do Chrome numa página pública, `/sign-in`). Motivada por pedido explícito do utilizador: a aplicação deve ser utilizável com o NVDA ou leitor de ecrã semelhante.

**Isto não é um teste real com o NVDA.** É uma revisão de código mais uma verificação pontual — a única forma de ter a certeza é testar com o leitor de ecrã real (ver secção 5).

Convenção de gravidade: **Alta** (bloqueia ou dificulta muito o uso com leitor de ecrã) · **Média** (fricção real mas contornável) · **Baixa** (boas práticas, robustez) · **Não verificado** (não foi possível confirmar sem ferramenta dedicada).

## 1. O que já está bem resolvido (confirmado)

| Item | Estado | Evidência |
|---|---|---|
| Idioma da página | ✅ | `<html lang="pt-PT">` em `app/layout.tsx` — o NVDA usa a voz/pronúncia portuguesa correta em vez de tentar adivinhar |
| Labels em campos de formulário | ✅ | Padrão `<Label htmlFor="x">` + `<Input id="x">` confirmado em `auth-form.tsx` (login/registo/2FA) e é a convenção documentada no `CLAUDE.md` do projeto para todos os módulos. Verificado também em runtime na `/sign-in`: o `label[for="email"]` está corretamente associado ao `input#email` no DOM |
| Botões só com ícone | ✅ | 13 ficheiros usam `size="icon"` sem texto visível; todos os 13 têm `aria-label` ou um `<span className="sr-only">` a descrever a ação (ex. "Ações", "Editar fornecedor") |
| Imagens | ✅ | As únicas 2 imagens carregadas pelo utilizador (`<img>` do QR code 2FA, `<Image>` de foto de ocorrência) têm `alt` descritivo |
| Indicadores de estado (badges) | ✅ | `components/badges.tsx` — todos os badges de estado/prioridade combinam cor **e** texto (ex. "Urgente", "Resolvida"); nenhum depende só da cor, que é irrelevante para o NVDA mas relevante para baixa visão |
| Foco visível ao navegar por teclado | ✅ | `outline-none` nos componentes base (`button.tsx`, `input.tsx`) é sempre substituído por `focus-visible:ring-3` — não há supressão do indicador de foco sem alternativa |
| Sem `tabIndex` positivo | ✅ | Nenhuma ocorrência no código — não há elementos a saltar a ordem natural de tabulação |
| Sem `<div onClick>` como falso botão | ✅ | Nenhuma ocorrência — elementos clicáveis são sempre `<button>` ou `<a>` |
| Erros de formulário anunciados | ✅ | Erros de autenticação usam `<p role="alert">` (`auth-form.tsx`); erros de outras ações usam `toast.error()` da biblioteca `sonner`, que mantém uma região `aria-live` própria por omissão |
| Estrutura de títulos (`h1`) | ✅ | Todas as 25 páginas têm exatamente um `<h1>` visível — nas páginas de gestão via `PageHeader`, nas de autenticação/onboarding via `<h1>` direto no componente partilhado |

## 2. Achados (a corrigir)

| # | Achado | Gravidade | Detalhe | Recomendação |
|---|---|---|---|---|
| A1 | ~~Sem link de "saltar para o conteúdo"~~ **Resolvido 2026-07-22** | Média | `components/app-shell.tsx` — link `sr-only focus:not-sr-only` como primeiro elemento focável, aponta para `<main id="main-content" tabIndex={-1}>`. Testado: visível ao receber foco por teclado, e ativá-lo move o foco (`document.activeElement`) para o `<main>` | — |
| A2 | ~~Contraste de cor não verificado~~ **Verificado e corrigido 2026-07-22** | Média (era) | Calculado o rácio de contraste real (conversão OKLCH → sRGB linear → luminância relativa → WCAG, fórmula validada contra um valor de referência conhecido) para os 10 pares texto/fundo mais usados em `app/globals.css`. **9/10 passam confortavelmente** (rácios entre 4.57:1 e 18.96:1, mínimo exigido 4.5:1). **1 falha real, confirmada**: `sidebar-primary-foreground` sobre `sidebar-primary` (o item ativo da navegação lateral) tinha só **3.77:1**, abaixo do mínimo — o texto "Finanças" (ou qualquer página ativa) tinha contraste insuficiente contra o fundo azul de destaque. Corrigido: `--sidebar-primary` escurecido de `oklch(0.6 0.14 240)` para `oklch(0.52 0.14 240)`, novo rácio **5.16:1**. Modo escuro já passava (6.54:1) e não foi alterado. Nota: `destructive` sobre `background` passa com margem apertada (4.57:1) — vale a pena ter em atenção se a cor for alguma vez ajustada. | — |
| A3 | Diálogos (`@base-ui/react` Dialog) — foco e `aria-labelledby` não verificados de forma independente | Não verificado | O projeto usa `@base-ui/react`, que documenta suporte a devolução de foco e associação automática do título ao diálogo, mas isto nunca foi testado neste projeto especificamente (nem com o NVDA nem com a árvore de acessibilidade) | Testar com o NVDA real: abrir um diálogo (ex. "Novo fornecedor"), confirmar que o título é anunciado e que o foco fica dentro do diálogo até fechar |
| A4 | Sem teste real com leitor de ecrã | Alta (para o objetivo declarado) | Tudo o que está acima é revisão de código e uma verificação pontual da árvore de acessibilidade — nenhum dos fluxos foi percorrido com o NVDA a correr de facto | Ver secção 5 |

## 3. Falso alarme descartado nesta sessão

Ao inspecionar `/sign-in` com a árvore de acessibilidade do Chrome, o campo de email apareceu identificado como "nome@exemplo.pt" (o `placeholder`) em vez de "Email". Antes de reportar isto como um bug, confirmei diretamente no DOM (`label[for="email"]` → `input#email`) que a associação está correta — o "nome" mostrado pela ferramenta de inspeção é só uma abreviação de exibição, não o nome acessível real computado pelo browser. **Conclusão: não é um problema real**, mas fica registado o método de verificação para não repetir o erro.

## 4. Como isto se relaciona com o resto da app

- Nenhum módulo foi tratado como "pronto" do ponto de vista de acessibilidade — isto é uma auditoria transversal nova, não uma revisão módulo a módulo.
- Relaciona-se com a preocupação já registada sobre utilizadores não tecnicamente literados (`FUNCTIONAL_GAPS.md`, memória de sessão) — acessibilidade a leitor de ecrã é uma extensão direta dessa preocupação, não um requisito à parte.

## 4a. Verificação específica — Fase A.1 (Exercícios e contas financeiras, 2026-07-24)

Revisão de usabilidade/acessibilidade pedida especificamente para esta funcionalidade nova, antes de a considerar concluída em desenvolvimento. Classificações usadas nesta secção: **Confirmado em código** · **Confirmado em runtime** · **Parcial** · **Não testado** · **Lacuna confirmada** · **Não aplicável**.

### 4a.1 Evidência por aspeto

| Aspeto | Código | Runtime | Tecnologia de apoio | Estado |
|---|---|---|---|---|
| Labels e campos (`Label htmlFor` + `Input id`) | Confirmado em código, nos campos revistos | Não testado especificamente | Não testado | Parcial — a associação label/campo não implica, por si só, que mensagens de erro do servidor fiquem associadas ao campo (ver L3) |
| Títulos e descrições dos diálogos (`DialogTitle`/`DialogDescription`) | Confirmado em código, nos 10 diálogos | Foco inicial, `Escape` e devolução de foco: confirmados só no diálogo "Criar exercício financeiro" | Leitura/anúncio por leitor de ecrã: não testados | Parcial |
| Restantes 9 diálogos | Confirmado em código (mesmo componente-base) | **Não testado individualmente** — comportamento esperado por herdarem o mesmo `Dialog` do `@base-ui/react`, não confirmado um a um | Não testado | Não testado |
| Botão de ações com ícone (`ContaFinanceiraActions`) | Confirmado em código — nome acessível via `<span className="sr-only">Ações</span>` | Não testado | Não testado | Parcial |
| Estados "Aberto/Fechado", "Ativa/Encerrada" | Confirmado em código — texto visível, não só cor | Não testado | Não testado | Confirmado em código |
| Saldo negativo | Confirmado em código — `formatEuro` inclui sinal textual "−" | Não testado | Não testado | Confirmado em código |
| Contraste dos novos componentes | Reutilizam as mesmas classes Tailwind já validadas em A2 | Não recalculado individualmente para os componentes novos | Não aplicável | Parcial — **não afirmar contraste validado especificamente para estes componentes** |
| Assistente — títulos e números de passo | Confirmado em código, visíveis | Retoma após interrupção: confirmada em runtime, com rato + reload de página | Não testado | Parcial |
| Assistente — semântica formal de passo atual | Sem `aria-current="step"` nem "Passo X de 3" | — | Não testado | Parcial (ver L2) |
| Tabelas (`TableHead` presentes) | Confirmado em código | Não testado | Leitura, navegação e associação cabeçalho/célula: não testadas | Parcial |
| Responsividade (`hidden sm:table-cell`/`md:table-cell`) | Confirmado em código | Não testado em viewport real | Não aplicável | Parcial — **não classificar como "responsividade validada"**, ver 4a.4 |
| Erros gerais (`toast.error()`) | Confirmado em código | Comportamento esperado da região `aria-live` da biblioteca `sonner`, **não confirmado nesta sessão** com árvore de acessibilidade nem leitor de ecrã | Não testado | Parcial |
| Erros de campo (ex. IBAN inválido, data em falta) | Sem erro inline nem `aria-describedby` nos fluxos revistos | Não testado | Não testado | Parcial (ver L3) — nem todos os erros do servidor correspondem a um campo individual; distinção feita em L3 |

### 4a.2 Lacunas confirmadas (L1–L8)

**L1 — Aviso essencial dependente de símbolo e `title`**
- Componente: `components/financas/exercicios-tab.tsx:194-195`.
- Evidência: `<span title="...">⚠</span>`.
- Nota de rigor: o atributo `title` pode ser exposto de forma inconsistente por browsers e tecnologias de apoio e, em regra, não constitui uma alternativa suficientemente robusta para transmitir informação essencial — a indicação não deve depender apenas de hover.
- Impacto: a informação de que existe um movimento liquidado sem data de liquidação pode não ser anunciada de forma fiável nem estar disponível de modo evidente para utilização por teclado.
- Gravidade: Média. Prioridade: P2.
- Estado: lacuna confirmada em código.
- Bloqueia desenvolvimento: não. Bloqueia migração técnica: não. Bloqueia declaração de acessibilidade concluída para este fluxo: sim.
- Correção futura recomendada (não aplicada nesta etapa documental): manter o ícone decorativo com `aria-hidden="true"`; acrescentar texto visível ou `sr-only` (ex. "Movimento liquidado sem data de liquidação"); associar via `aria-describedby` quando ligado a um valor/linha específico; o `title` pode permanecer como ajuda visual adicional, nunca como único meio.

**L2 — Passo atual do assistente sem identificação programática suficiente**
- Componente: `components/financas/assistente-configuracao-financeira.tsx`.
- Evidência: números e estados visíveis, sem `aria-current="step"` nem anúncio explícito "Passo X de 3".
- Impacto: utilizadores de leitor de ecrã podem não receber de forma clara a posição atual e o total de passos.
- Gravidade: Média. Prioridade: P2.
- Estado: parcial.
- Bloqueia desenvolvimento ou migração: não. Bloqueia declaração de acessibilidade completa do assistente: sim.
- Correção futura recomendada: representar os passos numa lista ordenada; aplicar `aria-current="step"` ao passo ativo; disponibilizar "Passo X de 3" como texto visível ou `sr-only`; não depender só da cor para distinguir concluído/atual/pendente; garantir que a mudança de passo é anunciada adequadamente.

**L3 — Erros de campo sem associação semântica ao controlo**
- Evidência: erros apresentados sobretudo por `toast.error()`, sem erro inline nem `aria-describedby` nos casos revistos.
- Distinção necessária: **erros de campo** (ex. IBAN inválido, data em falta) vs. **erros gerais** (ex. conflito de exercício, falha de rede, operação não permitida) — nem todos correspondem a um campo individual.
- Impacto: quando o erro corresponde a um campo concreto, o utilizador pode ouvir/ver a mensagem sem identificar imediatamente o controlo a corrigir.
- Gravidade: **Média**. Prioridade: **P2 para os campos críticos da Fase A.1** (ex. IBAN, datas do exercício).
- Estado: parcial.
- Bloqueia migração: não. Bloqueia declaração de formulários plenamente acessíveis: sim.
- Correção futura recomendada — erros de campo: mensagem junto ao campo, `aria-invalid="true"`, ligação via `aria-describedby`, foco no primeiro campo inválido quando adequado, resumo geral opcional no topo. Erros gerais: manter região de estado/alerta, confirmar em runtime que o toast é anunciado, não associar artificialmente a um campo.
- **Tarefa transversal separada**: uniformizar este padrão de erro inline em todo o GestCondo (não só na Fase A.1) é uma melhoria maior, à parte desta correção específica — a decisão de âmbito fica registada aqui, não implementada nesta revisão documental.

**L4 — Ausência de validação real com leitor de ecrã**
- Evidência: não foi realizado teste com NVDA, Narrator, JAWS, VoiceOver ou equivalente, nem para esta fase nem para o resto da aplicação.
- Impacto: não é possível confirmar a experiência real dos diálogos, assistente, tabelas, mensagens, foco e operações críticas.
- Gravidade: Alta para a validação global de acessibilidade. Prioridade: P1.
- Estado: **validação pendente, não defeito de código confirmado**.
- Bloqueia desenvolvimento: não. Bloqueia migração técnica isolada: não. Bloqueia declarar acessibilidade concluída: sim. Recomendado antes do primeiro cliente externo: sim.
- Plano mínimo do teste, quando realizado: navegação global até "Exercícios e contas"; assistente completo; criação de exercício; criação e edição de conta; definição e correção de saldo; associação em massa; fecho e reabertura; avisos e erros; tabelas e ações por linha; interrupção e retoma; navegação exclusivamente por teclado; leitura dos estados e totais financeiros. Registar por sessão: sistema operativo, browser e versão, leitor de ecrã e versão, data, fluxo, resultado, problema encontrado, gravidade, evidência, correção e reteste.

**L5 — Percurso completo apenas por teclado não testado**
- Tipo: lacuna de validação.
- Evidência: apenas abertura, fecho por `Escape` e devolução do foco foram verificados num diálogo.
- Impacto: não está confirmado que os principais fluxos possam ser concluídos sem rato.
- Gravidade: Alta. Prioridade: P1.
- Correção recomendada: testar todos os diálogos e pelo menos um percurso financeiro completo exclusivamente por teclado.
- Bloqueio: bloqueia declarar navegação por teclado validada; não bloqueia desenvolvimento nem migração técnica isolada.

**L6 — Zoom, reflow e ecrãs pequenos não testados**
- Tipo: lacuna de validação.
- Evidência: classes responsivas confirmadas em código, mas sem teste real a 200% de zoom, viewport estreito, telemóvel ou tablet.
- Impacto: tabelas, diálogos ou informação escondida por breakpoint podem ficar inacessíveis ou exigir scroll horizontal excessivo.
- Gravidade: Média. Prioridade: P2.
- Correção recomendada: testar 200% de zoom, reflow, viewports estreitos, orientação vertical/horizontal, telemóvel e tablet.
- Bloqueio: bloqueia declarar responsividade acessível validada; não bloqueia desenvolvimento.

**L7 — Contraste específico dos novos componentes não verificado**
- Tipo: lacuna de validação.
- Evidência: foram reutilizadas classes já usadas na aplicação, mas não houve medição específica dos novos avisos, badges, estados desativados e textos secundários.
- Impacto: pode existir contraste insuficiente em estados específicos não abrangidos pela auditoria anterior (A2).
- Gravidade: Média. Prioridade: P2.
- Correção recomendada: medir os pares reais de foreground/background dos novos componentes.
- Bloqueio: bloqueia afirmar contraste validado para a Fase A.1; não bloqueia desenvolvimento.

**L8 — Teste com pessoa sem formação técnica não realizado**
- Tipo: lacuna de validação de usabilidade inclusiva.
- Evidência: os fluxos foram verificados por pessoas familiarizadas com o projeto.
- Impacto: não está confirmado que um administrador residente sem formação informática ou contabilística compreenda e conclua o percurso sem ajuda.
- Gravidade: Média. Prioridade: P2.
- Correção recomendada: sessão moderada com pessoa que não participou no desenvolvimento.
- Bloqueio: não bloqueia desenvolvimento; bloqueia considerar a facilidade de utilização universal validada.

### 4a.3 Validações ainda não realizadas (não são defeitos confirmados, só ausência de teste)

- Os restantes 9 diálogos, não testados individualmente em runtime.
- Navegação completa por teclado de um fluxo inteiro (só abertura/fecho de 1 diálogo foi testada).
- Leitor de ecrã (NVDA ou outro) — ver L4.
- Zoom a 200%.
- Reflow.
- Contraste específico dos componentes novos.
- Telemóvel físico.
- Tablet físico.
- Orientação horizontal/vertical.
- Teste com pessoa sem formação técnica ou contabilística.
- Teste com utilizador que não participou no desenvolvimento.
- Árvore de acessibilidade do browser (usada na auditoria original para `/sign-in`, não repetida para a Fase A.1).
- Anúncios de sucesso e erro confirmados com tecnologia de apoio real.
- Prevenção de submissão duplicada, verificada em runtime.

### 4a.4 Matriz por fluxo

Regras desta matriz: "Runtime geral" pode indicar teste só com rato; "Teclado" só é confirmado quando o fluxo completo foi percorrido sem rato; "Leitor de ecrã" permanece "Não testado" em todos os fluxos; um fluxo testado só com rato não recebe estado global "Acessível" — recebe "Parcial".

| Fluxo | Código | Runtime geral | Teclado | Leitor de ecrã | Estado |
|---|---|---|---|---|---|
| Separador "Exercícios e contas" | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Assistente de configuração inicial | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Criação de exercício | Confirmado | Confirmado (rato) | Abertura/fecho do diálogo testados | Não testado | Parcial |
| Criação de conta financeira | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Edição de conta financeira | Confirmado | Não testado | Não testado | Não testado | Parcial |
| Definição/correção de saldo inicial | Confirmado | Não testado | Não testado | Não testado | Parcial |
| Associação de movimentos a exercício | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Associação de movimentos a conta | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Fecho de exercício | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Reabertura de exercício | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Transporte de saldos | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Encerramento de conta | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Estados vazios | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Mensagens de erro | Confirmado | Confirmado (rato, 1 caso) | Não testado | Não testado | Parcial |
| Avisos (fecho com pendências) | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Confirmações de operações críticas | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Tabelas e cartões | Confirmado | Confirmado (rato) | Não testado | Não testado | Parcial |
| Responsividade | Confirmado (classes) | Não testado em viewport real | Não aplicável | Não aplicável | Não testado |
| Interromper/retomar assistente | Confirmado | Confirmado (rato, reload) | Não testado | Não testado | Parcial |

### 4a.5 Responsividade, zoom e área de ecrã

A presença de classes responsivas e a reutilização do padrão visual existente confirmam a intenção técnica, mas **não substituem testes de viewport, zoom, reflow e dispositivos reais**. Pendente de validação:

- 320 CSS px de largura.
- Zoom a 200%.
- Ausência de scroll horizontal bidimensional nos fluxos principais.
- Diálogos em ecrã pequeno.
- Tabelas com colunas ocultas e alternativa à informação omitida.
- Largura útil em desktop.
- Orientação móvel.
- Tamanho das áreas clicáveis.

A tarefa transversal de aproveitamento da área de ecrã (UI-001) permanece relacionada, mas não deve ser confundida com acessibilidade validada.

### 4a.6 Linguagem simples e acessibilidade cognitiva

A acessibilidade inclui compreensão — os fluxos financeiros devem usar linguagem simples e explicar termos contabilísticos no momento em que surgem. Confirmado por leitura de código que os seguintes termos têm explicação inline no momento em que aparecem: "exercício financeiro", "saldo inicial", "conta transitória", "transportar saldos", "movimento liquidado" (via mensagens de aviso), "fechar exercício" (consequências explicadas na descrição do diálogo), consequências da reabertura, mensagens de bloqueio, operações em massa (pré-visualização antes de confirmar). O termo "reconciliação" não é usado nesta funcionalidade (usa-se "conciliação", já existente noutra tab).

Classificação: linguagem simples — observada por leitura de código. Compreensão por utilizadores não técnicos — **ainda não validada**. Teste com pessoa sem formação técnica/contabilística — recomendação importante antes do primeiro cliente externo.

### 4a.7 Estado documental

A Fase A.1 segue as convenções de acessibilidade já adotadas no projeto e apresenta várias evidências positivas de código. Foi validada funcionalmente em desenvolvimento, sobretudo com rato, e apenas um diálogo teve foco e Escape confirmados diretamente. Não foi realizada validação completa por teclado, leitor de ecrã, zoom, reflow ou dispositivos físicos. Por isso, **não pode ser declarada plenamente acessível nem compatível com tecnologias de apoio**. Permanece implementada e validada em desenvolvimento, pendente de promoção e validação em produção e de validação específica de acessibilidade.

### 4a.8 Critérios para considerar a acessibilidade da Fase A.1 validada

| Critério | Estado atual |
|---|---|
| L1 corrigida | Pendente |
| L2 corrigida | Pendente |
| Erros críticos de campo com associação inline adequada | Pendente |
| Todos os diálogos percorridos por teclado | Pendente |
| Fluxo principal concluído sem rato | Pendente |
| Teste real com NVDA concluído | Pendente |
| Zoom e reflow a 200% testados | Pendente |
| Telemóvel e tablet verificados | Pendente |
| Contraste dos novos estados confirmado | Pendente |
| Teste com pessoa sem formação técnica concluído | Pendente |

Enquanto estes critérios não estiverem suficientemente concluídos e documentados, o estado mantém-se **"parcialmente verificada em desenvolvimento"**, sem declaração de conformidade integral ou compatibilidade comprovada com leitores de ecrã.

## 5. Próximo passo recomendado

1. ~~**Correção imediata e barata**: A1 (skip link)~~ — **feito 2026-07-22.**
2. ~~**Verificação de contraste**: A2~~ — **feito 2026-07-22**, calculado matematicamente (sem depender de Lighthouse/axe) e corrigido o único par que falhava.
3. **Teste real com o NVDA**: A3, A4 — percorrer os fluxos principais (login, criar um movimento, abrir um diálogo, navegar pela tabela de finanças) com o NVDA a correr, idealmente feito pelo utilizador ou por alguém que o utilize no dia a dia — é o único teste que conta como prova real de que a app "funciona com o NVDA". Continua por fazer, e é o único achado que resta desta auditoria.
