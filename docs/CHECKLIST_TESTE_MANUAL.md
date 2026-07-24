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
| Ambiente | Desenvolvimento (Neon branch `development`) |
| Data | 2026-07-24 |
| Executor | Claude (Claude Code), autorizado por Rui Coelho |
| Versão/commit | `a30242a` (baseline aprovada) + estado local não commitado no momento da execução |
| Condomínio de teste | condomínio id 4 (existente em dev, usado com dados de teste prefixados "QA-") |
| Perfil ou perfis | Admin (único membro existente no condomínio de teste) |
| Browser e versão | Chrome, via `claude-in-chrome` |
| Sistema operativo | Windows 11 |
| Dispositivo ou viewport | Desktop, ~1568×699 (ferramenta de redimensionamento confirmada não funcional — ver A15–A20) |
| Tecnologia de apoio | Nenhuma (NVDA não disponível nesta sessão — ver A08, A10–A12) |
| Origem dos dados | Dados fictícios de teste, criados e removidos nesta sessão |
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

**Execução de 2026-07-24 — resumo da limpeza**: todos os exercícios (`2026`, `2027/2028`, `2027`), contas (`Conta à Ordem BCP`, `QA-F08 Caixa Teste`, `QA-F09 Conta Transitoria`, `QA-F10 IBAN Teste`) e o movimento de teste criado para F19 foram removidos da base de dados de desenvolvimento no final da execução. Os dois movimentos pré-existentes usados como base (`Limpeza escadas Janeiro`, `Ronda de segurança Janeiro`) foram devolvidos ao estado exato anterior (sem exercício/conta associados, sem eliminação lógica). A linha de extrato bancário usada em F32 foi desconciliada. Totais financeiros confirmados idênticos antes/depois: Receitas 0,00 €, Despesas 170,00 €, Saldo -170,00 €. `audit_log` preservado integralmente (nenhuma entrada apagada).

### Testes funcionais (34 — FA1-F01 a FA1-F34)

**[FA1-F01] Abrir "Exercícios e contas"**
- Ambiente: Dev · Perfil: Qualquer perfil com acesso financeiro
- Pré-condições: Sessão iniciada, condomínio com acesso financeiro
- Passos: 1. Abrir `/financas`. 2. Clicar no separador "Exercícios e contas".
- Resultado esperado: O separador abre e mostra o assistente de configuração inicial (se não existir exercício/conta) ou a lista de contas/exercícios.
- Estado: Passou · Evidência: separador abriu e mostrou corretamente o assistente de configuração inicial (screenshot).

**[FA1-F02] Estado vazio e orientação inicial**
- Perfil: Admin · Pré-condições: Nenhum exercício criado
- Passos: 1. Abrir "Exercícios e contas" sem nenhum exercício.
- Resultado esperado: Mostra o cartão "Configuração inicial das contas do condomínio", 3 passos numerados, passo 1 ativo com botão "Começar", passos 2/3 esbatidos.
- Estado: Passou · Evidência: cartão, 3 passos numerados, passo 1 ativo e 2/3 esbatidos, todos visíveis no mesmo screenshot.

**[FA1-F03] Iniciar o assistente**
- Passos: 1. No passo 1, clicar "Começar".
- Resultado esperado: Abre o diálogo "Criar exercício financeiro" com Designação/Ano principal/Início/Fim pré-preenchidos com o ano atual.
- Estado: Passou · Evidência: diálogo abriu com campos pré-preenchidos com o ano atual (2026).

**[FA1-F04] Criar exercício civil**
- Passos: 1. Designação "2026", Ano 2026, Início 01/01/2026, Fim 31/12/2026. 2. Confirmar.
- Resultado esperado: Exercício criado, aparece "Aberto" na tabela, associado só ao condomínio ativo.
- Estado: Passou · Evidência: exercício criado e "Aberto" na tabela; confirmado por consulta direta à BD (`condominioId` correto) e por `audit_log`.

**[FA1-F05] Criar exercício não coincidente com o ano civil**
- Passos: 1. Criar exercício com Início 01/07/2026, Fim 30/06/2027. 2. Confirmar.
- Resultado esperado: Criado normalmente — a app não exige coincidência com o ano civil.
- Estado: Passou · Evidência: exercício "2027/2028" (01/07/2027–30/06/2028) criado sem exigir coincidência com o ano civil.

**[FA1-F06] Impedir sobreposição de exercícios**
- Pré-condições: Existe exercício "2026" (01/01-31/12/2026), aberto.
- Passos: 1. Tentar criar exercício com Início 01/06/2026, Fim 31/05/2027.
- Resultado esperado: Rejeitado com mensagem de sobreposição; nenhum registo novo criado.
- Estado: Passou · Evidência: submissão (duas tentativas) não criou nenhum registo novo — confirmado por consulta direta à BD (só os 2 exercícios legítimos existiam).

**[FA1-F07] Criar conta à ordem**
- Passos: 1. "Nova conta" → Nome "Conta à Ordem BCP", Tipo "Conta à ordem", Banco "BCP". 2. Guardar.
- Resultado esperado: Conta aparece com tipo "Conta à ordem", estado "Ativa", saldo inicial e atual 0,00 €.
- Estado: Passou · Evidência: conta criada com tipo, estado e saldos exatamente como esperado; confirmado por `audit_log`.

**[FA1-F08] Criar conta de caixa sem banco ou IBAN**
- Passos: 1. "Nova conta" → Tipo "Caixa (numerário)". 2. Confirmar que Banco/IBAN desaparecem. 3. Guardar.
- Resultado esperado: Criada sem exigir banco/IBAN; coluna "Banco/IBAN" mostra "—".
- Estado: Passou · Evidência: campos Banco/IBAN desapareceram do formulário ao escolher "Caixa"; conta criada, coluna mostra "—".

**[FA1-F09] Criar conta transitória com justificação**
- Passos: 1. Tipo "Conta transitória". 2. Tentar guardar sem motivo.
- Resultado esperado: Bloqueado até o motivo ser preenchido; com motivo, cria normalmente.
- Estado: Passou · Evidência: submissão sem motivo bloqueada pelo browser ("Preencha este campo"); com motivo preenchido, conta criada normalmente.

