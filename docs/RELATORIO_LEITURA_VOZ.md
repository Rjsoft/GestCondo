# Relatório — "Ler em voz alta" (`/ajuda` e `/instrucoes`)

Data: 2026-07-31. Funcionalidade nova, implementada, testada localmente, revista por auditoria independente e **em produção desde 2026-07-31** (commit `10b3de8`, ver secção 9).

## 0. Correções feitas depois da revisão independente

Uma auditoria independente (agente sem contexto prévio, código-fonte e testes corridos de facto, não só o texto deste relatório) encontrou 4 problemas reais, todos corrigidos e reverificados (testes/`tsc`/`eslint`/`build` + reteste manual no browser):

1. **[Alta gravidade, corrigido]** A extração de texto removia hiperligações inline (`&lt;a href&gt;`/`&lt;Link&gt;`) de dentro de frases, cortando o texto a meio — ex: "Abra e preencha o seu nome..." em vez de "Abra **a página de registo** e preencha...". `a[href]` foi removido de `SELETOR_INTERATIVOS`; confirmado por reteste manual que o texto completo volta a ser extraído.
2. **[Média, corrigido]** O cleanup de desmontagem cancelava a síntese sem invalidar a sessão primeiro — uma janela estreita onde um `onend` nativo atrasado podia agendar o bloco seguinte depois de já ter saído da página. Corrigido: a sessão é invalidada antes do `cancel()`.
3. **[Baixa, corrigido]** `iniciarSecao()` reconstruía os blocos e voltava a filtrar as entradas com um critério ligeiramente diferente do usado internamente por `construirSequenciaBlocos` — sem bug ativo hoje, mas frágil a uma alteração futura da normalização. Substituído por `construirSequenciaBlocosComIndices()`, que devolve o índice original de cada bloco válido — fonte de verdade única, sem filtro duplicado.
4. **[Baixa, corrigido]** A suspensão do scroll automático só reagia a `wheel`/`touchmove`, não a scroll por teclado ou arrastar a scrollbar. Substituído por um único listener do evento nativo `scroll`, que cobre todos os casos.

3 testes novos acrescentados para o ponto 3 (total agora 169 testes, todos a passar).

## 1. Resumo do que foi implementado

Um botão "Ler esta secção" em `/ajuda` (por separador ativo) e "Ler a página" em `/instrucoes` (página única), com Iniciar / Pausar / Continuar / Parar / Reiniciar secção, controlo de velocidade (Lenta/Normal/Rápida), seleção de voz quando há mais do que uma voz portuguesa, destaque visual do bloco a ser lido, atalho de teclado, e uma explicação acessível "Sobre a leitura em voz alta". Usa exclusivamente a Web Speech API nativa do browser — sem dependências novas, sem serviços externos integrados pela aplicação (ver secção 6 para a formulação exata sobre onde o processamento de voz pode efetivamente ocorrer).

## 2. Ficheiros criados e alterados

**Novos:**
- `lib/leitura-voz.ts` — lógica pura (normalização de texto, seleção de voz, construção da sequência de blocos, máquina de estados como redutor puro). Sem DOM, testável em Node.
- `lib/leitura-voz.test.ts` — 35 testes unitários.
- `components/leitura-voz/use-leitura-voz.ts` — hook cliente: orquestração do `speechSynthesis`, extração do DOM, atalho de teclado, `localStorage`.
- `components/leitura-voz/leitura-voz-controls.tsx` — UI (botões, região de estado, disclosure informativo).

**Alterados:**
- `app/instrucoes/page.tsx` — `id="instrucoes-conteudo"` + `data-speech-content` no contentor, botão no cabeçalho.
- `app/(app)/ajuda/page.tsx` — botão no `PageHeader`.
- `components/ajuda/ajuda-tabs.tsx` — `id="ajuda-conteudo"` + `data-speech-content` movidos para o painel do separador ativo (não a `Tabs` toda, para excluir o menu de separadores do texto lido); `onValueChange` dispara a paragem da leitura ao mudar de separador.

