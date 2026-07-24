# Auditoria de Documentos, Prova e Rastreabilidade — GestCondo (Fase E)

Data: 2026-07-22. Consolida as secções 8 (Documentos e Prova) e 9 (Auditoria e Rastreabilidade) do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. Verificado por leitura direta do código atual (`lib/db/schema.ts`, `app/actions/*.ts`, páginas de documentos).

## 8. Documentos e prova

### 8.1 Checklist por atributo, aplicada aos documentos existentes

| Documento | Identificação | Numeração | Data/hora | Autor | Condomínio | Versão/estado | Integridade | Proteção contra alteração silenciosa |
|---|---|---|---|---|---|---|---|---|
| Recibo (`/financas/recibo/[id]`) | ✅ `movimento.id` | 🟡 Usa `movimento.id` como "Nº" — sequencial, mas partilhado com despesas (não é uma sequência exclusiva de recibos) | ✅ | ✅ (`movimento.userId`) | ✅ | ❌ Sem conceito de "versão"; gerado a partir do estado atual do movimento | ✅ Não editável depois de gerado (é sempre recalculado a partir do movimento) | ✅ Movimento tem soft-delete, nunca `DELETE` físico |
| Relatório de movimentos (`/financas/relatorio`) | ❌ Sem identificador próprio (é uma vista agregada, não um documento registado) | ❌ | ✅ ("Gerado em") | ❌ Sem autor explícito no documento | ✅ | N/A (não é um documento versionado, é sempre o estado atual) | N/A | N/A |
| Balanço orçamento vs. real (`/financas/balanco/[id]`) | 🟡 Usa `orcamento.id` | ❌ | ✅ | ❌ | ✅ | N/A (idem) | N/A | N/A |
| Convocatória de assembleia | 🟡 É o próprio registo `assembleia`, sem documento separado gerado; enviada por email (`lib/email.ts`) | ❌ **Sem número sequencial de assembleia** (ex. "1ª Assembleia Ordinária de 2026") — só existe `assembleia.id` interno | ✅ `dataPrimeiraConvocatoria` | ✅ `userId` | ✅ | ✅ `estado` (`convocada/realizada/aprovada/cancelada`) | ✅ | ✅ Bloqueada após `aprovada` |
| Ata (`/assembleias/ata/[id]`) | 🟡 Idem — sem número próprio de ata | ❌ Mesmo gap | ✅ | ✅ | ✅ | ✅ `estado` | ✅ Imutável após aprovação (`app/actions/assembleias.ts:24-25`) | ✅ Confirmado por código — qualquer escrita numa assembleia `aprovada`/`cancelada` é rejeitada |
| Procurações (dentro da ata) | ✅ `assembleia_presenca.tipo='procuracao'` | N/A | ✅ | N/A | ✅ | ✅ Imutável com a ata | ✅ | ✅ |
| Orçamento | ✅ `orcamento.id`, único por (condomínio, ano) | 🟡 O ano funciona como "número" de facto | ✅ `createdAt` | ✅ | ✅ | ❌ Sem histórico de versões — alterar um orçamento existente sobrescreve o valor anterior (`onConflictDoUpdate`) | ❌ **Sem histórico de alterações ao valor do orçamento** | ❌ Ver LEGAL-02 (Fase D) — pode ser alterado sem ligação a uma nova deliberação |
| Deliberações (`assembleia_ponto.resultado`) | ✅ | N/A (numerado por `ordem` dentro da assembleia) | ✅ (`createdAt` do ponto) | ✅ | ✅ | ✅ Imutável com a assembleia | ✅ | ✅ |
| Declarações/certidões de dívida | ❌ Funcionalidade inexistente (ver `LEGAL-01`, Fase D) | — | — | — | — | — | — | — |
| Comunicações (avisos) | ✅ `aviso.id` | ❌ | ✅ | ✅ | ✅ | ❌ Sem versão — editar um aviso sobrescreve o texto anterior sem histórico | ❌ | ❌ `DELETE` físico (não soft-delete) |
| Documentos carregados | ✅ `documento.id` | ❌ | ✅ | ✅ | ✅ | ❌ Substituir um documento perde a versão anterior (já em `FUNCTIONAL_GAPS.md`) | 🟡 Ficheiro em Vercel Blob, bucket público (ver `SECURITY_AUDIT.md`) | ❌ `DELETE` físico |

