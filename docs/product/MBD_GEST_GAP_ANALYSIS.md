# Análise comparativa — Documento de Apoio à Assembleia (MBD Gest) vs. GestCondo

Data: 2026-07-23. Fonte: `docs/referencias/Documento Apoio Assembleia - 10 Março 2026.pdf` (16 páginas), documento real produzido pela empresa que atualmente administra o condomínio do utilizador, distribuído aos condóminos como suporte à Assembleia Ordinária de 10-03-2026.

**Objetivo deste documento**: não copiar o PDF nem a marca da empresa — servir de referência às capacidades administrativas, financeiras, contabilísticas e documentais que o GestCondo deve conseguir cobrir. Auditoria apenas: **nenhuma funcionalidade foi implementada, nenhum schema foi alterado, nenhuma migração foi criada nesta sessão.**

---

## 1. Resumo executivo

O módulo financeiro do GestCondo (secção 3 do `FUNCTIONAL_GAPS.md`) já é sólido no que é **recorrente e do dia a dia**: quotas por permilagem com isenção de elevador, dívidas por fração, juros de mora, mapa mensal fração×mês (implementado nesta mesma sessão), conciliação bancária da conta corrente, orçamento vs. real por categoria, seguro, fundo de reserva, recibos, declarações de dívida e interpelações — tudo com isolamento multi-tenant testado, autorização por perfil e soft-delete.

O PDF de referência revela, no entanto, que o **modelo de dados** por trás disto (uma tabela `movimento` genérica, sem "exercício", sem "conta bancária" própria, sem "documento de fornecedor" com ciclo de vida) é suficiente para o que o GestCondo já faz, mas **não** é suficiente para reproduzir tudo o que uma administração profissional entrega hoje: um balanço contabilístico Ativo/Passivo/Situação Líquida, documentos de fornecedor com pagamentos parciais e saldo residual, execução orçamental por rubrica (não só o total anual), e um dossier único de apoio à assembleia.

Nenhuma destas lacunas é surpreendente ou desconhecida por acaso — a maior parte já está identificada, com prioridade e data, no `FUNCTIONAL_GAPS.md` e no `docs/audit/LEGAL_COMPLIANCE_AUDIT.md`. O valor deste documento é (a) confirmar cada uma delas contra o código real, não só contra a documentação, (b) mapear especificamente às páginas do PDF que as evidenciam, e (c) propor um modelo de dados e um plano faseado que não duplique nada do que já existe.

**Nenhuma lacuna aqui identificada é, por si só, um bloqueador para o piloto atual** (é só o utilizador). Passam a ser relevantes no momento em que uma administração profissional real (como a que produziu este PDF) tiver de confiar inteiramente no GestCondo em vez do seu sistema atual (identificado no rodapé do PDF como "Gecond 3 - Improxy").

---

## 2. Inventário das capacidades demonstradas no PDF

| Pág. | Documento | Capacidades demonstradas |
|---|---|---|
| 1 | Capa | Identificação da empresa gestora, ano de referência |
| 2 | Carta de comunicação | Convocatória, antecedência, pedidos de esclarecimento por email antes da assembleia |
| 3 | Resumo financeiro anual | Saldos de caixa/contas bancárias (inicial/período/final) por conta, fundo de reserva acumulado com fórmula, despesas por categoria, receitas por tipo |
| 4-6 | Documentos de fornecedores liquidados | Nº lançamento, nº documento, emissão/vencimento/pagamento, fornecedor, descrição, em dívida/pago/saldo, agrupado por categoria com subtotais |
| 7-8 | Resumo financeiro mensal | Receitas por titular×mês (com totais), despesas por categoria×mês, saldo inicial+recebimentos, saldo caixa+ordem e saldo conta a prazo, mês a mês |
| 9 | Análise orçamental | Orçamentado vs. lançado vs. desvio vs. liquidado vs. por liquidar, por rubrica |
| 10 | Balanço | Ativo (caixa/bancos, por receber), Passivo (adiantamentos, dívidas a fornecedores), Situação Líquida (fundo de reserva, resultados líquidos), com fórmulas explicadas |
| 11 | Documentos de fornecedores por liquidar | Mesma estrutura das págs. 4-6, só os não pagos |
| 12 | Valores em débito | Fração, entidade (com tipo de titular P/I/U/L/A), saldo inicial, previsto, recebido, saldo |
| 13 | Quotas (mapa mensal) | Fração × mês, com total — **já implementado no GestCondo nesta sessão** |
| 14 | Orçamento provisório | Rubricas discriminadas, quotas a cobrar por zona (habitação/loja) separando orçamento e fundo de reserva |
| 15 | Simulação do exercício | Fração × permilagem × (orçamento + FCR), exercício anual e prestação mensal, antes de aprovado |
| 16 | Contracapa | — |

---

## 3. Matriz comparativa

Legenda de estado: ✅ suficiente · 🟡 parcial · 🔶 planeada mas não implementada · ❌ não implementada · N/A não aplicável · 🔎 inferida, não comprovada diretamente no PDF.

