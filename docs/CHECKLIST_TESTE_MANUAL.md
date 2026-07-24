# Checklist de teste manual — percorrer a app com dados reais

Data: 2026-07-22, **atualizada 2026-07-24** (Fase A.1). Para seres tu a percorrer, com a tua conta real em produção, não uma conta de teste. Cada linha é algo concreto a clicar/verificar — não é preciso seguir pela ordem exata, mas cobre os fluxos que mais mudaram nas últimas sessões.

**Antes de começar:** isto não substitui os testes automáticos (esses já correm). Serve para apanhar o que só um utilizador real nota — texto confuso, número que não bate certo, botão no sítio errado.

## Painel

- [ ] Os números de Receitas/Despesas/Saldo/Fundo de reserva no painel correspondem ao que esperas?
- [ ] Os avisos e ocorrências recentes mostrados são mesmo os últimos, e nenhum "eliminado" continua a aparecer?

## Finanças

- [ ] A lista de Movimentos mostra o histórico completo e correto?
- [ ] Se tiveres fornecedores registados, aparecem corretamente associados às despesas certas?
- [ ] "Dívidas por fração" reflete quem está mesmo em atraso?
- [ ] Gerar uma "Declaração" de dívida para uma fração — o texto e os valores fazem sentido?
- [ ] O relatório PDF (`Relatório (PDF)`) imprime/exporta bem, sem cortes estranhos?
- [ ] Exportar CSV — abre bem no Excel, com acentos corretos?
- [ ] Seguro: os dados da apólice atual estão certos (seguradora, validade, capital seguro)?
- [ ] Conciliação bancária: se importares um extrato real, os valores emparelham como esperado?

## Fase A.1 — Exercícios e contas financeiras

**Estado**: Implementada e validada em desenvolvimento; **pendente de promoção e validação em produção**. Todos os casos abaixo devem correr **só em ambiente de desenvolvimento**, exceto a secção "Validação futura em produção", que não pode ser executada sem autorização explícita separada.

### Identificação da execução

| Campo | Valor |
|---|---|
| Ambiente | |
| Data | |
| Executor | |
| Versão/commit | |
| Condomínio de teste | |
| Perfil ou perfis | |
| Browser e versão | |
| Sistema operativo | |
| Dispositivo ou viewport | |
| Tecnologia de apoio | |
| Origem dos dados | |
| Autorização para produção | Não autorizada |

Uma execução só pode ser considerada reproduzível quando ambiente, versão, executor, perfil e evidência estiverem registados.

### Dados de teste e limpeza

**Antes dos testes**:
- Identificar todos os dados que serão criados.
- Usar apenas o ambiente autorizado (desenvolvimento).
- Marcar entidades como dados de teste (ex. nome com prefixo reconhecível).
- Identificar o condomínio utilizado.
- Confirmar que não serão alterados dados reais.
- Confirmar que não existem credenciais em scripts ou documentação.
- Registar os totais financeiros relevantes antes do teste.

**Depois dos testes**:
- Remover os dados funcionais de teste que devam ser eliminados (exercício, contas, saldos criados só para o teste).
- Preservar o `audit_log` — nunca apagar entradas de auditoria, mesmo de teste.
- Confirmar a inexistência de scripts temporários no repositório.
- Confirmar a inexistência de credenciais temporárias.
- Confirmar que não foram alterados outros condomínios.
- Registar os totais financeiros depois da limpeza.
- Documentar qualquer dado deliberadamente preservado (e o motivo).

### Testes funcionais (34 — FA1-F01 a FA1-F34)

**[FA1-F01] Abrir "Exercícios e contas"**
- Ambiente: Dev · Perfil: Qualquer perfil com acesso financeiro
- Pré-condições: Sessão iniciada, condomínio com acesso financeiro
- Passos: 1. Abrir `/financas`. 2. Clicar no separador "Exercícios e contas".
- Resultado esperado: O separador abre e mostra o assistente de configuração inicial (se não existir exercício/conta) ou a lista de contas/exercícios.
- Resultado observado: — · Estado: Não executado · Evidência: — · Gravidade da falha: Não aplicável · Observações: — · Limpeza necessária: Não