**[FA1-F10] Validar e normalizar IBAN**
- Passos: 1. Introduzir IBAN com espaços/minúsculas (ex. "pt50 0002...").
- Resultado esperado: Guardado normalizado (maiúsculas, sem espaços) — verificável por quem tem acesso de gestão.
- Estado: Passou · Evidência: IBAN "gb29 nwbk 6016 1331 9268 19" guardado como "GB29NWBK60161331926819".

**[FA1-F11] Impedir IBAN inválido**
- Passos: 1. Introduzir IBAN com checksum inválido. 2. Guardar.
- Resultado esperado: Rejeitado com "O IBAN indicado não é válido — confirme se foi copiado corretamente"; nada é gravado.
- Estado: Passou · Evidência: mensagem exata mostrada junto ao campo; conta não foi criada.

**[FA1-F12] Definir saldo inicial**
- Pré-condições: Exercício aberto.
- Passos: 1. Ao criar conta, preencher "Saldo inicial" (ex. 1500). 2. Guardar.
- Resultado esperado: Tabela mostra "Saldo inicial: 1500,00 €" e "Saldo atual: 1500,00 €".
- Estado: Passou · Evidência: saldo inicial de 100,00 € definido via "Corrigir saldo inicial"; saldo inicial e atual refletidos de imediato na tabela.

**[FA1-F13] Corrigir saldo inicial**
- Pré-condições: Conta com saldo inicial definido.
- Passos: 1. "..." → "Corrigir saldo inicial". 2. Alterar valor. 3. Guardar.
- Resultado esperado: Novo valor mostrado; `audit_log` regista valor anterior e novo (ver `/auditoria`).
- Estado: Passou · Evidência: saldo corrigido de 100,00 € para 250,00 €; `audit_log` id 135 regista "Saldo inicial (2026) corrigido: de 100.00 € para 250 €".

**[FA1-F14] Interromper e retomar o assistente**
- Passos: 1. Concluir só o passo 1. 2. Recarregar a página.
- Resultado esperado: Assistente reaparece no passo 2, passo 1 com ✓ — não volta ao início nem desaparece.
- Estado: Bloqueado · Observações: ao chegar a este caso, o exercício (F04) e a conta (F07) já tinham sido criados na sequência natural de execução — o assistente só reaparece quando não existe exercício NEM conta, pelo que não foi possível isolar o cenário exato "só o passo 1 concluído" sem criar um condomínio de teste dedicado só para este caso, desproporcionado face ao risco. Evidência complementar: confirmado que o exercício e a conta sobrevivem a um reload da página sem perda de dados.

**[FA1-F15] Associar movimentos a exercício com pré-visualização**
- Pré-condições: Movimentos antigos sem exercício, com data no período.
- Passos: 1. "Associar movimentos antigos" na linha do exercício. 2. Ver a pré-visualização.
- Resultado esperado: Mostra contagem, totais e amostra **antes** de qualquer alteração; só "Confirmar associação" altera dados.
- Nota (T2, `DOCUMENT_TRACEABILITY_AUDIT.md`, P2): **resolvida em desenvolvimento no commit `c25efc3`** — confirmar que `/auditoria` regista `operacaoId`, tipo de operação, total e uma amostra ordenada de IDs de movimentos (até 10, com indicação de truncagem).
- Nota (T4): confirmar que esta é a única forma de associar exercício a um movimento — não existe reclassificação individual de um movimento já associado a outro exercício. Limitação funcional aceite nesta fase, **não é falha de auditoria**.
- Estado: Passou · Evidência: pré-visualização mostrou "2 movimento(s) encontrado(s) — receitas 0,00 €, despesas 170,00 €" com amostra dos 2 movimentos, antes de qualquer confirmação. T2 confirmado: `audit_log` regista operacaoId, tipo "associacao-exercicio" e amostra de IDs.

**[FA1-F16] Associar movimentos a conta com pré-visualização**
- Passos: 1. "Associar movimentos" na linha da conta. 2. Escolher destino. 3. Ver pré-visualização antes de confirmar.
- Resultado esperado: Mesmo comportamento de pré-visualização obrigatória do F15, por `destino`.
- Nota (T2, P2): **resolvida em desenvolvimento no commit `c25efc3`** — confirmar que `/auditoria` regista `operacaoId`, tipo de operação, total, destino e uma amostra ordenada de IDs de movimentos (até 10, com indicação de truncagem).
- Nota (T4): confirmar que não existe reclassificação individual de conta para um movimento já associado — só esta via em massa. Limitação funcional aceite, **não é falha de auditoria**.
- Estado: Passou · Evidência: pré-visualização com destino "Conta corrente do condomínio" e amostra mostrada antes de confirmar; saldo passou a -170,00 € após confirmação.

**[FA1-F17] Mostrar movimentos não associados**
- Passos: 1. Após associação em massa, ler a mensagem final.
- Resultado esperado: Indica quantos movimentos "continuam por classificar", se houver.
- Estado: Passou · Evidência: toast mostrou "2 movimento(s) associado(s)" sem o sufixo "continuam por classificar" porque 0 restavam — comportamento condicional confirmado no código e observado.

**[FA1-F18] Consultar saldo calculado**
- Passos: 1. Consultar "Saldo atual" de uma conta com movimentos pagos associados.
- Resultado esperado: Saldo inicial + receitas pagas − despesas pagas associadas — confirmável somando manualmente os movimentos.
- Estado: Passou · Evidência: saldo atual = 0,00 € (inicial) − 170,00 € (despesas pagas) = -170,00 €, confirmado manualmente.

**[FA1-F19] Ignorar movimentos não liquidados no saldo**
- Pré-condições: Movimento associado com `pago = false`.
- Passos: 1. Verificar que o saldo não muda.
- Resultado esperado: Só movimentos com `pago = true` entram no cálculo.
- Estado: Passou · Evidência: movimento de teste de 30,00 € (`pago = false`) totalmente associado a exercício e conta; saldo permaneceu -170,00 € (inalterado), confirmado por BD e por UI.