| ID | Área | Capacidade | Evidência no PDF | Estado no GestCondo | Código/ficheiro existente | Lacuna real | Risco | Prioridade | Dependências | Recomendação |
|---|---|---|---|---|---|---|---|---|---|---|
| G01 | Exercício | Exercício contabilístico como entidade (saldo inicial/final, fecho, reabertura auditada) | Pág. 3, 7, 10 ("Saldo inicial em 01-01-2025") | ✅ em produção desde 2026-07-24 (Fase A.1) | `exercicioFinanceiro` (`lib/db/schema.ts`), `app/actions/exercicios.ts` — fecho/reabertura auditados, exclusão de sobreposição de datas | Não | Baixo — migração aplicada e verificada sem regressões | — | — | Validar perfis não-Admin em produção |
| G02 | Contas | Conta bancária como entidade (IBAN, banco, tipo à ordem/prazo/caixa, saldo próprio) | Pág. 3 ("BCP ... ORD", "BCP ... PRZ"), pág. 8 (saldo por conta mês a mês) | ✅ em produção desde 2026-07-24 (Fase A.1) | `contaFinanceira` (`lib/db/schema.ts`), `app/actions/contas-financeiras.ts` — IBAN validado/mascarado, associação em massa de movimentos antigos por `destino` | Não | Baixo — a segregação formal por conta existe e está em produção | — | G01 | Validar mascaragem de IBAN por perfil em produção |
| G03 | Fundo de Reserva | % legal mínima (10%, DL 268/94 art. 4º) imposta ou pelo menos sugerida | Pág. 14 (FCR = 10% do orçamento em todas as rubricas) | 🟡 (já listado, `FUNCTIONAL_GAPS.md:31`, P2) | `movimento.destino: 'reserva'`, segregação manual por lançamento | Sim, já confirmada | Legal — obrigação do DL 268/94, hoje depende inteiramente do administrador lançar corretamente | P1 (subir — é uma obrigação legal, não só conveniência) | — | Ao gerar quotas (`gerarQuotasOrcamento`), sugerir automaticamente 10% como valor por omissão do FCR, editável |
| G04 | Receitas | Adiantamentos de condómino como conceito próprio (distinto de "pago") | Pág. 3 ("Pagamentos adiantados", "Adiantamentos recebidos"), pág. 10 (Passivo: "Adiantamento de condóminos") | ❌ | Não encontrado — só `movimento.pago: boolean` | Sim | Baixo — hoje um adiantamento teria de ser lançado como uma quota futura marcada paga antecipadamente, o que funciona mas não é visível como "crédito disponível" | P2 | G01 | Ver secção 7 — pode ser um saldo calculado, não necessariamente nova tabela |
| G05 | Receitas | Quotas extraordinárias distintas, ligadas a uma deliberação de assembleia | Pág. 3 ("Quota Extraordinária Obras", "Quota Extra - Rep. Fachadas") | ❌ (já listado, `FUNCTIONAL_GAPS.md:63`, P1) | `movimento.categoria` é texto livre; `movimento.orcamentoId` liga só ao orçamento anual, não a `assembleia_ponto` | Sim, já confirmada — a mais prioritária de todas as encontradas | Legal/organizacional — hoje não há rasto formal de que uma quota extra foi aprovada em assembleia | **P1** | — | Adicionar `movimento.assembleiaPontoId` opcional (FK `set null`), ver secção 7 |
| G06 | Despesas/Fornecedores | Documento de fornecedor com nº de lançamento + nº de documento distintos, emissão/vencimento/pagamento, valor/pago/saldo, **pagamentos parciais** | Pág. 4-6, 11 | ❌ | `movimento` é uma linha financeira única e binária (`pago: boolean`); `fornecedor` (`schema.ts:166`) é só CRUD da entidade | Sim, confirmada — nenhum documento de fornecedor tem ciclo de vida próprio hoje | Médio-Alto — sem isto não é possível mostrar "documentos por liquidar" nem pagar uma fatura em duas tranches sem lançar dois movimentos artificiais | **P1** | — | Nova entidade `documento_fornecedor` com linhas de `pagamento_documento_fornecedor` (ver secção 7) |
| G07 | Despesas/Fornecedores | Anexos de fatura/recibo/contrato ao documento de fornecedor | Implícito (numeração formal de documentos sugere digitalização) | ❌ | Padrão já existe (`seguro.anexoUrl`, `documento.url`, ambos via Vercel Blob privado) mas não aplicado a despesas | Sim, decorre de G06 | Baixo — reutiliza padrão já maduro (upload privado + `app/api/ficheiros`) | P2 | G06 | Campo `anexoUrl` em `documento_fornecedor`, mesmo padrão de `seguro` |
| G08 | Orçamento | Rubricas discriminadas com orçamentado vs. lançado vs. desvio vs. liquidado vs. por liquidar, **por categoria** | Pág. 9 | 🟡 (já listado, `FUNCTIONAL_GAPS.md:60`, P1→P2) | `getBalancoOrcamento` (`app/actions/orcamentos.ts:148-211`) já calcula `despesasPorCategoria` do **real**, mas o **orçamentado** continua a ser um único `valorAnual` — não há "orçamentei X em Limpeza" | Sim, confirmada — metade da funcionalidade já existe | Médio — relatório de desvio hoje só é fiável ao nível do total, não por rubrica | **P1** | G01 (rubricas fazem mais sentido presas a um exercício) | Nova entidade `orcamento_rubrica` (ver secção 7) — reaproveita `getBalancoOrcamento` como base de cálculo |
| G09 | Relatórios | Balanço contabilístico Ativo/Passivo/Situação Líquida | Pág. 10, com fórmulas | ❌ — **atenção**: `FUNCTIONAL_GAPS.md:61` chama "Balanço" a orçamento-vs-real, um conceito diferente | Nenhum — não encontrado `getBalancoAtivoPassivo` nem equivalente | Sim, e é uma **contradição documental** a corrigir (secção 6) | Médio — é o relatório mais formal do PDF; a sua ausência é a diferença mais visível para quem já viu relatórios de uma administração profissional | P1 | G01, G02, G06 (todos os saldos que compõem o balanço) | Nova view/action `getBalancoPatrimonial`, sem tabela nova — é um cálculo sobre dados já existentes + os de G01/G02/G06 |
| G10 | Frações | Simulação de prestações mensais antes da aprovação do orçamento | Pág. 15 | 🟡 | `calcularQuotasMensais` (`lib/rateio.ts:13-44`) é uma função pura, já reutilizável com um orçamento hipotético — só falta UI/action que a exponha antes de `criarOrcamento` | Não — a lógica já existe, só falta a superfície | Baixo | P2 | — | Nova action `simularQuotasOrcamento(valorAnual, valorElevador)` chamando `calcularQuotasMensais` sem gravar nada |
| G11 | Frações | Zonas distintas (habitação/loja) com rateio próprio | Pág. 14-15 | N/A | O rateio por permilagem individual do GestCondo já é matematicamente equivalente — "zona" no PDF é só agrupamento de apresentação, a soma das permilagens da zona | Não — não é uma lacuna de cálculo | Nenhum | P3 (só apresentação) | — | Se necessário, agrupar visualmente por prefixo/categoria da fração no relatório — não é alteração de schema |
| G12 | Frações | Mapa mensal fração × mês | Pág. 13 | ✅ **Implementado 2026-07-23** | `getMapaMensalQuotas` (`app/actions/financas.ts`), `components/financas/mapa-mensal-tab.tsx` | Não | — | — | Nenhuma — já cobre isto, incluindo exportação CSV e PDF |
| G13 | Dívidas | Conta corrente detalhada por fração (histórico cronológico com saldo corrente) | Pág. 12 (mostra saldo, não o detalhe linha a linha) | 🟡 | `getMapaSaldos` agrega totais; não há página "extrato da fração X" com saldo corrente após cada movimento | Sim | Baixo — os dados existem (`movimento.fracaoId`), falta só a vista | P2 | — | Nova vista `getContaCorrenteFracao(fracaoId)` — sem tabela nova |
| G14 | Dívidas | Tipo de titular (P/I/U/L/A) usado em relatórios de dívida | Pág. 12 | 🟡 | `fracao.tipoTitular` acrescentado 2026-07-23 (`lib/fracoes.ts`), mas ainda não usado em nenhum relatório de dívidas | Sim, mínima | Baixo | P3 | — | Mostrar `tipoTitular` no mapa de saldos e na interpelação |
| G15 | Dívidas | Declarações de dívida, interpelações | Pág. 12 (implícito) | ✅ | `/financas/declaracao-divida/[fracaoId]`, `/financas/interpelacao/[fracaoId]` | Não | — | — | Nenhuma |
| G16 | Assembleias | Convocatória + documentação de suporte + pedidos de esclarecimento antes da data | Pág. 2 | ✅ (convocatória e minuta) / 🔶 (dossier de suporte consolidado — ver G18) | `/assembleias/[id]/convocatoria` (art. 1432º CC) | Parcial — falta o "envio da documentação de suporte" como um pacote único | Baixo | P2 | G18 | Ver G18 |
| G17 | Assembleias | Anexos à ata | — | ❌ (já listado, `FUNCTIONAL_GAPS.md:48`, P2) | Não encontrado | Sim, já confirmada | Baixo | P2 | Upload já maduro (Vercel Blob privado) | Campo `anexoUrl`/lista de anexos em `assembleia` |
| G18 | Assembleias | Dossier automático de apoio à assembleia (capa, comunicação, índice, resumo, mapas, balanço, anexos, PDF único) | Documento inteiro é este dossier | ❌ | Todas as peças existem em separado (relatório, mapa mensal, balanço orçamento, declaração de dívida) mas nunca consolidadas | Sim, confirmada — é a funcionalidade mais visível do PDF como um todo | Médio — tem base legal direta (art. 1432º "documentação de suporte" + art. 1436º/j "prestar contas") | P2 (Fase D, depois das peças financeiras que faltam) | G01, G08, G09 (para o dossier ser completo) | Ver secção 7 e Fase D no plano faseado |
| G19 | Documentos | Exportação XLSX real | (implícito — ficheiros como "Gecond 3 - Improxy" tipicamente exportam Excel) | ❌ (decisão deliberada, `FUNCTIONAL_GAPS.md:72`, P3) | CSV com BOM UTF-8 cobre a generalidade dos casos | Sim, decisão já tomada e documentada | Baixo | P3 | — | Manter decisão — só reconsiderar se um cliente pedir explicitamente `.xlsx` |
| G20 | Técnico | Logging estruturado | — | ❌ | Confirmado — só `console.error` em `lib/audit.ts`, sem lib de logging | Sim (já era dívida técnica conhecida, S18) | Baixo (não é bloqueador funcional) | P3 | — | Fora de âmbito desta análise — já rastreado em `SECURITY_AUDIT.md` S18 |
| G21 | Técnico | Histórico antes/depois de alterações (não só texto livre) | Pág. 9 sugere rastreabilidade de valores orçamentados ao longo do tempo | 🟡 | `audit_log.detalhes` é texto livre opcional; `atualizarMovimento` (introduzido nesta sessão) já regista "de X para Y" em texto | Parcial — funciona para leitura humana, não para diff estruturado/reprocessável | Baixo | P3 | — | Fora de âmbito imediato — considerar só se um relatório precisar de reconstruir um valor histórico exato |
| G22 | Técnico | Testes de autorização HTTP / IDOR entre condomínios ao nível das rotas | — | 🟡 | `lib/db/tenant-isolation.dbtest.ts` testa isolamento ao nível da BD; não há teste HTTP às server actions/rotas | Sim, confirmada | Médio — mitigado pelo padrão consistente `condominioId` + `requireX()` em toda a base de código, mas não verificado automaticamente | P2 | — | Ver matriz de testes, secção 10 |