**[FA1-F02] Estado vazio e orientação inicial**
- Perfil: Admin · Pré-condições: Nenhum exercício criado
- Passos: 1. Abrir "Exercícios e contas" sem nenhum exercício.
- Resultado esperado: Mostra o cartão "Configuração inicial das contas do condomínio", 3 passos numerados, passo 1 ativo com botão "Começar", passos 2/3 esbatidos.
- Estado: Não executado

**[FA1-F03] Iniciar o assistente**
- Passos: 1. No passo 1, clicar "Começar".
- Resultado esperado: Abre o diálogo "Criar exercício financeiro" com Designação/Ano principal/Início/Fim pré-preenchidos com o ano atual.
- Estado: Não executado

**[FA1-F04] Criar exercício civil**
- Passos: 1. Designação "2026", Ano 2026, Início 01/01/2026, Fim 31/12/2026. 2. Confirmar.
- Resultado esperado: Exercício criado, aparece "Aberto" na tabela, associado só ao condomínio ativo.
- Estado: Não executado

**[FA1-F05] Criar exercício não coincidente com o ano civil**
- Passos: 1. Criar exercício com Início 01/07/2026, Fim 30/06/2027. 2. Confirmar.
- Resultado esperado: Criado normalmente — a app não exige coincidência com o ano civil.
- Estado: Não executado

**[FA1-F06] Impedir sobreposição de exercícios**
- Pré-condições: Existe exercício "2026" (01/01-31/12/2026), aberto.
- Passos: 1. Tentar criar exercício com Início 01/06/2026, Fim 31/05/2027.
- Resultado esperado: Rejeitado com mensagem de sobreposição; nenhum registo novo criado.
- Estado: Não executado

**[FA1-F07] Criar conta à ordem**
- Passos: 1. "Nova conta" → Nome "Conta à Ordem BCP", Tipo "Conta à ordem", Banco "BCP". 2. Guardar.
- Resultado esperado: Conta aparece com tipo "Conta à ordem", estado "Ativa", saldo inicial e atual 0,00 €.
- Estado: Não executado

**[FA1-F08] Criar conta de caixa sem banco ou IBAN**
- Passos: 1. "Nova conta" → Tipo "Caixa (numerário)". 2. Confirmar que Banco/IBAN desaparecem. 3. Guardar.
- Resultado esperado: Criada sem exigir banco/IBAN; coluna "Banco/IBAN" mostra "—".
- Estado: Não executado

**[FA1-F09] Criar conta transitória com justificação**
- Passos: 1. Tipo "Conta transitória". 2. Tentar guardar sem motivo.
- Resultado esperado: Bloqueado até o motivo ser preenchido; com motivo, cria normalmente.
- Estado: Não executado

**[FA1-F10] Validar e normalizar IBAN**
- Passos: 1. Introduzir IBAN com espaços/minúsculas (ex. "pt50 0002...").
- Resultado esperado: Guardado normalizado (maiúsculas, sem espaços) — verificável por quem tem acesso de gestão.
- Estado: Não executado

**[FA1-F11] Impedir IBAN inválido**
- Passos: 1. Introduzir IBAN com checksum inválido. 2. Guardar.
- Resultado esperado: Rejeitado com "O IBAN indicado não é válido — confirme se foi copiado corretamente"; nada é gravado.
- Estado: Não executado

**[FA1-F12] Definir saldo inicial**
- Pré-condições: Exercício aberto.
- Passos: 1. Ao criar conta, preencher "Saldo inicial" (ex. 1500). 2. Guardar.
- Resultado esperado: Tabela mostra "Saldo inicial: 1500,00 €" e "Saldo atual: 1500,00 €".
- Estado: Não executado

**[FA1-F13] Corrigir saldo inicial**
- Pré-condições: Conta com saldo inicial definido.
- Passos: 1. "..." → "Corrigir saldo inicial". 2. Alterar valor. 3. Guardar.
- Resultado esperado: Novo valor mostrado; `audit_log` regista valor anterior e novo (ver `/auditoria`).
- Estado: Não executado