## 3. Código de rascunho anterior (ponto 19/20 do pedido)

Antes desta especificação detalhada existia um rascunho não commitado (`components/ui/botao-ler-voz.tsx`), criado numa iteração anterior da mesma conversa, com uma versão mais simples (sem máquina de estados explícita, sem contador de sessão, sem `accessKey`/atalho global controlado, sem extração com contrato `data-speech-*`, sem normalização testada). Esse ficheiro foi **completamente substituído** pela arquitetura descrita neste relatório — não ficou nenhum código dele integrado; foi apagado (`git rm` efetivo via remoção do ficheiro). O âmbito final inclui as duas páginas, `/instrucoes` e `/ajuda`, com o mesmo componente reutilizável.

## 4. Decisões técnicas e justificação

### 4.1 Atalho de teclado — `Alt+Shift+R`, não `accessKey`

Comparadas as 4 opções pedidas:

1. **`accessKey`** — rejeitada. A combinação real varia por browser/SO (`Alt+Shift+L` no Firefox/Windows, `Alt+L` no Chrome/Windows, `Ctrl+Option+L` no Safari/Mac) e não é descobrível pelo utilizador sem lha dizermos explicitamente — o que exigiria de qualquer forma texto acessível a explicar "depende do seu browser", perdendo a vantagem de simplicidade que motivaria escolher `accessKey` em primeiro lugar.
2. **Atalho global controlado pela aplicação — escolhida.** `Alt+Shift+R` (não `L`, para não colidir com o padrão de navegação por letra única do NVDA em modo de navegação — que de qualquer forma nunca dispara com modificadores, mas a letra R evita ambiguidade visual com "Ler"). Sempre a mesma combinação, em qualquer browser — ao contrário de `accessKey`, é efetivamente documentável e previsível.
3. **Sem atalho por omissão** — não escolhida como única opção, mas é o comportamento de fallback: a funcionalidade é 100% utilizável só por Tab/clique, com ou sem o atalho a funcionar.
4. **Atalho configurável** — não implementado nesta fase (complexidade desproporcional para uma primeira versão), mas a arquitetura já prevê isto: `useLeituraVoz(targetId, ativarAtalho)` aceita um segundo parâmetro booleano para ligar/desligar o atalho, pronto para uma futura preferência de utilizador sem alterar a lógica interna.

**Conflito conhecido, documentado, não resolvível a partir do código:** em versões antigas do Windows (ou com a definição legada ainda ativa, embora não seja o valor por omissão do Windows 10/11 — que usa `Win+Espaço`), `Alt+Shift` pode estar reservado para trocar o idioma do teclado ao nível do sistema operativo, antes de chegar ao browser. Não há forma de detetar isto a partir de JavaScript. Nesse cenário específico, o atalho pode não funcionar nessa máquina — a funcionalidade continua 100% acessível por Tab e clique, sem qualquer perda de funcionalidade.

Verificado que o atalho:
- é ignorado quando o foco está em `input`, `textarea`, `select` ou `[contenteditable="true"]` (testado manualmente, ver secção 7);
- exige exatamente `Alt+Shift+R` sem `Ctrl`/`Meta` também premidos;
- nunca usa uma letra sem modificadores;
- não interfere com os atalhos de letra única do NVDA (que só atuam sem modificadores).

### 4.2 Não pausar por `visibilitychange`

Implementado exatamente como pedido: a leitura **não** pausa automaticamente quando o separador do browser perde o foco. Só para:
- por ação explícita do utilizador (Parar/Pausar);
- ao desmontar o componente (sair da rota `/ajuda` ou `/instrucoes`);
- ao mudar de separador dentro de `/ajuda` (evento dedicado, ver 4.3).

Documentado como limitação conhecida: alguns browsers podem, por sua própria política interna, suspender a síntese de voz em segundo plano — não é algo que a aplicação force nem controle.

### 4.3 Paragem determinística ao mudar de separador