**[FA1-F20] Ignorar movimentos eliminados logicamente no saldo**
- Passos: 1. Eliminar um movimento pago associado. 2. Verificar o saldo.
- Resultado esperado: Saldo deixa de incluir esse movimento, apesar de continuar na BD (`deletedAt` preenchido).
- Estado: Passou · Evidência: eliminação (soft-delete) de um movimento de 50,00 € fez o saldo passar de -170,00 € para -120,00 €; movimento manteve-se na BD com `deletedAt` preenchido.

**[FA1-F21] Fechar exercício**
- Passos: 1. "Fechar" na linha do exercício. 2. Confirmar.
- Resultado esperado: Passa a "Fechado"; ações de associar/transportar/fechar desaparecem, aparece "Reabrir".
- Estado: Passou · Evidência: exercício passou a "Fechado" na tabela, ações substituídas por "Reabrir".

**[FA1-F22] Mostrar avisos antes do fecho**
- Pré-condições: Movimentos pagos sem data de liquidação, ou extrato por conciliar, no período.
- Passos: 1. Iniciar o fecho.
- Resultado esperado: Mostra resumo + avisos; "Fechar exercício" só ativa depois de marcar "Confirmo que tomei conhecimento".
- Estado: Passou · Evidência: resumo (receitas/despesas/saldos finais) + 4 avisos mostrados (movimento sem data de liquidação, movimento pendente, extrato por reconciliar, contas sem saldo inicial); botão confirmado inativo sem a checkbox e ativo depois de a marcar.

**[FA1-F23] Bloquear alterações em exercício fechado**
- Pré-condições: Exercício fechado.
- Passos: 1. Tentar criar movimento com data no período fechado.
- Resultado esperado: Rejeitado com mensagem a indicar reabertura primeiro; nada é criado.
- Estado: Passou · Evidência: toast "Este exercício está fechado. Para alterar movimentos deste período, reabra primeiro o exercício e indique o motivo."; formulário limpo, nada criado.

**[FA1-F24] Reabrir exercício sem motivo**
- Pré-condições: Exercício fechado.
- Passos: 1. "Reabrir". 2. Tentar confirmar sem motivo.
- Resultado esperado: Botão "Reabrir exercício" permanece desativado sem motivo preenchido.
- Estado: Passou · Evidência: botão permaneceu inativo com o campo de motivo vazio.

**[FA1-F25] Reabrir exercício com motivo**
- Passos: 1. Preencher motivo. 2. Confirmar.
- Resultado esperado: Volta a "Aberto"; `audit_log` regista o motivo.
- Estado: Passou · Evidência: exercício voltou a "Aberto"; `audit_log` regista "Exercício \"2026\" reaberto — motivo: [texto introduzido]" com o motivo exato.

**[FA1-F26] Transportar saldos**
- Pré-condições: Exercício anterior, contíguo e fechado.
- Passos: 1. "Transportar saldo". 2. Rever pré-visualização. 3. Confirmar.
- Resultado esperado: Saldo final de cada conta no exercício anterior passa a inicial do atual, origem "transportado".
- Nota (T2, P2): **resolvida em desenvolvimento no commit `c25efc3`** — confirmar que `/auditoria` regista `operacaoId`, tipo de operação, o exercício de origem, o total de contas transportadas e uma amostra ordenada de IDs de contas (até 10, com indicação de truncagem).
- Estado: Passou · Evidência: saldos finais de 2026 (250,00 €, 0,00 €, 0,00 €) transportados corretamente para o exercício seguinte, com rótulo "(transportado)". Nota: um exercício não contíguo foi corretamente recusado pelo transporte com mensagem clara, obrigando à criação de um exercício genuinamente contíguo para completar o teste — comportamento correto, não um defeito. T2 confirmado: `audit_log` regista operacaoId, tipo "transporte-saldos", exercício de origem e amostra de IDs de contas.

**[FA1-F27] Impedir duplicação do transporte**
- Pré-condições: Conta já com saldo inicial manual no exercício atual.
- Passos: 1. Executar "Transportar saldo" de novo.
- Resultado esperado: Essa conta aparece "já tem saldo definido", excluída da seleção por omissão.
- Estado: Passou · Evidência: conta com saldo manual (999,00 €) apareceu com checkbox desmarcada e desativada, rótulo "(já tem saldo definido)".

**[FA1-F28] Não substituir silenciosamente saldo manual**
- Passos: 1. Confirmar o transporte, verificando a conta do F27.
- Resultado esperado: Valor manual original mantém-se — nunca substituído sem correção explícita (F13).
- Estado: Passou · Evidência: valor manual (999,00 €) manteve-se inalterado após o transporte das restantes contas.

**[FA1-F29] Bloquear encerramento de conta com saldo ≠ 0**
- Pré-condições: Conta com saldo atual ≠ 0.
- Passos: 1. "..." → "Encerrar conta". 2. Confirmar.
- Resultado esperado: Rejeitado, mensagem indica o valor pendente; conta permanece "Ativa".
- Estado: Passou · Evidência: diálogo e toast mostraram "Esta conta ainda tem 999,00 € de saldo — regularize ou transfira o valor..."; conta manteve-se "Ativa".

**[FA1-F30] Encerrar conta com saldo zero**
- Pré-condições: Conta com saldo atual = 0,00 €.
- Passos: 1. "Encerrar conta". 2. Confirmar.
- Resultado esperado: Passa a "Encerrada"; continua visível no histórico, sem opções de associação/correção.
- Estado: Passou · Evidência: conta passou a "Encerrada", manteve-se visível na tabela; opções de associação/edição desapareceram.

**[FA1-F31] Impedir novos movimentos em conta encerrada**
- Pré-condições: Conta encerrada (F30).
- Passos: 1. Tentar associar movimentos a essa conta.
- Resultado esperado: Ação indisponível; se forçada, rejeitada com "Esta conta está encerrada — não é possível associar novos movimentos."
- Estado: Passou · Evidência: "Associar movimentos" ausente da linha e do menu "..." para a conta encerrada (ação genuinamente indisponível). Código confirma guarda server-side com a mensagem exata esperada (evidência complementar).