### 8.2 Regra "não apagar documentos financeiros/jurídicos" — verificação

A regra do prompt ("a aplicação não deve apagar documentos financeiros ou jurídicos emitidos; deve usar anulação/substituição/nova versão/estorno/aditamento/retificação") está agora **aplicada a todas as tabelas de dados do condomínio**: `movimento` (já existia), e desde 2026-07-22 também `seguro`, `aviso`, `documento`, `ocorrencia` — todas com soft-delete (`deletedAt`), nunca `DELETE` físico. Testado em runtime (aviso criado/eliminado, confirmado que desaparece da UI mas mantém-se na BD com `deletedAt` definido). Corrigido também um ponto que só usava a query direta sem passar pela server action: o painel (`app/(app)/page.tsx`) lia `aviso`/`ocorrencia` diretamente sem filtrar `deletedAt` — ficaria a mostrar registos "eliminados" se não fosse corrigido no mesmo lote.

### 8.3 Achados novos desta fase (secção 8)

| ID | Título | Severidade | Prioridade |
|---|---|---|---|
| DOC-01 | `aviso`/`documento`/`ocorrencia` usam `DELETE` físico, não soft-delete (`seguro` **resolvido 2026-07-22**) | Média | P2 |
| DOC-02 | Sem número sequencial próprio para assembleias/atas (ex. "Ata n.º 3/2026") — só existe o `id` interno | Baixa | P3 |
| DOC-03 | Sem histórico de alterações ao valor de um orçamento (`onConflictDoUpdate` sobrescreve) | Média | P2 |
| DOC-04 | Recibo usa `movimento.id` como número — sequencial mas partilhado com despesas, não uma numeração exclusiva de recibos | Baixa | P3 (aceitável para condomínios sem IVA, conforme já analisado em `FUNCTIONAL_GAPS.md`/memória de sessão sobre validade fiscal de recibos) |

## 9. Auditoria e rastreabilidade

### 9.1 Cobertura do `audit_log` — operação a operação

**Nota sobre o estado da Fase A.1**: todas as linhas marcadas "Fase A.1" abaixo correspondem ao mesmo estado — **implementada e validada em desenvolvimento em 2026-07-24, pendente de promoção e validação em produção** — não repetido em cada linha por economia de espaço, mas aplicável a todas sem exceção. Nenhuma linha desta tabela afirma ou implica validação em produção.

**Nota metodológica**: a conservação do estado atual numa tabela (ex. `exercicio_financeiro.estado`, `conta_financeira.iban`) não constitui, por si só, rastreabilidade da alteração. Uma operação crítica só é considerada plenamente rastreável quando o registo de auditoria permite identificar, na medida aplicável: quem executou, quando, o que foi alterado, a entidade afetada, o estado anterior, o estado novo, o motivo e o âmbito (quando em massa). É por isto que operações que só alteram uma tabela sem gravar essa informação em `audit_log` estão marcadas "⚠️ Parcial" abaixo, mesmo quando a tabela em si reflete corretamente o estado final.