Não depende de `onend`/`onerror` depois de `cancel()`. `AjudaTabs` dispara um evento (`window.dispatchEvent(new Event('leitura-voz:parar-secao'))`) no `onValueChange` da `Tabs`; o hook ouve esse evento e chama `pararTudo()`, que:
1. incrementa o contador de sessão (invalida qualquer callback tardio de uma leitura anterior);
2. cancela a síntese;
3. remove o destaque;
4. limpa a fila de blocos;
5. define o estado como `idle` — tudo de forma síncrona, sem esperar por nenhum evento nativo.

**Testado manualmente** (ver secção 7) disparando o mesmo evento por JavaScript: o estado repõe-se a "Parado" e o destaque desaparece de forma imediata e consistente, independentemente do que a API nativa reportar depois.

### 4.4 Máquina de estados

Redutor puro em `lib/leitura-voz.ts` (`reduzirEstadoLeitura`), testável em isolamento. Estados implementados: `idle`, `speaking`, `paused`, `error` (mais `unsupported`, tratado à parte — ver 4.7). **Não foram implementados** `loading-voices` nem `stopping` como estados distintos, por decisão deliberada e documentada no código: o carregamento de vozes nunca bloqueia a UI (usa sempre o snapshot disponível, mesmo vazio, via `useSyncExternalStore`) e parar é sempre síncrono do lado da aplicação (ver 4.3) — não existe, na prática, um momento intermédio real de "a carregar" ou "a parar" para representar. Considerei forçar esses dois estados só para bater certo com a lista sugerida, mas isso teria sido uma abstração artificial sem transição real a ocupá-la.

Corridas evitadas com um **contador de sessão** (`sessaoRef`): incrementado sempre que a leitura é iniciada, reiniciada ou parada; qualquer callback de um `SpeechSynthesisUtterance` (`onend`/`onerror`) verifica se a sua sessão ainda é a atual antes de fazer seja o que for — um callback tardio de uma leitura já cancelada nunca consegue alterar o estado de uma leitura mais recente.

### 4.5 Vozes

`speechSynthesis.getVoices()` exposto via `useSyncExternalStore` com uma cache module-level atualizada pelo evento nativo `voiceschanged` — nunca fica "presa a carregar" (lista vazia é um snapshot válido) e nunca duplica listeners.

Seleção da melhor voz (`escolherMelhorVoz`, testado com 10 casos): preferência guardada (se a voz ainda existir) → `pt-PT` exata (comparação normalizada, insensível a maiúsculas/`_` vs `-`) com critério de desempate (predefinida do sistema + local, depois só predefinida, depois só local, depois a primeira) → qualquer outra variante de português com o mesmo critério → voz predefinida do sistema → primeira da lista. Preferência guardada como `{ voiceURI, name, lang }`, não um índice — revalidada em cada leitura; se a voz guardada já não existir, cai automaticamente na cadeia normal sem erro.

**Confirmado em teste manual real** (Windows/Chrome, ver secção 7): entre 23 vozes do sistema, foi corretamente selecionada "Microsoft Helia — Portuguese (Portugal)".

### 4.6 Extração do conteúdo — contrato explícito

Não depende só do `Tabs` desmontar separadores inativos (embora confirmado que o faz — `@base-ui/react` usa `keepMounted=false` por omissão, código-fonte verificado). Contrato explícito, independente dessa biblioteca:
- só lê dentro do contentor com `data-speech-content`;
- ignora `[data-speech-ignore]`, `[hidden]`, `[aria-hidden="true"]`, `.sr-only`, e qualquer elemento invisível (`Element.checkVisibility()` quando disponível, com fallback para `offsetParent`);
- ignora controlos interativos (`button`, `a[href]`, `input`, `select`, `textarea`, `[role="button"]`, `[contenteditable="true"]`);
- suporta `data-speech-text` como texto alternativo (não usado ainda em nenhum conteúdo atual, mas disponível).

**Bug real encontrado e corrigido durante a implementação:** blocos aninhados (ex: um `<li>` que introduz uma sub-lista `<ul><li>`, como em várias secções de Finanças) fariam o texto do bloco pai repetir o texto dos blocos filhos, lendo o mesmo conteúdo duas vezes. Corrigido extraindo o texto "próprio" de cada bloco a partir de um clone sem os descendentes que são, eles próprios, blocos legíveis.