**[FA1-F14] Interromper e retomar o assistente**
- Passos: 1. Concluir só o passo 1. 2. Recarregar a página.
- Resultado esperado: Assistente reaparece no passo 2, passo 1 com ✓ — não volta ao início nem desaparece.
- Estado: Não executado

**[FA1-F15] Associar movimentos a exercício com pré-visualização**
- Pré-condições: Movimentos antigos sem exercício, com data no período.
- Passos: 1. "Associar movimentos antigos" na linha do exercício. 2. Ver a pré-visualização.
- Resultado esperado: Mostra contagem, totais e amostra **antes** de qualquer alteração; só "Confirmar associação" altera dados.
- Nota (T2, `DOCUMENT_TRACEABILITY_AUDIT.md`, P2): **resolvida em desenvolvimento no commit `c25efc3`** — confirmar que `/auditoria` regista `operacaoId`, tipo de operação, total e uma amostra ordenada de IDs de movimentos (até 10, com indicação de truncagem).
- Nota (T4): confirmar que esta é a única forma de associar exercício a um movimento — não existe reclassificação individual de um movimento já associado a outro exercício. Limitação funcional aceite nesta fase, **não é falha de auditoria**.
- Estado: Não executado

**[FA1-F16] Associar movimentos a conta com pré-visualização**
- Passos: 1. "Associar movimentos" na linha da conta. 2. Escolher destino. 3. Ver pré-visualização antes de confirmar.
- Resultado esperado: Mesmo comportamento de pré-visualização obrigatória do F15, por `destino`.
- Nota (T2, P2): **resolvida em desenvolvimento no commit `c25efc3`** — confirmar que `/auditoria` regista `operacaoId`, tipo de operação, total, destino e uma amostra ordenada de IDs de movimentos (até 10, com indicação de truncagem).
- Nota (T4): confirmar que não existe reclassificação individual de conta para um movimento já associado — só esta via em massa. Limitação funcional aceite, **não é falha de auditoria**.
- Estado: Não executado

**[FA1-F17] Mostrar movimentos não associados**
- Passos: 1. Após associação em massa, ler a mensagem final.
- Resultado esperado: Indica quantos movimentos "continuam por classificar", se houver.
- Estado: Não executado

**[FA1-F18] Consultar saldo calculado**
- Passos: 1. Consultar "Saldo atual" de uma conta com movimentos pagos associados.
- Resultado esperado: Saldo inicial + receitas pagas − despesas pagas associadas — confirmável somando manualmente os movimentos.
- Estado: Não executado

**[FA1-F19] Ignorar movimentos não liquidados no saldo**
- Pré-condições: Movimento associado com `pago = false`.
- Passos: 1. Verificar que o saldo não muda.
- Resultado esperado: Só movimentos com `pago = true` entram no cálculo.
- Estado: Não executado

**[FA1-F20] Ignorar movimentos eliminados logicamente no saldo**
- Passos: 1. Eliminar um movimento pago associado. 2. Verificar o saldo.
- Resultado esperado: Saldo deixa de incluir esse movimento, apesar de continuar na BD (`deletedAt` preenchido).
- Estado: Não executado

**[FA1-F21] Fechar exercício**
- Passos: 1. "Fechar" na linha do exercício. 2. Confirmar.
- Resultado esperado: Passa a "Fechado"; ações de associar/transportar/fechar desaparecem, aparece "Reabrir".
- Estado: Não executado

**[FA1-F22] Mostrar avisos antes do fecho**
- Pré-condições: Movimentos pagos sem data de liquidação, ou extrato por conciliar, no período.
- Passos: 1. Iniciar o fecho.
- Resultado esperado: Mostra resumo + avisos; "Fechar exercício" só ativa depois de marcar "Confirmo que tomei conhecimento".
- Estado: Não executado