---

## 4. Funcionalidades já cobertas (não repetir)

Confirmadas diretamente no código nesta auditoria — **não propor reconstruir**:

- Multi-tenancy e isolamento por `condominioId` (testado em `lib/db/tenant-isolation.dbtest.ts`)
- Perfis e permissões (`lib/perfis.ts`, `lib/session.ts`)
- `audit_log` (`lib/audit.ts`)
- Soft-delete em `movimento`, `seguro`, `aviso`, `documento`, `ocorrencia`
- Orçamento anual (`orcamento`) + rateio automático por permilagem (`lib/rateio.ts`) + isenção de elevador
- Quotas mensais geradas automaticamente (`gerarQuotasOrcamento`)
- Mapa mensal fração × mês (implementado nesta sessão)
- Dívidas por fração (`getMapaSaldos`)
- Juros de mora (`lib/juros.ts`)
- Recibos, declarações de dívida, interpelações
- Reconciliação bancária da conta corrente (`lib/extrato.ts`, importação CSV)
- Relatórios imprimíveis em PDF (via `window.print()`, A4)
- Exportação CSV (movimentos e mapa mensal)
- Fornecedores como entidade + despesas associadas
- Seguro obrigatório + fundo de reserva segregado
- Assembleias completas: convocatória, ordem de trabalhos, presenças/procurações, quórum, votação, atas imutáveis
- Documentos com armazenamento privado (Vercel Blob + `app/api/ficheiros`)
- Notificações por email (convocatórias, avisos, ocorrências)
- RGPD (exportação/eliminação de dados pessoais, RAT, minimização por perfil)
- Auditoria (`/auditoria`)
- Autenticação e MFA (better-auth, TOTP)

---

## 5. Lacunas confirmadas (resumo)