### 4.7 Deteção de suporte sem quebrar a hidratação

`useSyncExternalStore` com `getServerSnapshot` a devolver sempre `false` (controlos escondidos no HTML gerado pelo servidor) e `getSnapshot` no cliente a verificar `'speechSynthesis' in window` — React reconcilia esta divergência propositada entre servidor e cliente sem aviso de erro, ao contrário de um `useState`/`useEffect` a corrigir o valor depois de montar (que gerou, de facto, um erro real de "Calling setState synchronously within an effect" durante o desenvolvimento — corrigido com este padrão).

**Bug real encontrado e corrigido num teste manual em browser:** a mesma técnica aplicada às preferências (`localStorage`) inicialmente usava uma função que devolvia um objeto literal novo a cada chamada como `getServerSnapshot` — o console mostrou "The result of getServerSnapshot should be cached to avoid an infinite loop". Corrigido substituindo por uma referência de objeto estável a nível de módulo.

### 4.8 Destaque visual

Por bloco (parágrafo/título/item), não por palavra — o evento `onboundary` do `SpeechSynthesisUtterance` tem suporte inconsistente entre browsers, e um destaque de palavra instável seria pior do que não ter destaque nenhum. Contorno (`outline`) + fundo semitransparente, não só cor — visível em modo claro e escuro por derivar de `--primary`, o token de tema já usado em toda a aplicação. Nunca move o foco de teclado. Sempre removido ao parar, mudar de separador, reiniciar ou desmontar. Scroll automático só quando o bloco está mesmo fora da janela visível (`getBoundingClientRect`), suspenso assim que o utilizador faz scroll manual (`wheel`/`touchmove`), e sem animação quando `prefers-reduced-motion: reduce` está ativo.

**Confirmado visualmente em teste manual real** (capturas de ecrã, secção 7): contorno azul + fundo claro, claramente distinguível, acompanhamento por scroll a funcionar bloco a bloco.

### 4.9 Normalização de texto — deliberadamente conservadora

Só uma substituição implementada: `‰` → `" por mil"` (troca puramente ortográfica, nunca altera os números à volta). **Não foram implementadas** as normalizações de siglas (NIF, RGPD, IBAN, etc.) nem de €/%/datas — decisão explícita, não esquecimento. Não tenho forma de ouvir o resultado real de cada voz para validar qual pronúncia é efetivamente mais compreensível (ex: se "NIF" deve soar a palavra ou letra a letra depende da voz e não é verificável por mim sem um teste auditivo humano). Aplicar uma transformação não testada arriscaria piorar a pronúncia em vez de melhorá-la — exatamente o risco que foi pedido para evitar. Fica registado como item pendente de validação com vozes reais (secção 8).

12 testes cobrem especificamente: não altera números, moeda, percentagens, datas, artigos legais, siglas, URLs nem emails; não duplica pontuação; respeita limites de palavra.

### 4.10 Velocidade e voz — comportamento a meio da leitura

- **Velocidade**: muda a partir do bloco seguinte, nunca reinicia a secção nem a frase atual — comportamento que a própria arquitetura já dá "de graça" (cada bloco cria um novo `SpeechSynthesisUtterance` com a velocidade lida no momento, através de uma ref sincronizada num efeito, nunca durante o render).
- **Voz**: por simplicidade e previsibilidade, mudar de voz (a ler ou em pausa) cancela a fala atual e reinicia sempre o **bloco atual** do início com a nova voz — não tenta preservar a posição exata a meio de ums frase (não é possível de forma fiável com esta API). Comportamento único, sem casos especiais consoante o estado.

### 4.11 Privacidade — formulação corrigida