**[FA1-F23] Bloquear alterações em exercício fechado**
- Pré-condições: Exercício fechado.
- Passos: 1. Tentar criar movimento com data no período fechado.
- Resultado esperado: Rejeitado com mensagem a indicar reabertura primeiro; nada é criado.
- Estado: Não executado

**[FA1-F24] Reabrir exercício sem motivo**
- Pré-condições: Exercício fechado.
- Passos: 1. "Reabrir". 2. Tentar confirmar sem motivo.
- Resultado esperado: Botão "Reabrir exercício" permanece desativado sem motivo preenchido.
- Estado: Não executado

**[FA1-F25] Reabrir exercício com motivo**
- Passos: 1. Preencher motivo. 2. Confirmar.
- Resultado esperado: Volta a "Aberto"; `audit_log` regista o motivo.
- Estado: Não executado

**[FA1-F26] Transportar saldos**
- Pré-condições: Exercício anterior, contíguo e fechado.
- Passos: 1. "Transportar saldo". 2. Rever pré-visualização. 3. Confirmar.
- Resultado esperado: Saldo final de cada conta no exercício anterior passa a inicial do atual, origem "transportado".
- Nota (T2, P2): **resolvida em desenvolvimento no commit `c25efc3`** — confirmar que `/auditoria` regista `operacaoId`, tipo de operação, o exercício de origem, o total de contas transportadas e uma amostra ordenada de IDs de contas (até 10, com indicação de truncagem).
- Estado: Não executado

**[FA1-F27] Impedir duplicação do transporte**
- Pré-condições: Conta já com saldo inicial manual no exercício atual.
- Passos: 1. Executar "Transportar saldo" de novo.
- Resultado esperado: Essa conta aparece "já tem saldo definido", excluída da seleção por omissão.
- Estado: Não executado

**[FA1-F28] Não substituir silenciosamente saldo manual**
- Passos: 1. Confirmar o transporte, verificando a conta do F27.
- Resultado esperado: Valor manual original mantém-se — nunca substituído sem correção explícita (F13).
- Estado: Não executado

**[FA1-F29] Bloquear encerramento de conta com saldo ≠ 0**
- Pré-condições: Conta com saldo atual ≠ 0.
- Passos: 1. "..." → "Encerrar conta". 2. Confirmar.
- Resultado esperado: Rejeitado, mensagem indica o valor pendente; conta permanece "Ativa".
- Estado: Não executado

**[FA1-F30] Encerrar conta com saldo zero**
- Pré-condições: Conta com saldo atual = 0,00 €.
- Passos: 1. "Encerrar conta". 2. Confirmar.
- Resultado esperado: Passa a "Encerrada"; continua visível no histórico, sem opções de associação/correção.
- Estado: Não executado

**[FA1-F31] Impedir novos movimentos em conta encerrada**
- Pré-condições: Conta encerrada (F30).
- Passos: 1. Tentar associar movimentos a essa conta.
- Resultado esperado: Ação indisponível; se forçada, rejeitada com "Esta conta está encerrada — não é possível associar novos movimentos."
- Estado: Não executado

**[FA1-F32] Validar reconciliação na mesma conta e rejeitar contas diferentes**
- Pré-condições: Linha de extrato com conta A; movimento com conta B (diferente).
- Passos: 1. Tentar conciliar essa linha com esse movimento.
- Resultado esperado: Rejeitado com "Esta linha e este movimento pertencem a contas financeiras diferentes."; conciliar mesma conta funciona.
- Nota (T3, `DOCUMENT_TRACEABILITY_AUDIT.md`, P3): confirmar que a conciliação fica registada em `/auditoria`; verificar que o texto **não identifica a conta financeira envolvida** (só o id do movimento) — limitação conhecida, **não resolvida**.
- Estado: Não executado

**[FA1-F33] Impedir cruzamento entre condomínios e validar permissões**
- Pré-condições: Contas em condomínios diferentes; perfil condómino/inquilino disponível.
- Passos: 1. Confirmar que a lista de exercícios/contas nunca mostra dados de outro condomínio. 2. Com perfil condómino, confirmar ausência de botões de criar/editar/fechar/encerrar.
- Resultado esperado: Nenhuma operação afeta outro condomínio; perfis sem `requireAdmin()` só veem informação, nunca ações de gestão.
- Estado: Não executado