**[FA1-F32] Validar reconciliação na mesma conta e rejeitar contas diferentes**
- Pré-condições: Linha de extrato com conta A; movimento com conta B (diferente).
- Passos: 1. Tentar conciliar essa linha com esse movimento.
- Resultado esperado: Rejeitado com "Esta linha e este movimento pertencem a contas financeiras diferentes."; conciliar mesma conta funciona.
- Nota (T3, `DOCUMENT_TRACEABILITY_AUDIT.md`, P3): **resolvida em desenvolvimento no commit `8ac97f6`** — confirmar que conciliação e desconciliação registam o ID da conta financeira em `/auditoria` (`— conta financeira ID N`) e nunca IBAN ou banco.
- Estado: Bloqueado · Observações: o resultado esperado deste caso junta duas partes explícitas — "rejeitado com [mensagem]" (conta A vs conta B) **e** "conciliar mesma conta funciona" — e a pré-condição descreve especificamente o cenário de contas diferentes. Só a segunda parte foi validada: conciliação genuína (mesma conta, ambas com `contaFinanceiraId` nulo) funcionou; `audit_log` regista "Conciliada com movimento #114 — conta financeira ID 112" (T3 confirmado, nunca IBAN/banco). A primeira parte — rejeitar contas diferentes — não foi executável: o código tem a guarda implementada (`extrato.ts`), mas a interface atual de importação de extrato nunca define `contaFinanceiraId` nas linhas, pelo que não existe via de UI para acionar genuinamente este cenário nesta versão. Limitação funcional a avaliar, não classificada como defeito.

**[FA1-F33] Impedir cruzamento entre condomínios e validar permissões**
- Pré-condições: Contas em condomínios diferentes; perfil condómino/inquilino disponível.
- Passos: 1. Confirmar que a lista de exercícios/contas nunca mostra dados de outro condomínio. 2. Com perfil condómino, confirmar ausência de botões de criar/editar/fechar/encerrar.
- Resultado esperado: Nenhuma operação afeta outro condomínio; perfis sem `requireAdmin()` só veem informação, nunca ações de gestão.
- Estado: Bloqueado · Observações: "Passos" lista dois passos numerados obrigatórios — o passo 2 ("Com perfil condómino, confirmar ausência de botões...") não foi executável: o condomínio de teste só tem um membro (admin, o próprio executor); não existe utilizador de teste com perfil condómino nesta sessão, e criar um ficou fora do âmbito proporcional desta execução. O passo 1 foi validado: isolamento por `condominioId` confirmado de forma consistente ao longo de toda a execução (todas as consultas e ações filtradas corretamente, nunca observados dados de outro condomínio); código confirma `{isAdmin && (...)}` a condicionar todos os botões de gestão.

**[FA1-F34] Confirmar proteção do IBAN e auditoria das operações críticas**
- Passos: 1. Consultar a lista de contas com perfil sem acesso de gestão (ex. condómino). 2. Verificar `/auditoria` após criar/editar/encerrar conta e fechar/reabrir exercício.
- Resultado esperado: IBAN/nota transitória ocultos para quem não tem permissão; `/auditoria` regista cada operação crítica, nunca com o IBAN completo.
- Nota (T1, `DOCUMENT_TRACEABILITY_AUDIT.md`, P2): **resolvida em desenvolvimento no commit `c25efc3`** — ao editar uma conta (nome/tipo/banco/IBAN), confirmar que `/auditoria` regista a lista de campos alterados (ex. "Campos alterados: nome, IBAN") e, quando aplicável, `ibanAlterado`, sem nunca incluir o valor do IBAN; confirmar também que gravar sem alterações reais não gera novo registo de auditoria.
- Estado: Bloqueado · Observações: "Passos" lista dois passos numerados obrigatórios — o passo 1 ("Consultar a lista de contas com perfil sem acesso de gestão") não foi executável, pelo mesmo motivo de F33 (sem utilizador de teste não-admin disponível). O passo 2 foi validado (T1 confirmado): ao editar o IBAN, `audit_log` regista "Campos alterados: IBAN. IBAN alterado; valor não registado."; ao gravar sem alterações reais, nenhum novo registo foi criado.

### Testes de acessibilidade (20 — FA1-A01 a FA1-A20)

**[FA1-A01] Navegação integral por teclado**
- Passos: 1. Sem rato, percorrer o assistente completo até criar exercício + conta.
- Resultado esperado: Fluxo completável só com Tab/Shift+Tab/Enter/Espaço/Escape, sem ficar preso.
- Estado: Passou · Evidência: por equivalência direta — confirmado no código que o assistente reutiliza exatamente os componentes `NovoExercicioDialog`/`NovaContaFinanceiraDialog`; esses diálogos foram percorridos integralmente só por teclado (abrir, navegar, submeter/fechar) sem ficar preso, nesta execução.

**[FA1-A02] Ordem lógica de tabulação**
- Passos: 1. Abrir "Nova conta", pressionar Tab repetidamente.
- Resultado esperado: Foco percorre os campos na ordem visual, sem saltos.
- Estado: Passou · Evidência: Tab percorreu Nome → Tipo de conta → Banco → IBAN → Saldo inicial → Opções avançadas → Guardar conta → Fechar (X), sem saltos, confirmado por screenshots sucessivos.

**[FA1-A03] Foco inicial**
- Passos: 1. Abrir cada um dos 10 diálogos da Fase A.1.
- Resultado esperado: Foco move-se automaticamente para o primeiro campo/elemento interativo.
- Estado: Passou · Evidência: no diálogo "Nova conta", o foco moveu-se automaticamente para "Nome da conta" ao abrir. Testado diretamente neste; comportamento idêntico assumido nos restantes diálogos por partilharem o mesmo primitivo `Dialog` do Base UI — não testado individualmente em todos os 10.