Por prioridade — ver detalhe na matriz da secção 3:

**P1**: G05 (quotas extraordinárias ligadas a deliberação), G06 (documento de fornecedor com pagamentos parciais), G08 (execução orçamental por rubrica), G09 (balanço patrimonial Ativo/Passivo).

**P2**: G01 (exercício contabilístico), G02 (conta bancária como entidade), G03 (% legal do FCR), G07 (anexos a documentos de fornecedor), G13 (conta corrente detalhada por fração), G17 (anexos à ata), G18 (dossier automático), G22 (testes de autorização HTTP).

**P3**: G04 (adiantamentos como conceito próprio), G10 (simulação de prestações), G14 (tipo de titular em relatórios), G19 (XLSX), G20/G21 (logging estruturado, diff estruturado — já rastreados noutros documentos).

## Lacunas descartadas (não são lacunas reais)

- **G11 — zonas habitação/loja**: o rateio por permilagem individual já é matematicamente equivalente; é só apresentação agrupada.
- **Arredondamentos**: `lib/rateio.ts` usa a soma real das permilagens (não um total fixo de 1000‰), o que já evita o erro de arredondamento mais comum; sem evidência de problema real neste PDF. Não classificado como gap — sinalizado como 🔎 inferido, a confirmar com um caso de teste dedicado (ver matriz de testes).

---

## 6. Contradições documentais corrigidas

1. **`FUNCTIONAL_GAPS.md:71`** ("Relatórios financeiros 🟡 Parcial... ainda sem relatório por período") nunca foi atualizada depois do mapa mensal (linha 75, 2026-07-23) ter sido acrescentado no mesmo ficheiro — corrigido nesta sessão (secção 11).
2. **Colisão de nomenclatura "Balanço"**: `FUNCTIONAL_GAPS.md:61` chama "Balanço" a orçamento-vs-real; o PDF (pág. 10) usa "Balanço" para Ativo/Passivo/Situação Líquida — são conceitos diferentes. Corrigido com nota explícita (secção 11).
3. **`MVP_PLAN.md:33`** ainda lista exportação PDF/Excel como pendente ("esforço alto, incontornável"), desatualizado desde 2026-07-21. Corrigido (secção 11).
4. **`docs/audit/SYSTEM_DATA_MAP.md`** (bucket Vercel Blob "público") ficou desatualizado dentro do próprio dia 2026-07-22 face a `SECURITY_AUDIT.md`/`FUNCTIONAL_GAPS.md` (store privado). **Corrigido em 2026-07-24**, na passagem de coerência a toda a documentação — a mesma afirmação errada tinha entretanto alastrado a mais cinco documentos, incluindo o `RAT.md` e o `DPA_TEMPLATE.md`, onde constava como pré-requisito por cumprir para assinar o contrato.

---

## 7. Proposta de modelo de dados (apenas para lacunas confirmadas P1)

Sem criar migrações nem alterar o schema real — proposta para validação e implementação numa fase posterior.

**Nota histórica**: esta secção regista a proposta inicial de modelo de dados elaborada em 2026-07-23. A implementação efetiva da Fase A.1 foi ajustada posteriormente com base nas decisões do utilizador e difere em alguns pontos, incluindo a utilização de `designacao` e `ano`, a separação de `saldo_inicial_conta` e a utilização de campos `date` para início e fim do exercício. O modelo implementado deve ser consultado em `lib/db/schema.ts` e na migração `drizzle/0024_slim_human_fly.sql`.

### 7.1 `exercicio_financeiro` (suporta G01, pré-requisito de G08/G09)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `condominioId` | FK `condominio`, `onDelete: cascade` | Isolamento multi-tenant obrigatório |
| `ano` | integer | Único por condomínio (`uniqueIndex`) |
| `dataInicio` / `dataFim` | timestamp | Normalmente 01-01 a 31-12, mas configurável (exercícios não coincidentes com o ano civil existem) |
| `saldoInicialGeral` / `saldoInicialReserva` | numeric(12,2) | Transportado do exercício anterior — nunca calculado automaticamente na primeira vez (o utilizador introduz manualmente ao migrar histórico) |
| `estado` | text | `"aberto"` \| `"fechado"` |
| `fechadoEm` / `fechadoPorUserId` | timestamp / text | Só preenchido ao fechar |
| `createdAt` | timestamp | |

**Integridade**: fechar um exercício é uma ação distinta (`fecharExercicio`), não uma edição — bloqueia novos `movimento.data` dentro do intervalo fechado, salvo reabertura explícita por admin, **registada em `audit_log`** com o motivo (texto obrigatório, não opcional, para uma ação tão sensível). Nunca eliminar exercícios — não aplicável (não há soft-delete de "período", só de lançamentos).

**Migração necessária**: sim, nova tabela; `movimento` passaria a ter `exercicioId` opcional (FK `set null`) para movimentos lançados depois de existir a entidade — os antigos ficam sem ligação, resolvidos por data.

### 7.2 `conta_financeira` (suporta G02)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `condominioId` | FK `condominio` | |
| `nome` | text | Ex: "Conta à Ordem BCP" |
| `iban` | text, opcional | **Dado pessoal/financeiro sensível** — ver secção 9 RGPD |
| `banco` | text, opcional | |
| `tipo` | text | `"ordem"` \| `"prazo"` \| `"caixa"` |
| `saldoInicial` | numeric(12,2) | Por exercício — ou reaproveitar `exercicio_financeiro` para não duplicar o conceito de "inicial" |
| `createdAt` | timestamp | |

`movimento.contaFinanceiraId` (FK `set null`) substituiria gradualmente `movimento.destino` como o campo de segregação — **não remover `destino` já existente**, para não quebrar dados históricos; `contaFinanceiraId` seria adicional e `destino` passaria a ser derivado do tipo de conta associada (`reserva` = contas cujo `tipo` está marcado como fundo de reserva).

### 7.3 `documento_fornecedor` + `pagamento_documento_fornecedor` (suporta G06, G07)