**[FA1-F34] Confirmar proteção do IBAN e auditoria das operações críticas**
- Passos: 1. Consultar a lista de contas com perfil sem acesso de gestão (ex. condómino). 2. Verificar `/auditoria` após criar/editar/encerrar conta e fechar/reabrir exercício.
- Resultado esperado: IBAN/nota transitória ocultos para quem não tem permissão; `/auditoria` regista cada operação crítica, nunca com o IBAN completo.
- Nota (T1, `DOCUMENT_TRACEABILITY_AUDIT.md`, P2): **resolvida em desenvolvimento no commit `c25efc3`** — ao editar uma conta (nome/tipo/banco/IBAN), confirmar que `/auditoria` regista a lista de campos alterados (ex. "Campos alterados: nome, IBAN") e, quando aplicável, `ibanAlterado`, sem nunca incluir o valor do IBAN; confirmar também que gravar sem alterações reais não gera novo registo de auditoria.
- Estado: Não executado

### Testes de acessibilidade (20 — FA1-A01 a FA1-A20)

**[FA1-A01] Navegação integral por teclado**
- Passos: 1. Sem rato, percorrer o assistente completo até criar exercício + conta.
- Resultado esperado: Fluxo completável só com Tab/Shift+Tab/Enter/Espaço/Escape, sem ficar preso.
- Estado: Não executado

**[FA1-A02] Ordem lógica de tabulação**
- Passos: 1. Abrir "Nova conta", pressionar Tab repetidamente.
- Resultado esperado: Foco percorre os campos na ordem visual, sem saltos.
- Estado: Não executado

**[FA1-A03] Foco inicial**
- Passos: 1. Abrir cada um dos 10 diálogos da Fase A.1.
- Resultado esperado: Foco move-se automaticamente para o primeiro campo/elemento interativo.
- Estado: Não executado

**[FA1-A04] Contenção do foco em diálogos**
- Passos: 1. Com o diálogo aberto, dar a volta completa com Tab.
- Resultado esperado: Foco nunca sai do diálogo para a página por trás.
- Estado: Não executado

**[FA1-A05] Fecho por Escape**
- Passos: 1. Em cada um dos 10 diálogos, pressionar Escape.
- Resultado esperado: Fecha em todos os casos, sem confirmação extra desnecessária.
- Estado: Não executado

**[FA1-A06] Devolução do foco**
- Passos: 1. Fechar cada diálogo (Escape ou submissão). 2. Verificar onde fica o foco.
- Resultado esperado: Foco volta ao botão que abriu o diálogo.
- Estado: Não executado

**[FA1-A07] Nomes acessíveis dos botões**
- Passos: 1. Inspecionar/ouvir os botões só com ícone.
- Resultado esperado: O botão "..." (ações da conta) anuncia "Ações"; nenhum botão interativo fica sem nome.
- Estado: Não executado

**[FA1-A08] Títulos e descrições dos diálogos**
- Passos: 1. Abrir cada diálogo com leitor de ecrã ativo.
- Resultado esperado: Título anunciado ao abrir; descrição disponível para consulta.
- Estado: Não executado

**[FA1-A09] Associação dos erros aos campos (L3)**
- Passos: 1. Provocar erro de campo (ex. IBAN inválido). 2. Verificar se o campo fica identificado como inválido.
- Resultado esperado: Ver lacuna L3 (`docs/audit/ACCESSIBILITY_AUDIT.md`) — hoje não há associação inline; registar Falhou/Bloqueado até corrigido.
- Estado: Não executado

**[FA1-A10] Anúncio de erros e sucessos (L3)**
- Passos: 1. Provocar erro geral e sucesso, com leitor de ecrã ativo.
- Resultado esperado: Ambas as mensagens (toast) anunciadas automaticamente.
- Estado: Não executado