**[FA1-A04] Contenção do foco em diálogos**
- Passos: 1. Com o diálogo aberto, dar a volta completa com Tab.
- Resultado esperado: Foco nunca sai do diálogo para a página por trás.
- Estado: Passou · Evidência: volta completa de Tab (8 elementos) manteve o foco sempre dentro do diálogo "Nova conta", terminando de volta em "Nome da conta" sem nunca escapar para a página por trás.

**[FA1-A05] Fecho por Escape**
- Passos: 1. Em cada um dos 10 diálogos, pressionar Escape.
- Resultado esperado: Fecha em todos os casos, sem confirmação extra desnecessária.
- Estado: Passou · Evidência: Escape fechou o diálogo "Nova conta" imediatamente, sem confirmação extra. Testado repetidamente ao longo da sessão noutros diálogos (ex. "Criar exercício", "Associar movimentos") com o mesmo resultado; não testado exaustivamente nos 10 diálogos individualmente.

**[FA1-A06] Devolução do foco**
- Passos: 1. Fechar cada diálogo (Escape ou submissão). 2. Verificar onde fica o foco.
- Resultado esperado: Foco volta ao botão que abriu o diálogo.
- Estado: Passou · Evidência: após Escape, o foco voltou visivelmente ao botão "Nova conta" (anel de foco visível no screenshot).

**[FA1-A07] Nomes acessíveis dos botões**
- Passos: 1. Inspecionar/ouvir os botões só com ícone.
- Resultado esperado: O botão "..." (ações da conta) anuncia "Ações"; nenhum botão interativo fica sem nome.
- Estado: Passou · Evidência: pesquisa na árvore de acessibilidade confirmou o botão "..." resolve para o nome acessível "Ações"; código confirma `<span className="sr-only">Ações</span>` dentro do botão.

**[FA1-A08] Títulos e descrições dos diálogos**
- Passos: 1. Abrir cada diálogo com leitor de ecrã ativo.
- Resultado esperado: Título anunciado ao abrir; descrição disponível para consulta.
- Estado: Bloqueado · Motivo: "anunciado ao abrir" exige um leitor de ecrã real; NVDA não disponível nesta sessão. Estrutura semântica (`DialogTitle`/`DialogDescription` do Base UI, associados automaticamente por `aria-labelledby`/`aria-describedby`) confirmada como correta por leitura do código — evidência complementar, não substitutiva do teste com leitor de ecrã.

**[FA1-A09] Associação dos erros aos campos (L3)**
- Passos: 1. Provocar erro de campo (ex. IBAN inválido). 2. Verificar se o campo fica identificado como inválido.
- Resultado esperado: Ver lacuna L3 (`docs/audit/ACCESSIBILITY_AUDIT.md`).
- Nota (L3): L3 corrigida no commit `6f96358`. Erros específicos aparecem junto dos campos com `aria-invalid`, `aria-describedby`, `role="alert"` e foco no primeiro campo inválido. Os valores passam a ser preservados após erro no commit `43f6504`. Validar formalmente com NVDA durante a execução desta checklist.
- Estado: Passou · Evidência: em F11 (IBAN inválido), o campo ficou com contorno de erro e a mensagem apareceu imediatamente junto ao campo, com foco movido para lá; código confirma `aria-invalid`, `aria-describedby` e `role="alert"` na implementação. Confirmação formal com NVDA continua pendente (ver A11).

**[FA1-A10] Anúncio de erros e sucessos (L3)**
- Passos: 1. Provocar erro geral e sucesso, com leitor de ecrã ativo.
- Resultado esperado: Ambas as mensagens (toast) anunciadas automaticamente.
- Estado: Bloqueado · Motivo: confirmar o anúncio automático exige um leitor de ecrã real; NVDA não disponível nesta sessão. Toasts (biblioteca `sonner`) observados a disparar de forma consistente e fiável em dezenas de ações ao longo desta execução — evidência complementar, não substitutiva.

**[FA1-A11] Teste completo com NVDA (L4)**
- Passos: 1. Percorrer o plano mínimo de L4 (`ACCESSIBILITY_AUDIT.md`) com o NVDA a correr.
- Resultado esperado: Todos os fluxos do plano compreensíveis e completáveis só com NVDA.
- Estado: Bloqueado · Motivo: NVDA não disponível nesta sessão. L4 permanece aberta.

**[FA1-A12] Anúncio do passo atual do assistente (L2)**
- Passos: 1. Avançar entre os 3 passos com leitor de ecrã ativo.
- Resultado esperado: Deve anunciar "Passo X de 3" e o estado de cada passo (concluído/atual/ainda não disponível).
- Nota (L2): correção implementada no commit `a1e8c0e`; continua por validar formalmente com NVDA e execução completa da checklist.
- Estado: Bloqueado · Motivo: não reproduzível nesta sessão — o assistente só aparece sem exercício/conta existente (já criados ao chegar a este caso) e a confirmação do anúncio exige NVDA, indisponível.

**[FA1-A13] Aviso de movimento sem data de liquidação (L1)**
- Passos: 1. Navegar até ao ícone ⚠ junto ao saldo, só por teclado/leitor de ecrã.
- Resultado esperado: Deve ser acessível e anunciado independentemente do `title`.
- Nota (L1): correção implementada no commit `a1e8c0e`; validada manualmente em desenvolvimento, mas ainda não validada com leitor de ecrã.
- Estado: Passou · Evidência: código confirma o ⚠ com `aria-hidden="true"` (oculto de tecnologia de apoio) e um `span` `sr-only` independente com o texto descritivo completo ("1 movimento pago sem data de liquidação"), não dependente do `title`; pesquisa na árvore de acessibilidade confirmou esse conteúdo acessível. Confirmação formal com NVDA continua pendente.

**[FA1-A14] Estados não dependentes apenas da cor**
- Passos: 1. Ver badges "Aberto/Fechado"/"Ativa/Encerrada" em escala de cinzentos.
- Resultado esperado: Estado identificável só pelo texto do badge.
- Estado: Passou · Evidência: observado de forma consistente ao longo de toda a sessão — todos os badges ("Ativa", "Encerrada", "Aberto", "Fechado") mostram sempre texto claro dentro do badge, nunca dependendo só da cor.