| Operação pedida pelo prompt | Auditada hoje? |
|---|---|
| Login | ✅ **Resolvido 2026-07-22** — hook `after` do better-auth (`lib/auth.ts`) em `/sign-in/email`, regista em `audit_log` para cada `membro` da conta |
| Falhas de login | ✅ **Resolvido 2026-07-22** — mesmo hook, deteta `ctx.context.returned instanceof APIError`; só regista se o email corresponder a uma conta real (não há `condominioId` a que atribuir tentativas contra emails inexistentes — ver `lib/audit.ts`) |
| Recuperação de conta (reset de password) | ✅ **Resolvido 2026-07-22** — hook em `/request-password-reset`, mesma limitação (só emails de contas reais) |
| Alteração de permissões (perfil) | ✅ `atualizarPerfilMembro` |
| Criação de utilizadores | ✅ (aprovação/rejeição de `membro`) |
| Exportação | 🟡 `exportarMeusDados()` (portabilidade RGPD) **passou a ser auditada 2026-07-22** (`registarAuditoria`, confirmado em runtime via `/auditoria`); a exportação CSV de movimentos continua sem registo, por ser só client-side, sem round-trip ao servidor |
| Consulta de dados sensíveis | ❌ Não (decisão deliberada — só escritas são auditadas, não leituras; ver nota abaixo) |
| Criação e alteração de titulares (frações/condóminos) | ✅ |
| Mudança de proprietário | ✅ (é uma alteração de `fracao`) |
| Alteração de permilagem | ✅ (idem) |
| Aprovação de orçamento | 🟡 Criação/atualização é auditada; não existe um conceito de "aprovação" formal distinto da criação (ver LEGAL-02) |
| Emissão de quotas | ✅ `gerarQuotasOrcamento` |
| Pagamento | ✅ `marcarComoPago`/`alternarPago` |
| Recibo | ❌ Gerar/imprimir um recibo não fica registado (é uma vista, não uma ação de escrita) |
| Estorno/anulação | 🟡 Não existe um "estorno" formal — eliminação (soft-delete) é o mecanismo equivalente, e essa é auditada |
| Criação de exercício financeiro | ✅ Fase A.1 — `criarExercicio()` regista designação e período |
| Edição de exercício financeiro | N/A — não existe operação de edição nesta fase; existem criação, fecho e reabertura |
| Fecho de exercício | ✅ Fase A.1 — `fecharExercicio()` regista o exercício, número de movimentos, totais de receitas e despesas e avisos confirmados |
| Reabertura de exercício | ✅ Fase A.1 — `reabrirExercicio()` exige e regista motivo obrigatório |
| Transporte de saldos | ✅ Fase A.1, **resolvido em desenvolvimento (commit `c25efc3`)** — `confirmarTransporteSaldos()` regista um `operacaoId` (UUID), o exercício de origem, o total de contas transportadas e uma amostra ordenada de IDs de contas financeiras (até 10, com indicação de truncagem) |
| Associação em massa a exercício | ✅ Fase A.1, **resolvido em desenvolvimento (commit `c25efc3`)** — regista `operacaoId`, o exercício, o total de movimentos associados e uma amostra ordenada de IDs de movimentos (até 10, com indicação de truncagem) |
| Criação de conta financeira | ✅ Fase A.1 — regista nome, tipo e saldo inicial quando aplicável, sem incluir o IBAN completo |
| Edição de conta financeira | ✅ Fase A.1, **resolvido em desenvolvimento (commit `c25efc3`)** — `atualizarContaFinanceira()` lê o estado anterior dentro de uma transação, compara com os novos valores e regista a lista de campos efetivamente alterados; quando o IBAN muda, regista `ibanAlterado` sem o valor completo, anterior ou novo; sem alteração real, não executa `UPDATE` nem regista auditoria (ver lacuna T1 resolvida, secção 9.1b) |
| Encerramento de conta financeira | ✅ Fase A.1 — regista que a conta foi encerrada com saldo zero |
| Definição e correção de saldo inicial | ✅ Fase A.1 — na correção, regista valor anterior e novo; na primeira definição, regista o valor definido |
| Associação em massa a conta | ✅ Fase A.1, **resolvido em desenvolvimento (commit `c25efc3`)** — regista `operacaoId`, o destino, o total de movimentos associados e uma amostra ordenada de IDs de movimentos (até 10, com indicação de truncagem) |
| Alteração individual de exercício de um movimento | N/A — a operação não existe nesta fase; só é possível associar em massa movimentos ainda sem exercício |
| Alteração individual de conta de um movimento | N/A — a operação não existe nesta fase; só é possível associar em massa movimentos ainda sem conta |
| Conciliação bancária | ⚠️ Fase A.1, parcial — `conciliarLinha()` regista o identificador do movimento e valida a compatibilidade da conta quando ambas estão definidas; **não inclui no texto a conta financeira envolvida** (ver lacuna T3) |
| Desconciliação bancária | ⚠️ Fase A.1, parcial — a operação é auditada, mas o texto não inclui a conta financeira envolvida |
| Proteção do valor completo do IBAN no `audit_log` | ✅ Fase A.1 — as chamadas atuais de `criarContaFinanceira`/`atualizarContaFinanceira` não incluem o IBAN completo nos detalhes de auditoria, mensagens de erro ou logs. A implementação atual de `registarAuditoria()` recebe texto livre — esta proteção depende da disciplina das chamadas existentes e deve continuar coberta por revisão e testes; **não se afirma impossibilidade estrutural** |
| Isolamento entre condomínios (Fase A.1) | ✅ Fase A.1 — `condominioId` é registado a partir do ator (`registarAuditoria`, nunca um valor vindo do cliente); as novas relações usam FK composta `(id, condominioId)`, confirmada por testes de integração |
| Upload | ✅ (criação de documento/ocorrência/seguro com anexo) |
| Download | ❌ Não — descarregar um documento já carregado não gera registo |
| Eliminação | ✅ |
| Assembleia (convocar, alterar) | ✅ |
| Votação | ✅ Confirmado — `registarVoto` (`app/actions/assembleias.ts:302-308`) chama `registarAuditoria` com o sentido de voto e a fração |
| Ata (aprovar) | ✅ `'Ata aprovada — assembleia encerrada e imutável'` |
| Alterações jurídicas | N/A — sem funcionalidade de gestão de documentos jurídicos formais ainda |
| Acessos de suporte | N/A — não existe a funcionalidade (confirmado na Fase B, `CONTROLLER_PROCESSOR_MATRIX.md` Cenário 5) |