| Campo (`documento_fornecedor`) | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `condominioId` | FK `condominio` | |
| `fornecedorId` | FK `fornecedor`, `set null` | Mesma convenção de `movimento.fornecedorId` |
| `numeroLancamento` | serial ou sequência própria | Interno, gerado pelo GestCondo |
| `numeroDocumento` | text, opcional | O nº da fatura/recibo do fornecedor |
| `categoria` | text | Reaproveita as mesmas categorias já usadas em `movimento.categoria` |
| `dataEmissao` / `dataVencimento` | timestamp | |
| `valor` | numeric(12,2) | |
| `anexoUrl` | text, opcional | Mesmo padrão de `seguro.anexoUrl` |
| `deletedAt` | timestamp | Soft-delete, mesma obrigação legal de retenção de `movimento` |

| Campo (`pagamento_documento_fornecedor`) | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `documentoFornecedorId` | FK `documento_fornecedor`, cascade | |
| `valor` | numeric(12,2) | Uma linha por pagamento parcial |
| `dataPagamento` | timestamp | |
| `movimentoId` | FK `movimento`, opcional | Liga ao lançamento financeiro real que efetivamente saiu da conta — mantém `movimento` como a fonte de verdade do saldo de caixa |

`valorPago` (soma dos pagamentos) e `saldo` (`valor - valorPago`) são **sempre calculados**, nunca guardados — evita divergência entre um campo persistido e a soma real.

### 7.4 `orcamento_rubrica` (suporta G08)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `orcamentoId` | FK `orcamento`, cascade | |
| `categoria` | text | Mesma taxonomia de `movimento.categoria` |
| `valorOrcamentado` | numeric(12,2) | |

`getBalancoOrcamento` já calcula o lançado/liquidado real por categoria — só falta cruzar com `orcamento_rubrica.valorOrcamentado` em vez do único `orcamento.valorAnual`. **Não migra dados existentes automaticamente** — orçamentos antigos sem rubricas continuam a mostrar só o total, sem quebrar.

### 7.5 G05 — quotas extraordinárias (alteração mínima, sem tabela nova)

Adicionar `movimento.assembleiaPontoId` (FK `assembleia_ponto`, `onDelete: set null` — mesma convenção de `orcamentoId`/`fornecedorId`). Não precisa de tabela nova; `criarMovimento` passaria a aceitar opcionalmente este campo quando `categoria` for marcada como quota extraordinária.

### 7.6 G09 — balanço patrimonial (sem tabela nova)

`getBalancoPatrimonial(condominioId, exercicioId)` — função de leitura pura, calculada a partir de `conta_financeira` (saldos), `movimento` (dívidas de condóminos = soma não paga, adiantamentos = pagos antecipadamente) e `documento_fornecedor`/`pagamento_documento_fornecedor` (dívidas a fornecedores = saldo não pago). Depende de G01, G02 e G06 estarem implementados primeiro — é o motivo de ficar na Fase B do plano, não na A.

---

## 8. Matriz de permissões (para as novas funcionalidades propostas)

| Funcionalidade | Consulta | Escrita | Observações |
|---|---|---|---|
| Exercício financeiro (ver saldos) | `PERFIS_ACESSO_FINANCEIRO` (admin, gestor, condómino, auditor) | `PERFIS_GESTAO` (admin, gestor) | Fechar/reabrir exercício: **só admin/gestor**, nunca auditor (mesmo padrão de `podeEscrever`) |
| Conta financeira — saldo/designação/tipo | `PERFIS_ACESSO_FINANCEIRO` (inclui condómino — são totais globais do condomínio, não dados de outra fração) | `PERFIS_GESTAO` | Decisão 2026-07-23: condómino pode ver o saldo agregado por conta (é informação de prestação de contas), mas não o IBAN |
| Conta financeira — IBAN/banco | `PERFIS_CONSULTA_GESTAO` (admin, gestor, auditor) — **nunca** condómino comum | `PERFIS_GESTAO` | Decisão 2026-07-23: IBAN é sempre oculto a condómino, mesmo que veja o saldo da conta — mesmo padrão de minimização de S13. Server action devolve o valor só quando `temConsultaGestao()`, nunca depende só da UI |
| Documento de fornecedor | `PERFIS_CONSULTA_GESTAO` | `PERFIS_GESTAO` | Mesmo padrão de `fornecedor` hoje |
| Rubricas orçamentais | `PERFIS_ACESSO_FINANCEIRO` | `PERFIS_GESTAO` | Mesmo padrão de `orcamento` hoje |
| Quota extraordinária ligada a deliberação | `PERFIS_ACESSO_FINANCEIRO` | `PERFIS_GESTAO` | Sem alteração de padrão — é só um campo adicional em `movimento` |
| Balanço patrimonial | `PERFIS_ACESSO_FINANCEIRO` | N/A (só leitura, calculado) | Mesmo padrão do balanço orçamento-vs-real já existente |
| Dossier de assembleia (gerar) | — | `PERFIS_GESTAO` | Geração é uma ação de escrita (mesmo que produza só um PDF) — regista em `audit_log` |
| Dossier de assembleia (consultar/descarregar) — **versão protegida** | Todos os membros aprovados do condomínio associados à assembleia | — | **Decisão 2026-07-23**: por omissão, o dossier distribuído aos condóminos usa a versão protegida — sem nomes completos associados a dívidas, mapa de saldos identificado por fração (não por titular), totais globais e informação de incumprimento agregada/anonimizada quando relevante |
| Dossier de assembleia (consultar/descarregar) — **versão integral** | `PERFIS_CONSULTA_GESTAO` (admin, gestor, auditor) + outros utilizadores com legitimidade expressa (a definir caso a caso, ex. um condómino membro da comissão fiscalizadora) | — | Versão com identificação nominal completa das dívidas de todas as frações — nunca gerada nem distribuída por omissão |

---

## 9. Impacto RGPD

Aplicável às propostas da secção 7, seguindo o padrão do `GDPR_CHECKLIST.md`:

| Nova funcionalidade | Dados pessoais envolvidos | Base legal previsível | Retenção | Minimização | RAT | DPIA |
|---|---|---|---|---|---|---|
| `conta_financeira.iban` | O IBAN da conta financeira pertence normalmente ao condomínio enquanto entidade titular da conta. Pode, contudo, constituir dado pessoal quando a conta esteja titulada por uma pessoa singular, por exemplo um administrador residente que utilize excecionalmente uma conta pessoal. O acesso deve permanecer sujeito a permissões adequadas e o valor completo não deve ser incluído no `audit_log`. | Execução de obrigação legal de administração (art. 1436º CC) | Enquanto a conta estiver ativa + prazo de prova fiscal (10 anos, a confirmar) | Só visível a quem gere/audita, nunca a condómino comum | Adicionar entrada nova ao RAT — hoje não cobre dados bancários | Não — volume e sensibilidade não justificam DPIA isoladamente |
| `documento_fornecedor` (+ anexos) | NIF/nome de fornecedor (já é pessoa coletiva na generalidade dos casos; risco maior se for um fornecedor em nome individual) | Execução de contrato com o fornecedor | Igual a `movimento` hoje (10 anos, a confirmar) | Mesmo padrão de `fornecedor` já existente | Já coberto pela entrada existente de "fornecedores" no RAT — só atualizar para mencionar documentos/anexos | Não |
| Dossier de assembleia (PDF consolidado) | Potencialmente **todos** os dados financeiros de **todos** os condóminos num único ficheiro (dívidas, quotas, contactos se incluídos) | Dever legal de prestação de contas (art. 1436º/j CC) + convocatória (art. 1432º) | Mesmo prazo do documento mais sensível que contiver | **Crítico** — um dossier mal gerado pode expor a dívida de todos os condóminos a todos os condóminos, o que o próprio PDF de referência já faz (pág. 12 mostra nomes completos e saldos de todas as frações) — replicar isto é aceitável só se for prática de mercado documentada e o RAT/Política de Privacidade já cobrirem "prestação de contas em assembleia" como finalidade explícita | Verificar se o RAT já cobre esta finalidade — **provavelmente não**, é uma finalidade nova | A considerar — depende do volume de dados pessoais consolidados; recomenda-se avaliação dedicada antes de implementar |
| `exercicio_financeiro` | Nenhum dado pessoal direto | N/A | N/A | N/A | Não aplicável | Não |

**Nota importante**: o próprio PDF de referência da empresa gestora **expõe nomes completos e saldos de dívida de todos os condóminos a todos os condóminos** (pág. 7, 12) — é prática de mercado estabelecida para prestação de contas em assembleia, com base no dever legal de transparência do art. 1436º CC. Isto não significa que o GestCondo deva replicar sem análise — deve ser uma decisão explícita e documentada no RAT, não um efeito colateral de "parecer-se com o PDF".

---

## 10. Riscos

| Risco | Área | Gravidade | Mitigação proposta |
|---|---|---|---|
| Modelar `exercicio_financeiro`/`conta_financeira` sem migrar corretamente o histórico existente de `movimento` | G01, G02 | Alto | Migração aditiva apenas (campos opcionais/`set null`), nunca obrigar dados antigos a ter exercício/conta — resolvido por data quando necessário |
| Dossier de assembleia expor dados financeiros pessoais a quem não devia | G18 | Alto | Matriz de permissões (secção 8) + validar com utilizador antes de implementar (pergunta em aberto, secção 13) |
| `documento_fornecedor` duplicar `movimento` e os dois ficarem dessincronizados (saldo do documento vs. soma de movimentos reais) | G06 | Médio | `pagamento_documento_fornecedor.movimentoId` como ponte obrigatória — nunca permitir que o saldo do documento seja editado independentemente dos pagamentos reais |
| Fechar um exercício por engano e bloquear lançamentos legítimos | G01 | Médio | Reabertura sempre possível por admin, com motivo obrigatório em `audit_log` — nunca irreversível |
| `orcamento_rubrica` criar incoerência entre soma das rubricas e `orcamento.valorAnual` | G08 | Baixo | Validação: soma das rubricas não pode exceder `valorAnual` (aviso, não bloqueio — pode haver margem deliberada) |
| Regressão nos relatórios existentes ao introduzir `contaFinanceiraId` como alternativa a `destino` | G02 | Médio | Manter `destino` como fonte de verdade até `conta_financeira` estar validada em produção — não remover num só passo |

---

## 11. Documentação atualizada nesta sessão

Correções pontuais às contradições identificadas na secção 6 — sem marcar nada como concluído sem confirmação no código:

- `FUNCTIONAL_GAPS.md` — nota adicionada à linha do "Balanço" (secção 3) a distinguir claramente de um balanço patrimonial Ativo/Passivo; nota adicionada à linha de "Relatórios financeiros" a referenciar o mapa mensal já implementado; nova linha "Documentos de fornecedores com ciclo completo (pagamentos parciais)" e "Balanço patrimonial (Ativo/Passivo/Situação Líquida)" e "Dossier automático de assembleia" adicionadas com prioridade e referência a este documento.
- `MVP_PLAN.md` — nota a corrigir a referência desatualizada à exportação PDF/Excel como pendente.

`ROADMAP.md`, `TECHNICAL_DEBT.md`, `SECURITY_AUDIT.md`, `GDPR_CHECKLIST.md`, `docs/audit/PRE_CLIENTE_EXTERNO.md` — **não alterados**: nenhuma das lacunas confirmadas nesta auditoria é um bloqueador legal/segurança novo que altere o conteúdo desses ficheiros; todas já estavam corretamente cobertas ou são complementadas pelas notas acima. `docs/audit/SYSTEM_DATA_MAP.md` tem uma referência desatualizada ao bucket Blob (secção 6, item 4) que fica sinalizada para correção numa sessão dedicada a `docs/audit/`, por estar fora do âmbito financeiro desta análise.

---

## 12. Plano faseado

**Atualizado 2026-07-23 com decisões do utilizador (secção 15)** — a Fase A foi dividida em dois incrementos para validar o padrão antes de assumir o desenho todo de uma vez. Ordem de prioridade dentro de P1 confirmada: P1.1 exercícios/contas → P1.2 documentos de fornecedor/pagamentos parciais → P1.3 rubricas orçamentais → P1.4 balanço/relatórios reconciliáveis → P1.5 dossier → P1.6 quotas extraordinárias → P1.7 controlo documental/anexos/confirmação de receção.