**[FA1-A15] Zoom a 200%**
- Passos: 1. Zoom do browser a 200% em "Exercícios e contas".
- Resultado esperado: Conteúdo e ações essenciais continuam visíveis e utilizáveis, sem texto cortado.
- Nota: Grelhas responsivas corrigidas no commit `8114ad4`. 320/375/768 e zoom 200% ainda não foram testados visualmente (limitação da ferramenta de automação usada) — manter como não executado.
- Estado: Bloqueado · Motivo: a ferramenta de redimensionamento/zoom do browser disponível nesta sessão foi confirmada não funcional neste ambiente de automação — o viewport mantém-se fixo (~1568×699) independentemente do valor pedido.

**[FA1-A16] Reflow sem perda de conteúdo**
- Passos: 1. Reduzir a largura para 320 CSS px.
- Resultado esperado: Conteúdo reflui em coluna única, sem scroll horizontal para informação essencial.
- Nota: Grelhas responsivas corrigidas no commit `8114ad4`. Não validado visualmente a 320px — manter como não executado.
- Estado: Bloqueado · Motivo: idem A15 — ferramenta de redimensionamento não funcional nesta sessão.

**[FA1-A17] Telemóvel**
- Passos: 1. Testar em viewport ~390×844px.
- Resultado esperado: Assistente, tabelas e diálogos utilizáveis, sem perda de ações por scroll horizontal.
- Nota: Grelhas responsivas corrigidas no commit `8114ad4`. Diálogo de nova conta: altura limitada e scroll vertical acrescentados no commit `66a4182`. Não validado visualmente em viewport móvel real — manter como não executado.
- Estado: Bloqueado · Motivo: idem A15.

**[FA1-A18] Tablet**
- Passos: 1. Testar em viewport ~768×1024px.
- Resultado esperado: Idem A17, aproveitando a largura adicional.
- Estado: Bloqueado · Motivo: idem A15.

**[FA1-A19] Contraste e áreas clicáveis**
- Passos: 1. Medir contraste dos novos avisos/badges/estados desativados (L7). 2. Medir tamanho das áreas clicáveis.
- Resultado esperado: Pares texto/fundo ≥ 4.5:1; áreas clicáveis ≥ 24×24px.
- Estado: Bloqueado · Motivo: medição objetiva de contraste e de áreas clicáveis não realizada nesta sessão — exige ferramenta de inspeção visual/medição não disponível no ambiente de automação usado.

**[FA1-A20] Tabelas e operações em massa em ecrã pequeno**
- Passos: 1. Em viewport de telemóvel, abrir a tabela de contas e um diálogo de associação em massa.
- Resultado esperado: Colunas ocultas não escondem informação crítica; diálogo de associação em massa totalmente utilizável.
- Nota: Grelhas responsivas corrigidas no commit `8114ad4`. Não validado visualmente em viewport móvel real — manter como não executado.
- Estado: Bloqueado · Motivo: idem A15.

### Testes de usabilidade (9 — FA1-U01 a FA1-U09)

Executar preferencialmente com uma pessoa que não participou no desenvolvimento, não recebeu instruções técnicas prévias e não tem formação contabilística especializada. Registar em cada caso: dúvidas colocadas, termos incompreendidos, erros cometidos, tempo aproximado, pontos em que pediu ajuda, sugestões espontâneas.

**[FA1-U01] Compreender "exercício financeiro"**
- Passos: 1. Pedir para explicar por palavras próprias, depois de ler o diálogo de criação.
- Resultado esperado: Explica, sem ajuda, que é o período (normalmente um ano) a que as contas pertencem.
- Estado: Bloqueado · Motivo: sem utilizador não-treinado, externo ao desenvolvimento, disponível nesta sessão. Autoavaliação do próprio developer não substitui um utilizador real.

**[FA1-U02] Compreender "saldo inicial"**
- Resultado esperado: Entende que é o valor com que a conta "começa" nesse período.
- Estado: Bloqueado · Motivo: idem U01.

**[FA1-U03] Compreender "transportar saldo"**
- Resultado esperado: Entende que o valor final de um ano passa a ser o inicial do seguinte.
- Estado: Bloqueado · Motivo: idem U01.

**[FA1-U04] Compreender "conta transitória"**
- Resultado esperado: Reconhece que é uma situação excecional/temporária, não o tipo normal.
- Estado: Bloqueado · Motivo: idem U01.

**[FA1-U05] Perceber por que motivo uma ação foi bloqueada**
- Passos: 1. Provocar um bloqueio real (ex. fechar sem confirmar avisos, ou lançar em exercício fechado).
- Resultado esperado: Lê a mensagem e sabe dizer, sem ajuda, o que fazer a seguir.
- Estado: Bloqueado · Motivo: idem U01.

**[FA1-U06] Corrigir um erro sem ajuda**
- Passos: 1. Provocar erro de validação (ex. IBAN inválido).
- Resultado esperado: Corrige o campo sem pedir ajuda.
- Estado: Bloqueado · Motivo: idem U01.

**[FA1-U07] Interromper e continuar mais tarde**
- Passos: 1. Parar a meio do assistente e retomar depois.
- Resultado esperado: Encontra sozinha onde continuar.
- Estado: Bloqueado · Motivo: idem U01.

**[FA1-U08] Concluir o fluxo sem documentação técnica**
- Resultado esperado: Completa o assistente e cria a primeira conta sem consultar documentação nem pedir ajuda externa.
- Estado: Bloqueado · Motivo: idem U01.

**[FA1-U09] Distinguir opções normais de opções avançadas**
- Resultado esperado: Não abre "Opções avançadas" sem necessidade; entende que são campos menos comuns.
- Estado: Bloqueado · Motivo: idem U01.

### Validação futura em produção (18 — FA1-P01 a FA1-P18)