**[FA1-A11] Teste completo com NVDA (L4)**
- Passos: 1. Percorrer o plano mínimo de L4 (`ACCESSIBILITY_AUDIT.md`) com o NVDA a correr.
- Resultado esperado: Todos os fluxos do plano compreensíveis e completáveis só com NVDA.
- Estado: Não executado

**[FA1-A12] Anúncio do passo atual do assistente (L2)**
- Passos: 1. Avançar entre os 3 passos com leitor de ecrã ativo.
- Resultado esperado: Deve anunciar "Passo X de 3" e o estado de cada passo (concluído/atual/ainda não disponível).
- Nota (L2): correção implementada no commit `a1e8c0e`; continua por validar formalmente com NVDA e execução completa da checklist.
- Estado: Não executado

**[FA1-A13] Aviso de movimento sem data de liquidação (L1)**
- Passos: 1. Navegar até ao ícone ⚠ junto ao saldo, só por teclado/leitor de ecrã.
- Resultado esperado: Deve ser acessível e anunciado independentemente do `title`.
- Nota (L1): correção implementada no commit `a1e8c0e`; validada manualmente em desenvolvimento, mas ainda não validada com leitor de ecrã.
- Estado: Não executado

**[FA1-A14] Estados não dependentes apenas da cor**
- Passos: 1. Ver badges "Aberto/Fechado"/"Ativa/Encerrada" em escala de cinzentos.
- Resultado esperado: Estado identificável só pelo texto do badge.
- Estado: Não executado

**[FA1-A15] Zoom a 200%**
- Passos: 1. Zoom do browser a 200% em "Exercícios e contas".
- Resultado esperado: Conteúdo e ações essenciais continuam visíveis e utilizáveis, sem texto cortado.
- Estado: Não executado

**[FA1-A16] Reflow sem perda de conteúdo**
- Passos: 1. Reduzir a largura para 320 CSS px.
- Resultado esperado: Conteúdo reflui em coluna única, sem scroll horizontal para informação essencial.
- Estado: Não executado

**[FA1-A17] Telemóvel**
- Passos: 1. Testar em viewport ~390×844px.
- Resultado esperado: Assistente, tabelas e diálogos utilizáveis, sem perda de ações por scroll horizontal.
- Estado: Não executado

**[FA1-A18] Tablet**
- Passos: 1. Testar em viewport ~768×1024px.
- Resultado esperado: Idem A17, aproveitando a largura adicional.
- Estado: Não executado

**[FA1-A19] Contraste e áreas clicáveis**
- Passos: 1. Medir contraste dos novos avisos/badges/estados desativados (L7). 2. Medir tamanho das áreas clicáveis.
- Resultado esperado: Pares texto/fundo ≥ 4.5:1; áreas clicáveis ≥ 24×24px.
- Estado: Não executado

**[FA1-A20] Tabelas e operações em massa em ecrã pequeno**
- Passos: 1. Em viewport de telemóvel, abrir a tabela de contas e um diálogo de associação em massa.
- Resultado esperado: Colunas ocultas não escondem informação crítica; diálogo de associação em massa totalmente utilizável.
- Estado: Não executado

### Testes de usabilidade (9 — FA1-U01 a FA1-U09)

Executar preferencialmente com uma pessoa que não participou no desenvolvimento, não recebeu instruções técnicas prévias e não tem formação contabilística especializada. Registar em cada caso: dúvidas colocadas, termos incompreendidos, erros cometidos, tempo aproximado, pontos em que pediu ajuda, sugestões espontâneas.

**[FA1-U01] Compreender "exercício financeiro"**
- Passos: 1. Pedir para explicar por palavras próprias, depois de ler o diálogo de criação.
- Resultado esperado: Explica, sem ajuda, que é o período (normalmente um ano) a que as contas pertencem.
- Estado: Não executado

**[FA1-U02] Compreender "saldo inicial"**
- Resultado esperado: Entende que é o valor com que a conta "começa" nesse período.
- Estado: Não executado

