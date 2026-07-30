# Manual de utilização da GestCondo com NVDA ou Narrador

Data: 2026-07-30. Para quem usa a GestCondo com um leitor de ecrã (NVDA ou o Narrador do Windows) e navega **só com o teclado, sem rato**. Não é preciso saber nada de programação.

Este manual nasceu de um teste real feito por um utilizador cego em 2026-07-29, que reportou dificuldade em navegar só por teclado. Nessa sequência, foi corrigido um problema real confirmado no código (os botões "Anterior"/"Seguinte" de paginação ficavam com um estado "desativado" que o leitor de ecrã não anunciava — ver `docs/audit/ACCESSIBILITY_AUDIT.md`, achado A5) e verificados, um por um, todos os outros padrões de botões/menus/formulários usados na aplicação. Este manual explica como usar esses padrões — muitos dos quais têm atalhos que não são óbvios se ninguém os disser.

## 1. Antes de começares

- **Browser recomendado**: Chrome ou Edge. Não foram testados noutros browsers.
- Este manual assume que já sabes o básico do teu leitor de ecrã (como o ligar, como navegar numa página em geral). O que se segue é específico da GestCondo — os sítios onde a forma "normal" de navegar (só `Tab`) não é a mais eficiente, e o que fazer em vez disso.

## 2. Os dois modos do teu leitor de ecrã

Tanto o NVDA como o Narrador têm dois modos quando estás numa página web:

- **Modo de navegação/exploração**: as setas movem-te frase a frase, palavra a palavra, pelo texto da página (é o modo em que entras por omissão ao abrir uma página). É aqui que funcionam os atalhos de letra única (ver secção 3).
- **Modo de formulário**: ativa-se automaticamente ao entrares num campo de texto, ou podes ativá-lo à mão. Aqui, as teclas passam a ir para o campo (escreves normalmente) e usas `Tab`/`Shift+Tab` para saltar para o campo seguinte/anterior.

Se sentires que as setas "não fazem nada" ou que estás preso a escrever letras que não aparecem em lado nenhum, confirma em que modo estás — é a causa mais comum de confusão.

## 3. Atalhos essenciais do NVDA (modo de navegação)

Só os que valem mesmo a pena para a GestCondo:

| Tecla | O que faz |
|---|---|
| `H` / `Shift+H` | Salta para o título seguinte/anterior (cada página da GestCondo tem exatamente um título principal — H1 — e alguns têm subtítulos) |
| `D` / `Shift+D` | Salta para a região seguinte/anterior (ex.: passar do menu lateral para o conteúdo principal) |
| `Tab` / `Shift+Tab` | Salta para o elemento interativo seguinte/anterior (links, botões, campos) |
| `B` / `Shift+B` | Salta para o botão seguinte/anterior |
| `F` / `Shift+F` | Salta para o campo de formulário seguinte/anterior |
| `T` | Salta para a tabela seguinte |
| `Insert+F7` | Lista de todos os links/títulos/botões da página, para escolher diretamente |
| `Ctrl+Alt+Setas` | Dentro de uma tabela (depois de entrares nela), navega célula a célula |

## 4. Narrador do Windows — o essencial

Os atalhos do Narrador podem variar ligeiramente consoante a versão do Windows. Se algum destes não funcionar exatamente assim, pressiona `Caps Lock+F1` (com o Narrador ligado) para veres a lista de comandos da tua versão — é a fonte mais fiável.

| Tecla | O que faz |
|---|---|
| `Ctrl+Win+Enter` | Liga/desliga o Narrador |
| `Caps Lock+Espaço` | Alterna entre modo de exploração e modo de formulário |
| `H` / `Shift+H` (em modo de exploração) | Título seguinte/anterior |
| `Tab` / `Shift+Tab` | Igual em qualquer leitor de ecrã — elemento interativo seguinte/anterior |
| `Caps Lock+F1` | Ajuda com a lista completa de comandos |

## 5. Como a GestCondo está organizada (o que precisas de saber sobre esta app em particular)

### 5.1 Ao abrir qualquer página

O **primeiro** `Tab` numa página foca sempre um link chamado "Saltar para o conteúdo", que normalmente não é visível. Pressiona `Enter` nele para ires diretamente para o conteúdo da página, sem teres de passar pelos ~15 itens do menu lateral de cada vez. **Isto poupa imenso tempo** — usa-o sempre que já conheceres o menu lateral e só quereres chegar ao conteúdo.

### 5.2 O menu lateral

É uma lista de links normais (Painel, Notificações, Pesquisa, Finanças, Avisos, Ocorrências, Documentos, Mensagens, Fornecedores, Frações, Condóminos, Assembleias, Auditoria, Condomínio, Ajuda, Os meus dados), cada um levando-te diretamente à página. Não tem truques — `Tab` item a item, ou `Insert+F7` (NVDA) para ires diretamente a um pelo nome.