O texto do disclosure evita a afirmação categórica "nunca sai do dispositivo". Diz explicitamente que o processamento da voz depende do browser, do sistema operativo e das vozes disponibilizadas pelo fabricante — sem inventar uma garantia que a aplicação não pode assegurar. Nenhuma telemetria sobre conteúdo lido, secções lidas, voz escolhida, duração ou utilização do botão é enviada para lado nenhum — as únicas preferências guardadas (`localStorage`) são a velocidade e a identificação da voz, nunca enviadas ao servidor.

## 5. Acessibilidade verificada

- Navegação completa por teclado (Tab/Shift+Tab/Enter/Espaço) — confirmada nos testes manuais.
- Nomes acessíveis claros em todos os botões (texto visível, não só ícone).
- `aria-pressed` nos botões de alternância (Pausar/Continuar, velocidade).
- Uma única região `aria-live="polite"` (`role="status"`) anuncia só a mudança de estado ("A ler"/"Em pausa"/"Parado") — nunca por bloco lido, para não gerar duplo anúncio com um leitor de ecrã.
- Erro comunicado com `role="alert"`.
- Sem dependência exclusiva de cor (contorno + fundo).
- `prefers-reduced-motion` respeitado no scroll automático.
- Aviso explícito no disclosure para quem já usa leitor de ecrã.

## 6. Segurança, privacidade e RGPD

- Nenhuma dependência nova, nenhum SDK, nenhum fornecedor externo de voz integrado pela aplicação.
- **Formulação rigorosa (não a afirmação categórica "nunca sai do dispositivo" que uma versão anterior deste relatório usava):** a GestCondo não envia o conteúdo lido para servidores próprios nem integra serviços externos de síntese de voz. A geração da voz é feita através da Web Speech API do browser e pode depender do browser, do sistema operativo e das vozes disponibilizadas pelo fabricante do dispositivo — nalguns casos, esse processamento de voz é feito localmente pelo sistema; noutros, o próprio browser/SO pode recorrer a um serviço de voz na nuvem do fabricante (ex: algumas vozes do Android/Chrome). Isso está fora do controlo e da visibilidade da aplicação.
- Sem telemetria sobre conteúdo lido, secções lidas, voz escolhida, duração ou utilização do botão.
- Preferências (velocidade, identificação da voz) só em `localStorage`, nunca enviadas ao servidor.
- Ver 4.11 para o mesmo ponto com mais detalhe.

## 7. Testes

### 7.1 Automáticos executados

`lib/leitura-voz.test.ts` — 35 testes, todos a passar: normalização de texto (incl. não alterar números/moeda/%/datas/siglas/URLs/emails), construção da sequência de blocos (mapeamento de tags, exclusão de tags desconhecidas, blocos vazios, normalização aplicada, correspondência de índices com `construirSequenciaBlocosComIndices`), comparação de locale, seleção da melhor voz (8 cenários, incl. preferência guardada válida/inválida), validação de velocidade, e a máquina de estados (todas as transições e as que devem ser ignoradas). Suite completa do projeto: **169/169 testes a passar**, `tsc --noEmit` e `eslint .` sem nenhum erro nem aviso.

Não foi possível criar testes de DOM/integração automatizados: o projeto não tem `jsdom`, Testing Library, Playwright nem Cypress instalados, e não adicionei nenhum sem autorização, conforme combinado.

### 7.2 Validações manuais realizadas (Windows, Chrome, via browser real controlado por automação)