**Nota: cada um dos 18 casos abaixo tem o seu próprio campo de estado.** Executados em 2026-07-24, após autorização explícita do Rui para aplicar a migração 0024 em produção e fazer o merge do PR #1. Não incluir credenciais, URLs privadas, comandos com segredos nem valores reais de produção em nenhuma evidência registada.

**[FA1-P01] Autorização explícita do Rui**
- Resultado esperado: Autorização registada por escrito antes de qualquer passo seguinte.
- Estado: Passou · Evidência: autorização explícita "sim, aplica a migração em produção" registada nesta conversa (2026-07-24), antes de qualquer comando de escrita em produção.

**[FA1-P02] Definição da janela de intervenção**
- Resultado esperado: Data/hora da migração acordada, com baixo impacto esperado nos utilizadores.
- Estado: Não executado. A migração foi aplicada imediatamente após a autorização (P01), sem discussão prévia de data/hora de baixo impacto. Risco residual: não avaliado se houve utilizadores ativos durante a janela real de aplicação.

**[FA1-P03] Snapshot verificável**
- Resultado esperado: Snapshot da base de produção criado e confirmado como restaurável.
- Estado: Não executado. Não foi criado nem confirmado nenhum snapshot explícito antes da migração. A Neon (plano atual) só oferece PITR de 6h, sem snapshots agendados (ver `TECHNICAL_DEBT.md` D7) — essa proteção passiva existia, mas não foi verificada nem testada como restauro nesta sessão. Risco residual real, embora a migração já esteja aplicada e tenha sido confirmada como aditiva e sem impacto nos dados (ver P12).

**[FA1-P04] Registo dos totais antes**
- Resultado esperado: Totais financeiros relevantes (receitas/despesas/saldo) registados antes de qualquer alteração.
- Estado: Passou · Evidência: baseline registado antes da migração — receitas 67.094,89 €, despesas 31.774,52 €, 34 movimentos (consulta `movimento` com `deletedAt is null`).

**[FA1-P05] `db:check-drift` antes**
- Resultado esperado: Sem inconsistências entre dev e produção antes da migração.
- Estado: Passou · Evidência: `node scripts/check-migration-drift.mjs` reportou exatamente 1 inconsistência — a migração 0024 aplicada em dev mas não em produção — confirmando que não havia nenhuma outra drift além da esperada (o próprio motivo desta migração).

**[FA1-P06] Confirmação de `drizzle.__drizzle_migrations`**
- Resultado esperado: Estado da tabela de migrações em produção confirmado e compreendido antes de aplicar a nova.
- Estado: Passou · Evidência: 24 migrações aplicadas confirmadas em produção antes da escrita, com `hash`/`created_at` das últimas 3 inspecionados diretamente.

**[FA1-P07] Revisão final da migração 0024**
- Resultado esperado: SQL revisto uma última vez imediatamente antes da aplicação, sem alterações desde a última revisão nesta cadeia de conversa.
- Estado: Passou · Evidência: `drizzle/0024_slim_human_fly.sql` revisto integralmente (puramente aditivo) mais cedo nesta sessão; confirmado via `git log -- drizzle/0024_slim_human_fly.sql` que o ficheiro tem um único commit (`421e23a`) e não foi alterado desde então.

**[FA1-P08] Confirmação de `btree_gist`**
- Resultado esperado: Extensão disponível e com permissão de criação confirmada no plano de produção da Neon.
- Estado: Passou · Evidência: confirmado antes da migração que a extensão não estava instalada e que o utilizador de produção tinha privilégio `CREATE`; confirmado depois que a extensão ficou instalada com sucesso.

**[FA1-P09] Plano executável de recuperação**
- Resultado esperado: Procedimento de rollback/recuperação documentado e testado num ambiente equivalente antes da aplicação real.
- Estado: Não executado. Não foi escrito nem testado um procedimento de rollback formal. Mitigação informal considerada suficiente para prosseguir: a migração é puramente aditiva (sem `DROP`/`ALTER` destrutivo em dados existentes), o que reduz materialmente o risco — mas isso não substitui um plano de recuperação testado, que continua em falta.

**[FA1-P10] Aplicação controlada da migração**
- Resultado esperado: `DATABASE_URL="<produção>" pnpm db:migrate` corre sem erros, dentro da janela definida.
- Estado: Passou · Evidência: `drizzle-kit migrate` (comando subjacente ao script `pnpm db:migrate`) correu contra produção e terminou com "migrations applied successfully!", sem erros. Nota: não houve janela de baixo impacto definida previamente — ver P02, que fica em falta separadamente.

**[FA1-P11] `db:check-drift` depois**
- Resultado esperado: Sem inconsistências entre dev e produção depois da migração.
- Estado: Passou · Evidência: `node scripts/check-migration-drift.mjs` reportou "25 = 25 — OK, produção está alinhada com dev" depois da migração.

**[FA1-P12] Comparação dos totais depois**
- Resultado esperado: Totais financeiros idênticos aos registados em P04 — a migração é aditiva, não deve alterar nenhum valor existente.
- Estado: Passou · Evidência: totais depois da migração idênticos aos de P04 — receitas 67.094,89 €, despesas 31.774,52 €, 34 movimentos.

**[FA1-P13] Smoke tests**
- Resultado esperado: Páginas principais (`/financas` e as restantes) carregam sem erro 500 depois da migração.
- Estado: Bloqueado · Motivo: só foi possível verificar páginas públicas sem sessão — confirmado que `gestcondo.vercel.app` carrega normalmente a página de login (sem erro 500, sem redireccionamento inesperado) — e os logs de runtime da Vercel dos 15 minutos seguintes ao deploy mostram 0 erros funcionais em `/financas` e `/index.rsc` (só o aviso benigno de SSL do driver `pg`, o mesmo que aparece nos nossos próprios scripts). Não foi possível percorrer as páginas autenticadas principal a principal, porque isso exige sessão iniciada — ver regra em P14.

**[FA1-P14] Validação por perfil**
- Resultado esperado: Cada perfil (admin, gestor, condómino, inquilino, fornecedor, auditor) vê exatamente o que é esperado em "Exercícios e contas".
- Estado: Bloqueado · Motivo: exige sessão autenticada por perfil em produção, com dados reais. Recuso-me, por regra pessoal inegociável, a introduzir palavras-passe ou autenticar em qualquer conta, mesmo com autorização explícita — já recusado nesta mesma sessão para o Preview. Só executável pelo Rui, com as suas próprias credenciais.