**[FA1-U03] Compreender "transportar saldo"**
- Resultado esperado: Entende que o valor final de um ano passa a ser o inicial do seguinte.
- Estado: Não executado

**[FA1-U04] Compreender "conta transitória"**
- Resultado esperado: Reconhece que é uma situação excecional/temporária, não o tipo normal.
- Estado: Não executado

**[FA1-U05] Perceber por que motivo uma ação foi bloqueada**
- Passos: 1. Provocar um bloqueio real (ex. fechar sem confirmar avisos, ou lançar em exercício fechado).
- Resultado esperado: Lê a mensagem e sabe dizer, sem ajuda, o que fazer a seguir.
- Estado: Não executado

**[FA1-U06] Corrigir um erro sem ajuda**
- Passos: 1. Provocar erro de validação (ex. IBAN inválido).
- Resultado esperado: Corrige o campo sem pedir ajuda.
- Estado: Não executado

**[FA1-U07] Interromper e continuar mais tarde**
- Passos: 1. Parar a meio do assistente e retomar depois.
- Resultado esperado: Encontra sozinha onde continuar.
- Estado: Não executado

**[FA1-U08] Concluir o fluxo sem documentação técnica**
- Resultado esperado: Completa o assistente e cria a primeira conta sem consultar documentação nem pedir ajuda externa.
- Estado: Não executado

**[FA1-U09] Distinguir opções normais de opções avançadas**
- Resultado esperado: Não abre "Opções avançadas" sem necessidade; entende que são campos menos comuns.
- Estado: Não executado

### Validação futura em produção (18 — FA1-P01 a FA1-P18)

**Todos os casos abaixo começam com Estado: Não executado — produção não autorizada.** Não incluir credenciais, URLs privadas, comandos com segredos nem valores reais de produção em nenhuma evidência registada.

**[FA1-P01] Autorização explícita do Rui**
- Resultado esperado: Autorização registada por escrito antes de qualquer passo seguinte.
- Estado: Não executado — produção não autorizada.

**[FA1-P02] Definição da janela de intervenção**
- Resultado esperado: Data/hora da migração acordada, com baixo impacto esperado nos utilizadores.
- Estado: Não executado — produção não autorizada.

**[FA1-P03] Snapshot verificável**
- Resultado esperado: Snapshot da base de produção criado e confirmado como restaurável.
- Estado: Não executado — produção não autorizada.

**[FA1-P04] Registo dos totais antes**
- Resultado esperado: Totais financeiros relevantes (receitas/despesas/saldo) registados antes de qualquer alteração.
- Estado: Não executado — produção não autorizada.

**[FA1-P05] `db:check-drift` antes**
- Resultado esperado: Sem inconsistências entre dev e produção antes da migração.
- Estado: Não executado — produção não autorizada.

**[FA1-P06] Confirmação de `drizzle.__drizzle_migrations`**
- Resultado esperado: Estado da tabela de migrações em produção confirmado e compreendido antes de aplicar a nova.
- Estado: Não executado — produção não autorizada.

**[FA1-P07] Revisão final da migração 0024**
- Resultado esperado: SQL revisto uma última vez imediatamente antes da aplicação, sem alterações desde a última revisão nesta cadeia de conversa.
- Estado: Não executado — produção não autorizada.

**[FA1-P08] Confirmação de `btree_gist`**
- Resultado esperado: Extensão disponível e com permissão de criação confirmada no plano de produção da Neon.
- Estado: Não executado — produção não autorizada.

**[FA1-P09] Plano executável de recuperação**
- Resultado esperado: Procedimento de rollback/recuperação documentado e testado num ambiente equivalente antes da aplicação real.
- Estado: Não executado — produção não autorizada.

**[FA1-P10] Aplicação controlada da migração**
- Resultado esperado: `DATABASE_URL="<produção>" pnpm db:migrate` corre sem erros, dentro da janela definida.
- Estado: Não executado — produção não autorizada.