### 5.3 Separadores dentro de uma página (ex.: "Finanças" tem 10: Movimentos, Dívidas por fração, Orçamentos, etc.)

**Isto é o truque mais importante deste manual.** Quando o foco está num separador (o leitor de ecrã diz "separador" ou "tab"), **não uses `Tab` para ires ao separador seguinte** — usa as **setas esquerda/direita**. Cada seta já muda de separador e mostra o conteúdo novo automaticamente, sem teres de confirmar com `Enter`. Só depois de estares no separador que queres é que usas `Tab` para entrares no conteúdo dele.

Se usares `Tab` repetidamente a partir de um separador, sais logo para o conteúdo do separador atual — não percorres a lista de separadores. Para voltar à lista de separadores, `Shift+Tab` até ao separador ativo e usa as setas.

### 5.4 Campos de escolha (menus tipo "escolhe uma opção")

Exemplos: "Tipo de titular" numa fração, "Critério de rateio" no condomínio, "Categoria" numa despesa.

1. `Tab` até ao campo — o leitor de ecrã anuncia a opção atualmente escolhida.
2. `Enter` (ou `Espaço`, ou seta para baixo) abre a lista, com foco já na opção atual.
3. Setas para cima/baixo movem entre as opções.
4. `Enter` confirma a escolha e fecha a lista.
5. `Escape` fecha sem alterar nada — a opção mantém-se a que estava antes.

### 5.5 Diálogos (janelas que aparecem por cima da página, ex.: "Nova fração", "Novo aviso")

- Ao abrir, o foco vai automaticamente para o primeiro campo, e o título do diálogo é anunciado.
- `Tab` percorre todos os campos e botões do diálogo. Ao chegar ao último, o `Tab` seguinte volta ao primeiro — **o foco nunca sai do diálogo para a página por trás** enquanto o diálogo estiver aberto (se achares que saiu, ver a nota da secção 7).
- `Escape`, ou o botão "Fechar"/"Cancelar", fecham o diálogo e devolvem o foco ao botão que o abriu.

### 5.6 Menus de "Ações" (o botão com três pontinhos, numa linha de tabela)

- `Tab` até ao botão "Ações" (tem sempre um nome, nunca é só "botão").
- `Enter` abre o menu, com foco já na primeira opção.
- Setas para cima/baixo movem entre as opções.
- `Enter` escolhe a opção. `Escape` fecha sem escolher nada, e o foco volta ao botão "Ações".

### 5.7 Tabelas (ex.: lista de movimentos em Finanças)

As tabelas têm cabeçalhos de coluna associados a cada célula. Usa `T` (NVDA) para entrares na tabela e `Ctrl+Alt+Setas` para andares célula a célula — o leitor de ecrã anuncia o cabeçalho da coluna a cada célula nova, para não perderes a noção de que coluna estás a ouvir.

### 5.8 Mensagens de sucesso/erro (aparecem num canto do ecrã, tipo notificação)

São anunciadas automaticamente pelo leitor de ecrã assim que aparecem — não precisas de as procurar nem de mudar de sítio.

### 5.9 Carregar ficheiros (ex.: anexar uma foto a uma ocorrência)

São campos nativos do browser — `Tab` até ao campo, `Enter` abre a janela de escolha de ficheiro do Windows, que já é acessível por si só.

## 6. Se por instantes pareceres "perdido" logo a seguir a abrir uma janela

Foi identificada uma situação pouco frequente (rara, e autocorrige-se sozinha) em que, se pressionares `Tab` muito depressa, em sequência, logo no instante em que uma janela (diálogo) acaba de abrir, o foco pode por um instante ir para um sítio sem nome — o leitor de ecrã fica em silêncio ou diz algo sem sentido. Isto corrige-se sozinho decorrido menos de um segundo. **Se isto acontecer**: pára, espera um instante, e pressiona `Tab` outra vez — o foco deve estar de volta dentro da janela. Não é preciso fechar e reabrir.

## 7. Se encontrares um problema real

Este manual cobre os padrões gerais, mas pode não cobrir tudo. Se ficares mesmo preso (sem conseguir sair de um diálogo, um botão que não faz nada, algo que o leitor de ecrã não anuncia), regista tal como descrito em `docs/GUIA_TESTE_NVDA.md`: a página onde estavas, o que tentavas fazer, o que esperavas, o que aconteceu — e traz para uma sessão de revisão. Não é preciso avaliar gravidade nem sugerir a correção, só descrever a experiência real.