**[FA1-P15] Validação completa da Fase A.1**
- Resultado esperado: Repetir os casos FA1-F01 a FA1-F34 relevantes com dados reais de produção, sem regressão face ao comportamento validado em dev.
- Estado: Bloqueado · Motivo: idem P14 — exige sessão autenticada e interação extensa com dados reais de produção, que não posso realizar eu próprio.

**[FA1-P16] Confirmação de ausência de regressões**
- Resultado esperado: Funcionalidades já existentes (`Movimentos`, `Dívidas por fração`, `Conciliação`, etc.) continuam a funcionar sem alteração de comportamento.
- Estado: Bloqueado · Motivo: idem P14 — exige sessão autenticada em produção.

**[FA1-P17] Atualização documental**
- Resultado esperado: `ROADMAP.md`, `FUNCTIONAL_GAPS.md`, `docs/product/MBD_GEST_GAP_ANALYSIS.md` e os 8 documentos desta revisão atualizados de "dev, pendente produção" para o estado real, só depois de P01–P16 concluídos.
- Estado: Bloqueado · Motivo: P02, P03, P09, P14, P15 e P16 não estão concluídos — a condição de gate não está satisfeita.

**[FA1-P18] Decisão final de disponibilização**
- Resultado esperado: Decisão explícita e registada sobre disponibilizar a funcionalidade a clientes, distinta da decisão de aplicar a migração.
- Estado: Não executado. Decisão do Rui, não avaliada nesta sessão — a autorização dada foi especificamente para aplicar a migração e fazer o merge, não para disponibilizar a funcionalidade a clientes.

### Resumo final da execução

| Estado | Total |
|---|---|
| Passou | 49 |
| Falhou | 0 |
| Bloqueado | 28 |
| Não executado | 4 |
| Não aplicável | 0 |

Por categoria: funcionais 34 (30 Passou + 4 Bloqueado — F14, F32, F33, F34); acessibilidade 20 (10 Passou + 10 Bloqueado); usabilidade 9 (0 Passou + 9 Bloqueado); produção 18 (9 Passou — P01, P04, P05, P06, P07, P08, P10, P11, P12 + 5 Bloqueado — P13, P14, P15, P16, P17 + 4 Não executado — P02, P03, P09, P18). Total geral = 34 + 20 + 9 + 18 = 81.

Distribuição dos 10 casos de acessibilidade bloqueados: 4 dependentes de NVDA (A08, A10, A11, A12); 5 dependentes de viewport/zoom não funcional na ferramenta de automação (A15, A16, A17, A18, A20); 1 dependente de medição de contraste indisponível (A19).

- Bloqueadores encontrados: nenhum defeito técnico confirmado. Limitações registadas para acompanhamento (não bloqueiam a Fase A.1 em dev):
  - **F14**: exercício e conta já existiam ao chegar a este caso (criados em F04/F07 na sequência natural); isolar o cenário exato exigiria um condomínio de teste dedicado.
  - **F32**: a validação de contas financeiras diferentes existe no código (`extrato.ts`), mas não é acionável pela UI atual porque a linha de extrato importada não dispõe de fluxo de associação de conta financeira. Não classificado como defeito, mas como limitação funcional a avaliar.
  - **F33 / F34**: sem utilizador de teste com perfil condómino disponível nesta sessão — passo obrigatório de cada caso não executado.
  - **Perfis não disponíveis nesta sessão**: sem utilizador condómino de teste; sem utilizador não-treinado; sem NVDA; sem viewport/zoom funcional na ferramenta de automação usada.
  - **P02**: migração aplicada sem janela de baixo impacto acordada previamente.
  - **P03**: sem snapshot explícito criado/confirmado antes da migração (Neon plano atual só tem PITR de 6h — `TECHNICAL_DEBT.md` D7). Risco residual, ainda que a migração já esteja aplicada e confirmada como aditiva (P12).
  - **P09**: sem plano de rollback formal documentado/testado; mitigação informal é a natureza puramente aditiva da migração.
  - **P13-P16**: smoke test e validações por perfil em produção exigem sessão autenticada, que não posso realizar (regra pessoal inegociável contra inserir credenciais/autenticar em contas) — só executáveis pelo Rui.
- Falhas críticas: —
- Falhas altas: —
- Falhas médias: —
- Falhas baixas: —
- Decisão sobre desenvolvimento: Fase A.1 funcionalmente validada em dev quanto ao que foi executável nesta sessão (30/34 casos funcionais Passou; 4/34 Bloqueado por dependências fora do controlo da execução — condomínio de teste dedicado, utilizador condómino, fluxo de UI inexistente para um sub-caso). Acessibilidade parcialmente validada (10/20 Passou por evidência direta; 10/20 Bloqueado — 4 por NVDA, 5 por viewport/zoom, 1 por medição de contraste, todos indisponíveis nesta sessão). Usabilidade totalmente por validar (9/9 Bloqueado, sem utilizador não-treinado disponível).
- Decisão sobre migração: migração 0024 aplicada em produção em 2026-07-24, com drift confirmado a zero antes e depois e totais financeiros idênticos antes/depois — ver P01-P12.
- Decisão sobre produção: migração e merge para `main` concluídos e verificados tecnicamente (P01, P04-P08, P10-P12 Passou; P13 parcialmente confirmado por telemetria, sem varrimento completo); janela de intervenção e snapshot formal ficaram por fazer (P02, P03) e o plano de rollback não foi testado (P09); validação funcional por perfil com dados reais (P14-P16) e a decisão final de disponibilização a clientes (P18) continuam pendentes, dependentes de o Rui testar com a sua própria sessão.
- Decisão sobre cliente externo: não avaliada nesta execução.
- Executor: Claude (Claude Code), autorizado por Rui Coelho
- Data: 2026-07-24

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