### 9.1b Lacunas de rastreabilidade da Fase A.1 (parciais, não bloqueiam esta revisão documental)

| # | Lacuna | Gravidade | Impacto | Ficheiro/função | Recomendação futura | Exige código? | Prioridade |
|---|---|---|---|---|---|---|---|
| T1 | Edição de conta não indica quais campos mudaram — **resolvida em desenvolvimento, commit `c25efc3`** | Média | Não era possível determinar pelo `audit_log` se uma edição alterou nome, tipo, banco, IBAN, datas ou nota transitória. **Resolvido**: `atualizarContaFinanceira` lê o estado anterior dentro de uma transação, compara com os novos valores e regista a lista de campos alterados; quando o IBAN muda, regista `ibanAlterado` sem o valor completo, anterior ou novo; sem alteração real, não escreve nem audita. Testado em `lib/db/exercicios-financeiros.dbtest.ts` (alteração isolada, remoção de IBAN, ausência de alteração, `updatedAt` inalterado, isolamento multi-tenant). **Limitação residual**: uma transação simples não implementa controlo otimista nem bloqueio explícito para edições concorrentes na mesma conta — o risco residual é de precisão pontual do detalhe de auditoria numa janela muito curta, não de exposição do IBAN | `atualizarContaFinanceira` (`app/actions/contas-financeiras.ts`) | Concluída em desenvolvimento; validar novamente após eventual promoção a produção | Feito | P2 |
| T2 | Operações em massa só com total agregado — **resolvida em desenvolvimento, commit `c25efc3`** | Média | O log indicava quantos registos foram afetados, mas não quais. **Resolvido**: as 3 operações (`confirmarTransporteSaldos`, `confirmarAssociacaoExercicio`, `confirmarAssociacaoConta`) passaram a registar um `operacaoId` (UUID), o tipo de operação, o total e uma amostra ordenada de até 10 IDs (com indicação de truncagem) — IDs de contas no transporte de saldos, IDs de movimentos nas duas associações; sem auditoria quando zero registos são afetados. Testado com testes unitários do helper `formatarLogOperacaoMassa` e um teste de integração de isolamento por condomínio. **Nota**: melhora a rastreabilidade, mas não cria uma tabela completa de detalhe por operação — essa continua a ser uma possível evolução futura, não uma lacuna atual bloqueante | `confirmarTransporteSaldos`, `confirmarAssociacaoExercicio`, `confirmarAssociacaoConta` | Concluída em desenvolvimento; validar novamente após eventual promoção a produção | Feito | P2 |
| T3 | Conta financeira ausente do texto de conciliação | Baixa | Exige consulta cruzada ao movimento/extrato para saber a que conta uma conciliação pertence | `conciliarLinha`/`desfazerConciliacao` (`app/actions/extrato.ts`) | Registar `contaFinanceiraId` ou uma designação segura, sem IBAN | Sim | P3 |
| T4 | Reclassificação individual de movimento não implementada | Baixa (limitação funcional, não falha de auditoria) | Um movimento já classificado não pode ser corrigido individualmente através da interface | N/A — operação inexistente | Manter documentado para decisão futura | Só se a funcionalidade vier a ser aprovada | — |