### Fase A.1 — Exercícios e contas financeiras (primeiro incremento) — ✅ implementado em desenvolvimento (2026-07-24), produção pendente
**Objetivo**: modelo contabilístico de origem — exercício + conta financeira + saldo inicial + ligação dos movimentos existentes. Sem ciclo de fornecedores nem rubricas ainda.
**Valor para o utilizador**: saldo por conta bancária real (à ordem/a prazo/caixa), separado do "balde" lógico `destino` atual.
**Conteúdo**: `exercicio_financeiro`, `conta_financeira`, `saldo_inicial_conta`, `movimento.exercicioId`/`movimento.contaFinanceiraId` (opcionais) — implementado com FKs compostas `(id, condominioId)` para isolamento multi-tenant ao nível da base de dados, exclusão de sobreposição de datas via `EXCLUDE USING gist`, bloqueio central de escrita em exercícios fechados (`garantirExercicioAberto`, `lib/contas-financeiras.ts`), fecho com resumo/avisos/bloqueios pré-visualizados, transporte de saldo por revisão explícita (nunca silencioso), associação em massa de movimentos antigos com pré-visualização, UI com assistente de primeira configuração.
**Dependências**: nenhuma.
**Alterações de schema**: sim — 3 tabelas novas + 2 FKs opcionais em `movimento` + 1 FK opcional em `extratoBancario`. Migração `drizzle/0024_slim_human_fly.sql`, aplicada em desenvolvimento.
**Risco**: baixo, aditivo.
**Critério de conclusão**: abrir um exercício, registar contas, definir saldos iniciais, associar movimentos, apurar saldo por conta — sem alterar nenhum relatório existente. **Verificado manualmente em desenvolvimento** (ver relatório de sessão) — falta apenas aplicar a migração e validar em produção antes de considerar a fase totalmente concluída.
**Documentação afetada**: `FUNCTIONAL_GAPS.md`, `CLAUDE.md` (convenção de proteção de exercício fechado). `SECURITY_AUDIT.md`, `GDPR_CHECKLIST.md` e `RAT.md` foram revistos e atualizados no commit `79720a3`. A revisão inclui os controlos do IBAN, a distinção entre titularidade do condomínio e eventual pessoa singular, e o estado provisório da retenção.

### Fase A.2 — Documentos de fornecedor e rubricas orçamentais
**Objetivo**: `documento_fornecedor` + `pagamento_documento_fornecedor`, `orcamento_rubrica`.
**Dependências**: Fase A.1 validada em produção.
**Alterações de schema**: sim — as tabelas descritas na secção 7.3 e 7.4.
**Risco**: baixo se A.1 já estiver estável.

### Fase B — Controlo financeiro
**Objetivo**: usar a Fase A para fechar as lacunas P1.
**Valor para o utilizador**: balanço patrimonial real, execução orçamental por rubrica, quotas extraordinárias rastreáveis, documentos de fornecedor com pagamentos parciais visíveis.
**Conteúdo**: G05, G06 (UI), G08 (UI), G09.
**Dependências**: Fase A completa.
**Alterações de schema**: `movimento.assembleiaPontoId` (G05).
**Risco**: médio — balanço patrimonial (G09) é um cálculo novo, precisa de validação cuidadosa contra o exemplo do PDF (os totais devem bater certo).
**Testes**: teste de integração que reproduz os números do balanço da pág. 10 do PDF com dados fictícios equivalentes.
**Critério de conclusão**: balanço patrimonial gerado a partir de dados reais bate certo com uma verificação manual independente.
**Documentação afetada**: `FUNCTIONAL_GAPS.md`.

### Fase C — Relatórios
**Objetivo**: expor tudo o que a Fase B tornou possível.
**Valor para o utilizador**: mapas financeiros completos, documentos liquidados/por liquidar, saldos por conta, exportações.
**Conteúdo**: G02 (relatório por conta), G07 (anexos), G13 (conta corrente por fração), simulação de prestações (G10).
**Dependências**: Fases A e B.
**Alterações de schema**: nenhuma nova.
**Risco**: baixo.
**Testes**: consistência entre o que aparece no ecrã e o que sai na exportação/impressão.
**Critério de conclusão**: um administrador consegue reproduzir cada relatório do PDF de referência (exceto o dossier consolidado) a partir do GestCondo.
**Documentação afetada**: `FUNCTIONAL_GAPS.md`.

### Fase D — Dossier da assembleia
**Objetivo**: consolidar tudo num único PDF.
**Valor para o utilizador**: o "documento de apoio à assembleia" completo, gerado automaticamente.
**Conteúdo**: G18, G17 (anexos à ata).
**Dependências**: Fases A-C (o dossier só é útil quando as peças que o compõem já existem).
**Alterações de schema**: possivelmente uma tabela `dossier_assembleia` para guardar a versão gerada (estado rascunho/final) — a confirmar em desenho detalhado nessa fase.
**Risco**: alto do ponto de vista RGPD (secção 9) — **requer decisão explícita do utilizador antes de desenhar** (secção 13).
**Testes**: geração reproduzível byte a byte a partir dos mesmos dados; verificação de minimização por perfil do destinatário.
**Critério de conclusão**: dossier pré-visualizável, exportável em PDF, com paginação e identificação do condomínio/exercício.
**Documentação afetada**: `RAT.md`, `GDPR_CHECKLIST.md`, possivelmente `docs/legal/PRIVACY_POLICY_REVIEW.md`.

### Fase E — Funcionalidades de maturidade
**Objetivo**: itens já conhecidos, não específicos deste PDF, mas relacionados.
**Conteúdo**: histórico de titularidade, representantes legais, versionamento documental, confirmação de leitura, empresa de administração multi-condomínio, XLSX real (se justificado).
**Dependências**: nenhuma das anteriores diretamente — podem correr em paralelo.
**Risco**: baixo, já rastreados individualmente no `FUNCTIONAL_GAPS.md`.
**Documentação afetada**: `FUNCTIONAL_GAPS.md` (já cobre a maioria).

---

## 13. Critérios de aceitação (por fase, resumido)