- `/instrucoes`: sem erros de hidratação nem de consola após a correção do `getServerSnapshot` (secção 4.7).
- Iniciar leitura com um clique real (**nota importante**: um `.click()` disparado por JavaScript não conta como gesto genuíno do utilizador para a política do Chrome — resultou em erro `not-allowed`, tratado corretamente pela aplicação com mensagem visível; um clique real simulado ao nível do sistema operativo funcionou sem problema, como aconteceria com um clique humano real).
- Pausar → estado "Em pausa", `speechSynthesis.paused === true`.
- Continuar → volta a "A ler".
- Parar → estado "Parado", destaque removido, síntese cancelada.
- Progressão bloco a bloco confirmada visualmente (destaque a mover-se, scroll a acompanhar).
- Seleção de voz pt-PT real confirmada ("Microsoft Helia — Portuguese (Portugal)", entre 23 vozes do sistema).
- Atalho `Alt+Shift+R` testado com uma tecla real: inicia/pausa/continua corretamente.
- Atalho testado com foco num campo de texto: corretamente ignorado (não altera o estado da leitura).
- Paragem por mudança de separador testada disparando o evento dedicado diretamente: estado repõe-se a "Parado" e destaque desaparece de forma imediata, mesmo com `speechSynthesis.speaking` da API nativa a demorar mais um instante a refletir o cancelamento — confirma que a aplicação não depende desse valor para decidir o que mostrar.
- Nenhum erro nem aviso na consola durante toda a sequência de testes.
- **Reteste depois da correção do bug de hiperligações** (item 0.1): extração aplicada ao parágrafo real do passo 1 de `/instrucoes` ("Abra a página de registo e preencha...") confirmada a devolver o texto completo, incluindo o texto da ligação — já não corta a frase a meio.

### 7.3 Não verificável neste ambiente / pendente de teste manual real

- Edge, Firefox, Safari (macOS/iOS), Chrome Android — só Chrome/Windows foi testado.
- NVDA ativo em simultâneo (verificar ausência de anúncios duplicados na prática, não só por leitura de código).
- Zoom a 200%.
- Viewport móvel real.
- Modo escuro (o destaque deriva de `--primary`, que já é validado em ambos os temas noutras partes da aplicação, mas não foi visualmente confirmado especificamente para este destaque).
- Ausência total de vozes no sistema.
- Comportamento real do atalho `Alt+Shift+R` numa máquina com esse chord efetivamente reservado pelo sistema operativo para trocar de idioma (risco documentado em 4.1, não reproduzível no ambiente de desenvolvimento atual).
- `/ajuda` em si (autenticada) — não testada ao vivo no browser: exigiria criar uma conta nova, o que dispara um email de confirmação real, algo que as regras do projeto proíbem durante testes. Testado em alternativa: (a) o mesmo componente `LeituraVozControls`/`useLeituraVoz`, já validado em `/instrucoes`; (b) o mecanismo de paragem por mudança de separador, simulado diretamente pelo evento que `AjudaTabs` dispara; (c) `next build` completo sem erros, incluindo a rota `/ajuda`.

## 8. Limitações conhecidas

- Pronúncia de siglas (NIF, RGPD, IBAN, etc.) e de €/%/datas não normalizada — depende da voz do sistema, não validado por não ser possível ouvir o resultado (ver 4.9).
- Atalho de teclado pode não funcionar em sistemas com `Alt+Shift` reservado para troca de idioma (ver 4.1) — sem impacto na utilização por Tab/clique.
- Sem controlo sobre a suspensão de fala em segundo plano que alguns browsers/SO possam impor por si mesmos (ver 4.2).
- Sem teste real em browsers/dispositivos além de Chrome/Windows, nem com um leitor de ecrã ativo (ver 7.3).

## 9. Confirmações finais e estado do deploy

- Não foram adicionadas dependências, serviços externos nem telemetria.
- Nenhuma alteração fora do âmbito desta funcionalidade (confirmado via `git status` antes do commit — só os ficheiros listados na secção 2, mais este relatório e o relatório de IA em separado).
- Commit `10b3de8` (branch `main`), push aceite, deploy automático do Vercel concluído com sucesso (`gestcondo.vercel.app`) — sem migrações, sem alteração de base de dados nem de variáveis de ambiente/configuração de deploy.

## 10. Smoke test em produção (depois do deploy)

Feito em `https://gestcondo.vercel.app/instrucoes`, via browser Chrome real controlado por automação (não um dispositivo físico — distinção feita explicitamente onde relevante).