**[FA1-P11] `db:check-drift` depois**
- Resultado esperado: Sem inconsistências entre dev e produção depois da migração.
- Estado: Não executado — produção não autorizada.

**[FA1-P12] Comparação dos totais depois**
- Resultado esperado: Totais financeiros idênticos aos registados em P04 — a migração é aditiva, não deve alterar nenhum valor existente.
- Estado: Não executado — produção não autorizada.

**[FA1-P13] Smoke tests**
- Resultado esperado: Páginas principais (`/financas` e as restantes) carregam sem erro 500 depois da migração.
- Estado: Não executado — produção não autorizada.

**[FA1-P14] Validação por perfil**
- Resultado esperado: Cada perfil (admin, gestor, condómino, inquilino, fornecedor, auditor) vê exatamente o que é esperado em "Exercícios e contas".
- Estado: Não executado — produção não autorizada.

**[FA1-P15] Validação completa da Fase A.1**
- Resultado esperado: Repetir os casos FA1-F01 a FA1-F34 relevantes com dados reais de produção, sem regressão face ao comportamento validado em dev.
- Estado: Não executado — produção não autorizada.

**[FA1-P16] Confirmação de ausência de regressões**
- Resultado esperado: Funcionalidades já existentes (`Movimentos`, `Dívidas por fração`, `Conciliação`, etc.) continuam a funcionar sem alteração de comportamento.
- Estado: Não executado — produção não autorizada.

**[FA1-P17] Atualização documental**
- Resultado esperado: `ROADMAP.md`, `FUNCTIONAL_GAPS.md`, `docs/product/MBD_GEST_GAP_ANALYSIS.md` e os 8 documentos desta revisão atualizados de "dev, pendente produção" para o estado real, só depois de P01–P16 concluídos.
- Estado: Não executado — produção não autorizada.

**[FA1-P18] Decisão final de disponibilização**
- Resultado esperado: Decisão explícita e registada sobre disponibilizar a funcionalidade a clientes, distinta da decisão de aplicar a migração.
- Estado: Não executado — produção não autorizada.

### Resumo final da execução

| Estado | Total |
|---|---|
| Passou | 0 |
| Falhou | 0 |
| Bloqueado | 0 |
| Não executado | 81 |
| Não aplicável | 0 |

- Bloqueadores encontrados: —
- Falhas críticas: —
- Falhas altas: —
- Falhas médias: —
- Falhas baixas: —
- Decisão sobre desenvolvimento: —
- Decisão sobre migração: —
- Decisão sobre produção: —
- Decisão sobre cliente externo: —
- Executor: —
- Data: —

Os totais devem ser atualizados manualmente após cada execução.

## Fornecedores

- [ ] A lista de fornecedores reais está completa e sem duplicados?
- [ ] Editar um fornecedor guarda corretamente as alterações?

## Assembleias

- [ ] O histórico de assembleias já realizadas está correto (datas, pontos, resultados)?
- [ ] Abrir uma ata aprovada — o conteúdo está completo e continua bloqueado para edição?

## Avisos / Ocorrências / Documentos

- [ ] Os avisos publicados aparecem com a prioridade certa?
- [ ] Reportar uma ocorrência nova, com foto — a foto aparece corretamente depois?
- [ ] Abrir um documento já carregado — descarrega/abre sem erro?

## Condóminos / Frações

- [ ] A lista de condóminos e frações está atualizada (permilagens, proprietários)?
- [ ] Um condómino sem acesso financeiro (ex. inquilino, se tiveres algum) não vê Finanças/Frações no menu?

## Auditoria

- [ ] `/auditoria` mostra as ações recentes de forma legível (quem fez o quê, quando)?

## Sessão e conta

- [ ] Terminar sessão e voltar a entrar funciona sem fricção?
- [ ] `/os-meus-dados` mostra os teus dados corretos e a exportação funciona?

## O que fazer se encontrares algo estranho

Não corrigir nada sozinho — anota o que viste (página, o que esperavas, o que aconteceu) e traz para a próxima sessão. A maioria dos problemas reais só aparece assim, com dados a sério.