- **Fase A.1 — critérios técnicos antes de produção**: a migração deve aplicar sem erros no ambiente autorizado, `db:check-drift` deve ser executado antes e depois da promoção, os totais financeiros devem permanecer coerentes e nenhum relatório pré-existente pode apresentar alteração indevida de valores. Estes critérios ainda não foram executados em produção.
- **Fase B**: balanço patrimonial gerado com dados de teste reproduz exatamente os totais da pág. 10 do PDF (78.780,18 € de ativo/passivo, com os mesmos dados de entrada); execução orçamental por rubrica mostra desvio correto por categoria.
- **Fase C**: um utilizador consegue, sem intervenção técnica, obter o mesmo conjunto de números que estão nas págs. 3-9 e 11-15 do PDF, a partir da interface do GestCondo.
- **Fase D**: dossier gerado em menos de X segundos (a definir), PDF válido, sem dados pessoais de outros condóminos visíveis a um destinatário sem `temConsultaGestao()`.

---

## 14. Matriz de testes (lacunas confirmadas)

| Área | Unitário | Integração PostgreSQL real | Casos limite |
|---|---|---|---|
| `exercicio_financeiro` (fecho/reabertura) | Cálculo de saldo transportado | Fechar exercício bloqueia `criarMovimento` com data dentro do período; reabrir remove o bloqueio e regista em `audit_log` | Fechar um exercício sem nenhum movimento lançado; reabrir um exercício já com o seguinte também fechado (deve avisar ou bloquear) |
| `conta_financeira` | — | Isolamento multi-tenant (uma conta não pode ser lida/editada por outro condomínio) | IBAN inválido (formato) rejeitado ou aceite como texto livre — decisão a validar |
| `documento_fornecedor` + pagamentos parciais | Cálculo de `saldo = valor - soma(pagamentos)` | Dois pagamentos parciais que somam exatamente o valor marcam o documento como liquidado; um pagamento a mais é rejeitado ou aceite como crédito (decisão a validar) | Pagamento de 0,00 €; pagamento com data anterior à emissão do documento |
| `orcamento_rubrica` | Soma das rubricas vs. `valorAnual` | Execução orçamental por rubrica bate certo com `getBalancoOrcamento` existente para o mesmo condomínio/ano | Rubrica sem nenhuma despesa lançada (desvio = 100% a favor) |
| G05 — quota extraordinária | — | Ligar uma quota a uma deliberação de assembleia já aprovada; eliminar a deliberação não elimina a quota (`set null`) | Quota ligada a um ponto que ainda não foi votado |
| G09 — balanço patrimonial | Fórmula Ativo = Passivo + Situação Líquida sempre verdadeira por construção | Reproduzir os números da pág. 10 do PDF com dados de teste equivalentes | Condomínio sem nenhuma dívida nem adiantamento (balanço "vazio" ainda assim coerente) |
| Rateio/arredondamentos (confirmar, não é gap novo) | Soma das quotas mensais geradas = orçamento anual exato, mesmo com permilagens que não dividem exatamente | — | Condomínio com permilagem total ≠ 1000‰ (já tratado, confirmar teste explícito) |
| G22 — autorização HTTP/IDOR | — | Pedido HTTP direto a uma server action financeira com sessão de outro condomínio devolve erro, não dados | Perfil `inquilino`/`fornecedor` a tentar aceder a rotas financeiras diretamente pelo URL |
| Dossier de assembleia (Fase D) | Geração determinística (mesmos dados → mesmo PDF, byte a byte ou hash) | Minimização por perfil do destinatário — gerar para admin vs. para um perfil hipotético sem `temConsultaGestao()` e confirmar diferença de conteúdo | Assembleia sem nenhuma dívida por reportar; condomínio com uma só fração |

---

## 15. Decisões do utilizador (registadas 2026-07-23)

1. **Dossier de assembleia (G18)** — **Modelo restritivo por omissão**. Cada condómino só consulta a dívida/movimentos da própria fração, totais globais do condomínio quando necessários para prestação de contas, e informação de incumprimento agregada/anonimizada. Identificação nominal de dívidas de todas as frações fica limitada a admin/gestor/auditor/legitimidade expressa. Dossiers distribuídos genericamente não mostram nomes associados a dívidas — quando houver fundamento para mapa por fração, usar a identificação da fração. O sistema deve suportar versão integral (administração) e versão protegida (condóminos) — refletido na matriz de permissões (secção 8).
2. **IBAN/contas bancárias (G02)** — Modelo assume que as contas pertencem ao **condomínio** (não a administradores residentes), com banco, IBAN, designação, tipo, moeda, estado, saldo inicial, data de abertura/encerramento. Pode existir um tipo `"transitoria"` excecional para situações irregulares anteriores, claramente identificado e auditado, nunca tratado como prática normal. **A confirmar antes de introduzir dados reais**: qual é de facto a titularidade das contas do condomínio em análise (documentos bancários ou junto da administração) — não assumir.
3. **Retenção de dados financeiros** — 10 anos como prazo técnico **provisório**, coerente com a regra fiscal portuguesa de conservação de livros/registos/documentos de suporte, mas por validar formalmente por contabilista/jurista para o contexto específico de condomínios. Até validação: manter soft-delete, preservar integridade/auditabilidade, impedir expurgo automático, classificar atas e deliberações aprovadas como conservação permanente, documentar o prazo como "provisório e por validar" em qualquer novo campo/documento que o referencie.
4. **Ordem de prioridade dentro de P1** — confirmada: P1.1 exercícios/contas financeiras → P1.2 documentos de fornecedor/pagamentos parciais → P1.3 rubricas orçamentais/execução → P1.4 saldos/balanço/relatórios reconciliáveis → P1.5 dossier de assembleia → P1.6 quotas extraordinárias → P1.7 controlo documental/anexos/confirmação de receção. Prioridade máxima: o modelo contabilístico de origem — não avançar para relatórios antes dos dados estarem estruturados.
5. **Âmbito do primeiro incremento** — não isolar `exercicio_financeiro` sozinho. Primeiro incremento coerente: `exercicio_financeiro` + `conta_financeira` + `saldo_inicial_conta` + ligação de `movimento` existente a exercício/conta. Sem ciclo de fornecedores nem pagamentos parciais nesta fase — só depois de este padrão validado (multi-tenancy, permissões, auditoria, migração, cálculos) é que a Fase A.2 avança para documentos de fornecedor e rubricas orçamentais.

A proposta técnica detalhada do primeiro incremento foi apresentada, autorizada e implementada em desenvolvimento em 2026-07-23/24. O estado atual encontra-se descrito na secção 12: implementação concluída em desenvolvimento e promoção para produção ainda pendente.