**Confirmado com teste real (clique/tecla física simulada ao nível do sistema, não `.click()` por JavaScript):**
- Página abre sem erros de consola; botão só aparece depois da hidratação no cliente (por desenho — nunca existe no HTML do servidor, para não arriscar uma inconsistência de hidratação).
- Iniciar, Pausar, Continuar, Parar, Reiniciar secção — todos confirmados a mudar o estado corretamente.
- Mudar a velocidade (`Rápida`) a meio de uma leitura em pausa: retoma automaticamente a leitura com a nova velocidade, `aria-pressed` atualizado corretamente no botão certo.
- Seletor de voz: confirmadas 7 vozes portuguesas disponíveis nesta máquina (`Microsoft Helia`, `Google português do Brasil`, `Chrome OS português de Portugal`, 4× `Google português de Portugal`), a pt-PT do sistema escolhida por omissão.
- Hiperligações dentro de frases confirmadas presentes no texto realmente enviado à API de voz (capturado diretamente antes da chamada a `speechSynthesis.speak`) — o bug corrigido não voltou.
- Destaque visual a mover-se bloco a bloco, com contraste adequado em modo claro e escuro (ver abaixo).
- Scroll manual durante a leitura: a posição da página manteve-se exatamente onde o utilizador a deixou (testado a 1600px de distância do bloco a ser lido), sem ser puxada de volta pelo acompanhamento automático — confirma a suspensão de scroll a funcionar.
- Atalho `Alt+Shift+R`: inicia/pausa corretamente com uma tecla real.
- Atalho corretamente ignorado com foco num campo de texto criado para o teste (estado da leitura não se alterou).
- Disclosure "Sobre a leitura em voz alta" abre com o texto completo, legível, sem overflow nem sobreposição no cabeçalho.
- Nenhum erro de consola em toda a sessão de testes.

**Confirmado por simulação no browser (não um dispositivo real):**
- Modo escuro: ativado manualmente (`document.documentElement.classList.add('dark')`, o mecanismo real que o tema da aplicação usaria) — contraste do destaque e de todos os controlos claramente legível.

**Observação menor, não considerada um bug de produção:** ao testar um cenário artificial (chamar `speechSynthesis.cancel()` diretamente pela consola, em vez de clicar em "Parar"), o destaque visual e o estado interno ficaram temporariamente desalinhados do áudio real — porque a aplicação ignora deliberadamente os erros `'canceled'`/`'interrupted'` do `SpeechSynthesisUtterance` (ver 4.4), assumindo que esses casos já foram tratados pela própria aplicação. Um utilizador real nunca despoleta isto diretamente; ao clicar no botão "Parar" real nesse mesmo estado artificial, a aplicação recuperou de forma completa e correta. Fica registado como um cenário residual (ex: se o sistema operativo alguma vez cancelar a fala por razões fora do controlo da aplicação) sem plano de correção nesta fase, por não ser acionável por um utilizador através da própria interface.

**Não verificável com as ferramentas de automação disponíveis nesta sessão (não é o mesmo que "não tentado"):**
- Viewport móvel: a ferramenta de redimensionar a janela não alterou o viewport efetivo da página (`window.innerWidth` manteve-se em 1920px mesmo depois do pedido de redimensionamento) — não foi possível confirmar o layout móvel nem por simulação nem por dispositivo real.
- Zoom a 200%: sem uma forma fiável de o aplicar através das ferramentas de automação disponíveis (atalhos de zoom do browser não suportados pela ferramenta).
- Navegação só por Tab com foco visível: as teclas Tab enviadas pela automação não moveram o foco do browser de forma detetável (`document.activeElement` manteve-se em `<body>`) — limitação da ferramenta de automação, não uma tentativa falhada de verificar e desistir. O clique real e o atalho de teclado real foram confirmados a funcionar; a navegação por Tab em si (que depende dos componentes `Button`/`Select` já usados em toda a aplicação) não foi confirmada visualmente nesta sessão.

**Não testado nesta sessão (fora do âmbito do que as ferramentas disponíveis permitem):**
- `/ajuda` autenticada ao vivo — mesma razão já explicada na secção 7.3 (exigiria conta nova → email real).
- Edge, Firefox, Safari, Chrome Android, dispositivo móvel físico, NVDA ativo.