T1 e T2 foram resolvidas em desenvolvimento (commit `c25efc3`) — ver detalhe nas linhas acima; typecheck, lint, 83/83 testes unitários e 23/23 testes de integração aprovados, mais smoke test manual em browser (produção não utilizada, nenhuma migração executada). Ambas permanecem pendentes de validação após uma eventual promoção a produção. T3 e T4 continuam em aberto, sem alterações. Nenhuma destas 4 lacunas bloqueia o encerramento desta revisão documental da Fase A.1.

### 9.2 Nota sobre "consulta de dados sensíveis"

A decisão de **não auditar leituras**, só escritas, é uma decisão de desenho razoável (auditar cada consulta geraria um volume enorme de registos de baixo valor) — mas o prompt pede explicitamente para verificar isto, por isso fica documentado como decisão consciente, não como omissão.

### 9.3 Definição de retenção, consulta e proteção do `audit_log`

| Aspeto | Estado |
|---|---|
| Informação registada | Ator (id, nome), ação, entidade, id da entidade, timestamp, resumo textual opcional — nunca duplica dados pessoais sensíveis de outras tabelas |
| Prazo de retenção | ❌ **Sem prazo definido nem expurgo automático** (já identificado em `GDPR_CHECKLIST.md` e em `docs/legal/DATA_RETENTION_MATRIX.md`) |
| Quem pode consultar | ✅ admin, gestor, auditor (`requireConsultaGestao`), por condomínio (`condominioId`) |
| Proteção contra alteração | O `audit_log` é imutável no funcionamento normal da aplicação e não tem expurgo automático — não existe nenhuma função `atualizarAuditLog`/`eliminarAuditLog`. Esta imutabilidade protege a integridade do histórico durante o período de conservação, mas **não define, por si só, retenção ilimitada**: o prazo, eventual arquivo, anonimização e eliminação controlada permanecem sujeitos a política formal e validação (ver `docs/legal/DATA_RETENTION_MATRIX.md`, ações prioritárias 5 e 6) |
| Anonimização | N/A — não aplicável enquanto não houver expurgo |
| Alertas | ❌ Sem alertas automáticos (ex. muitas eliminações seguidas, muitas falhas de login) |
| Relatórios de auditoria | ✅ Página `/auditoria`, sem exportação própria (herda a limitação geral de "exportação não auditada", ver 9.1) |

### 9.4 Achados novos desta fase (secção 9)

| ID | Título | Severidade | Prioridade |
|---|---|---|---|
| AUDIT-01 | ~~Login, falhas de login e recuperação de conta não ficam no `audit_log`~~ **Resolvido 2026-07-22** | Média | — |
| AUDIT-02 | ~~Exportação de dados (portabilidade RGPD) não é auditada~~ **Resolvido 2026-07-22** para `exportarMeusDados`; CSV de movimentos continua por auditar (exigiria converter para server action) | Média | P3 (restante) |
| AUDIT-03 | Download de documentos não é auditado | Baixa | P3 |

## Próxima fase

Fase F (secção 10 do prompt): contratos e documentos jurídicos necessários para exploração comercial — `docs/legal/LEGAL_DOCUMENTS_REGISTER.md`, incluindo o DPA (já identificado como urgente na Fase B).
