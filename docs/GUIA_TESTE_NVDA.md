# Guião de teste com NVDA — GestCondo

Data: 2026-07-28. Para quem vai testar a aplicação com o NVDA (ou outro leitor de ecrã). Não é preciso saber nada de programação — só percorrer a aplicação como qualquer utilizador faria, com o NVDA a correr, e anotar tudo o que soar estranho, confuso, silencioso ou impossível de fazer só com o teclado.

Este teste é o único que falta para a auditoria de acessibilidade (`docs/audit/ACCESSIBILITY_AUDIT.md`) poder ser considerada validada com uma pessoa real, não só revisão de código.

## Antes de começar

**Ambiente a usar**: cria a tua própria conta em produção (`gestcondo.vercel.app`) e, no ecrã inicial, escolhe **"Criar um condomínio novo"** — isto cria um condomínio isolado só teu, com dados totalmente fictícios, sem qualquer contacto com o condomínio real que já usa a aplicação. Podes inventar frações, condóminos, avisos, etc. à vontade. Não uses nenhum código de convite de um condomínio existente.

**Não precisas de saber se algo "devia" funcionar assim ou não** — o teu papel é só relatar a experiência real. A avaliação técnica é feita depois.

**Não corrijas nada nem peças a alguém para corrigir a meio do teste.** Continua e anota. As correções são feitas numa sessão à parte, depois de reveres os resultados.

### Como registar um problema

Para cada problema, anota:
1. Em que página/ecrã estavas.
2. O que estavas a tentar fazer.
3. O que esperavas ouvir ou que acontecesse.
4. O que realmente aconteceu (ou o que o NVDA disse, ou o silêncio).
5. Consegues repetir o problema, ou foi só uma vez?

Não é preciso classificar gravidade nem sugerir a correção — isso fica para depois.

### Dados desta sessão de teste (preencher no início)

| Campo | Valor |
|---|---|
| Data |  |
| Sistema operativo |  |
| Browser e versão |  |
| Versão do NVDA |  |
| Nome do condomínio de teste criado |  |

---

## 1. Conta e autenticação

- [ ] Página de registo (`/sign-up`): todos os campos têm nome claro ao navegar por eles? A password pedida (mínimo 10 caracteres) é anunciada como requisito antes de errares?
- [ ] Submeter o registo com um erro (ex. email já usado, password curada) — o erro é anunciado sem teres de procurar por ele?
- [ ] Email de verificação — depois de confirmares, o login funciona sem confusão?
- [ ] Login (`/sign-in`) com credenciais erradas — mensagem de erro clara e anunciada?
- [ ] "Esqueci a password" (`/esqueci-password` → email → `/redefinir-password`) — todo o fluxo percorrível só por teclado?
- [ ] Ativar o MFA/2FA em "Os meus dados" (opcional, só se quiseres testar) — o QR code tem alternativa por texto (código manual)? Confirmação do código funciona?
- [ ] Terminar sessão — claro onde está esse botão/link?

## 2. Onboarding (primeira vez)

- [ ] Ecrã de escolha "juntar-me com código" vs. "criar condomínio novo" — claro qual escolher?
- [ ] Criar um condomínio novo — formulário (nome, morada, NIF) sem confusão?
- [ ] Depois de criado, chegas ao Painel sem ficar perdido?

## 3. Navegação geral (fazer isto cedo, antes dos módulos)

- [ ] Logo ao entrar numa página, o `Tab` primeiro foca um link "saltar para o conteúdo" — ativá-lo salta o menu lateral repetitivo?
- [ ] O menu lateral (Painel, Avisos, Ocorrências, Documentos, Frações, Condóminos, Finanças, Fornecedores, Assembleias, Mensagens, Auditoria, Condomínio, Pesquisa, Notificações, Ajuda, Os meus dados) é percorrível e cada item diz claramente para onde leva?
- [ ] Cada página tem um título (H1) que o NVDA anuncia ao navegar por títulos (tecla H)? Ajuda a saber onde estás?
- [ ] "Pesquisa" (`/pesquisa`) — pesquisar um termo e navegar pelos resultados por categoria funciona?
- [ ] "Notificações" (`/notificacoes`) — a lista é percorrível e cada item diz o que é?

## 4. Painel (página inicial)

- [ ] Os números (receitas/despesas/saldo/fundo de reserva) são lidos com contexto (não só o número solto)?
- [ ] Avisos e ocorrências recentes — cada item é claro sobre do que se trata?

## 5. Avisos

- [ ] Criar um aviso novo (diálogo) — título anunciado ao abrir, foco no primeiro campo, campos obrigatórios claros?
- [ ] Prioridade (normal/importante/urgente) — perceptível sem depender só de cor?
- [ ] "Confirmar leitura" — o botão diz claramente o que faz, e depois de clicares fica claro que já confirmaste?
- [ ] Fechar o diálogo com `Escape` — o foco volta ao botão que abriu?

## 6. Ocorrências

- [ ] Reportar uma ocorrência nova, com foto anexada — o campo de upload é utilizável só por teclado?
- [ ] Mudar o estado (aberta/em curso/resolvida) — claro qual é o estado atual?
- [ ] Atribuir a um fornecedor (se tiveres um criado) — o seletor é utilizável?

## 7. Documentos

- [ ] Carregar um documento novo — tipo/categoria selecionável sem confusão?
- [ ] Abrir/descarregar um documento já carregado — o link diz o que é (não só "clique aqui")?
- [ ] Marcar como confidencial — claro o que isso implica?

## 8. Frações e Condóminos

- [ ] Criar uma fração (identificação, proprietário, permilagem) — os campos "Mais opções" (área, representante legal, etc.) são anunciados como um grupo que se pode expandir?
- [ ] Tentar ultrapassar 1000‰ no total de permilagens — o bloqueio é anunciado com uma explicação clara do porquê?
- [ ] Aprovar um pedido de acesso pendente em Condóminos — claro quem está pendente e o que a ação faz?
- [ ] Editar o perfil de um condómino (proprietário/inquilino, ligação à fração) — os seletores são claros?

## 9. Finanças (o módulo mais complexo — reserva mais tempo)

- [ ] Lista de Movimentos — a tabela é navegável por cabeçalho de coluna (Ctrl+Alt+setas, se o NVDA estiver em modo tabela)? Cada linha faz sentido lida na íntegra?
- [ ] Criar um movimento novo (receita/despesa) — todos os campos claros, incluindo ligação a fração/fornecedor?
- [ ] Marcar um movimento como pago — o diálogo de meio de pagamento/data é claro?
- [ ] "Dívidas por fração" — os valores em dívida são lidos com contexto (a que fração pertencem)?
- [ ] Gerar uma "Declaração de dívida" ou "Interpelação" para uma fração — o texto legal gerado é lido de forma coerente (não é só uma parede de números)?
- [ ] Orçamento anual — criar um orçamento e "Gerar quotas mensais" — a pré-visualização antes de confirmar é lida de forma que dê para perceber o que vai acontecer antes de confirmar?
- [ ] Separador "Exercícios e contas" — o assistente de configuração inicial (3 passos) anuncia em que passo estás e o que falta?
- [ ] Criar uma conta financeira (à ordem / caixa / transitória) — os campos que aparecem/desaparecem consoante o tipo escolhido são anunciados corretamente (não ficam "invisíveis" para o NVDA depois de escondidos)?
- [ ] Erro de IBAN inválido — o erro aparece associado ao campo (não só um aviso solto no topo)?
- [ ] Fechar um exercício financeiro — os avisos antes do fecho (movimentos sem data de liquidação, etc.) são lidos claramente, e a caixa "Confirmo que tomei conhecimento" é encontrável?
- [ ] Balanço patrimonial / mapa mensal — se forem tabelas grandes, dá para perceber a estrutura sem te perderes?

## 10. Fornecedores

- [ ] Criar um fornecedor — campos claros?
- [ ] Separador "Contratos" e "Orçamentos de obra" — os badges de estado (expirado/vencedor) são percetíveis?

## 11. Assembleias (fluxo legal completo — importante)

- [ ] Convocar uma assembleia — ordem de trabalhos, tipo, datas — claro e sequencial?
- [ ] Adicionar um ponto à ordem de trabalhos — claro onde/como?
- [ ] Registar presenças/procurações — o formulário é claro?
- [ ] Votar num ponto (favor/contra/abstenção) por fração — claro qual fração está a votar?
- [ ] Aprovar a ata — depois de aprovada, fica claro (anunciado) que a ata ficou bloqueada para edição?
- [ ] Abrir a minuta de convocatória/procuração para imprimir — o texto lido faz sentido de início a fim?
- [ ] Anexar um ficheiro à ata — upload utilizável por teclado?

## 12. Mensagens

- [ ] Enviar uma mensagem — claro para quem estás a escrever?
- [ ] O badge de "não lidas" na barra lateral é anunciado, ou só visível?

## 13. Auditoria

- [ ] `/auditoria` — a lista de ações é lida de forma legível (quem, o quê, quando)? O "resumo de alterações" (campo: de X para Y) é claro?

## 14. Condomínio (definições) e Os meus dados

- [ ] Editar nome/morada/NIF do condomínio — claro?
- [ ] Gerar código de convite — claro como copiar/partilhar?
- [ ] Exportar o condomínio — claro que vai descarregar um ficheiro?
- [ ] "Os meus dados" — ver, corrigir nome/telefone, exportar, eliminar conta — cada ação é reversível/clara antes de confirmares?

## 15. Ajuda

- [ ] Página `/ajuda` — a navegação por secções (uma por módulo) é clara com os títulos do NVDA (tecla H)?

## 16. Verificações transversais (repetir à medida que avanças, não só no fim)

- [ ] **Só teclado, sem rato, em toda a sessão**: alguma vez ficaste "preso" sem conseguir sair de um diálogo ou avançar?
- [ ] **Mensagens de sucesso/erro** (aparecem no canto, tipo notificação) — são anunciadas automaticamente pelo NVDA, ou só as vês se olhares?
- [ ] **Diálogos**: ao abrir, o título é anunciado logo? Ao fechar (Escape ou depois de guardar), o foco volta a um sítio que faz sentido?
- [ ] **Botões só com ícone** (sem texto): algum ficou sem nome (o NVDA diz só "botão", sem dizer para que serve)?
- [ ] **Tabelas grandes**: alguma vez perdeste a noção de que coluna estavas a ouvir?

## O que fazer no fim

Não corrijas nada. Traz a lista de problemas encontrados (mesmo que pareçam pequenos) para uma sessão de revisão — cada um será avaliado, priorizado e corrigido com o devido cuidado. Esta lista substitui, para efeitos do achado A4/L4 da auditoria de acessibilidade, a necessidade de "imaginar" como seria o teste — passa a ser um teste real.
