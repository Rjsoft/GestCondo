# Auditoria Funcional — GestCondo

Data: 2026-07-06. Legenda: ✅ Implementado · 🟡 Parcial/básico · ❌ Em falta. Prioridade pensada para o objetivo declarado (produto profissional multi-condomínio para o mercado português): **P0** bloqueador estrutural, **P1** necessário para MVP utilizável, **P2** necessário para venda comercial, **P3** diferenciador/avançado.

## Visão geral honesta

O que existe hoje cobre uma fatia pequena e bem construída de **gestão administrativa básica de um único condomínio**: finanças simples, avisos, ocorrências, frações, condóminos com fluxo de aprovação. **Não existe nenhuma noção de "condomínio" como entidade** (ver `SECURITY_AUDIT.md` S9) — logo tudo abaixo assume, implicitamente, que isto teria de ser reconstruído sobre uma base multi-tenant antes de ser vendável a mais do que um condomínio.

Módulos inteiros pedidos como essenciais para o mercado português — **Assembleias** e **gestão financeira formal** (orçamentos, dívidas por fração, recibos) — estão **completamente ausentes** (0%), não parcialmente feitos.

---

## 1. Gestão do condomínio

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Condomínios/edifícios (entidade própria) | 🟡 Parcial — schema resolvido 2026-07-06 | Tabela `condominio` (nome, morada, NIF) existe e todas as tabelas de dados têm `condominioId` com isolamento aplicado em todas as queries (ver `SECURITY_AUDIT.md` S9). Falta o fluxo de produto: criar um segundo condomínio, convidar/associar utilizadores a um condomínio específico, e um ecrã de definições do condomínio (hoje o nome fica fixo em "Condomínio" desde o bootstrap, sem forma de o editar pela UI). | **P0 → P1** (bloqueador estrutural resolvido; falta o fluxo de onboarding) |
| Frações autónomas | 🟡 Parcial | `app/(app)/fracoes/page.tsx` + schema `fracao`: identificação, proprietário (texto livre), permilagem, contactos, notas. Sem condomínio associado. | P1 (completar) |
| Permilagens | 🟡 Parcial | Campo `permilagem` existe e soma-se no dashboard, mas não há validação de que a soma das permilagens de um condomínio é 1000‰ (ou 100%), o que é a base de qualquer cálculo de quotas/votos corretos. | P1 |
| Proprietários | 🟡 Parcial | `fracao.proprietario` é texto livre, não uma entidade/pessoa relacional. Não suporta compropriedade (vários proprietários na mesma fração) nem NIF. | P1 |
| Inquilinos | ❌ Em falta | Não existe qualquer distinção entre proprietário e inquilino no modelo. `membro` só tem `perfil: admin\|condomino`. | P1 |
| Contactos de emergência | ❌ Em falta | Sem campo/estrutura dedicada. | P2 |
| Representantes legais | ❌ Em falta | Sem suporte a procurador/representante de um proprietário (pessoa coletiva, herança indivisa, etc. — muito comum em condomínios PT). | P2 |
| Histórico de titularidade | ❌ Em falta | Alterar `fracao.proprietario` sobrescreve o valor anterior sem histórico — perde-se o registo de quem era o proprietário antes de uma venda, relevante para apurar responsabilidade por dívidas. | P2 |
| Documentos do prédio | 🟡 Parcial | `app/(app)/documentos/page.tsx` guarda título/categoria/link, mas sem upload real (ver secção Documentos abaixo). | P1 |
| Regulamento do condomínio | ❌ Em falta | Poderia viver como uma categoria de documento, mas não há nenhum tratamento especial (ex. necessidade de aceitação/leitura por condómino). | P2 |
| Seguro obrigatório | ❌ Em falta | Sem modelo de dados para apólice, seguradora, cobertura, validade — obrigação legal do condomínio em Portugal (seguro contra incêndio, art. 1429º CC) sem qualquer suporte, nem sequer como documento com data de validade e alerta de renovação. | **P1** |
| Fundo comum de reserva | ❌ Em falta | Obrigatório por lei (DL nº 268/94, com a % mínima de quota destinada ao fundo). Hoje é apenas um número implícito na diferença receitas−despesas do dashboard, sem conta própria nem obrigatoriedade de segregação. | **P1** |

## 2. Assembleias — 0% implementado

Nenhum dos seguintes itens existe, em nenhuma forma, no código atual:

| Funcionalidade | Estado | Prioridade |
|---|---|---|
| Convocatórias | ❌ | P1 |
| Ordem de trabalhos | ❌ | P1 |
| Registo de presenças | ❌ | P1 |
| Representações/procurações | ❌ | P1 |
| Cálculo de quórum (por permilagem, 1ª/2ª convocatória) | ❌ | P1 |
| Votação por permilagem | ❌ | P1 |
| Deliberações | ❌ | P1 |
| Atas | ❌ | **P1** |
| Anexos à ata | ❌ | P2 |
| Histórico de assembleias | ❌ | P1 |
| Videoconferência (quando legalmente admissível) | ❌ | P3 |
| Notificação por email de convocatórias | ❌ (não há envio de email na aplicação) | **P1** |
| Registo de receção/leitura/confirmação de convocatória | ❌ | P2 — juridicamente relevante para provar convocação regular |

Este é o módulo funcionalmente mais crítico para o mercado português (as assembleias e as suas atas são o instrumento legal central da vida do condomínio, Código Civil arts. 1430º–1438º-A) e o que está mais distante de existir. Não há atalhos aqui: é um módulo novo de raiz, com implicações de integridade de dados fortes (uma ata aprovada não pode ser silenciosamente editável — ver auditoria abaixo).

## 3. Gestão financeira

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Orçamento anual | ❌ Em falta | Só existem lançamentos ad-hoc (`movimento`), sem conceito de orçamento previsto vs. executado. | **P1** |
| Quotas ordinárias | 🟡 Parcial | Um `movimento` do tipo `receita` genérico, sem gerar automaticamente uma quota por fração/mês a partir da permilagem. | P1 |
| Quotas extraordinárias | ❌ Em falta | Sem distinção de ordinária/extraordinária nem ligação a uma deliberação de assembleia que a aprove. | P1 |
| Despesas comuns | 🟡 Parcial | `movimento` tipo `despesa`, categoria livre, sem rateio automático por permilagem. | P1 |
| Fundo comum de reserva | ❌ Em falta | Ver secção 1. | **P1** |
| Dívidas por condómino/fração | ❌ Em falta | Não há nenhum "livro-razão" por fração — só o agregado receitas/despesas do condomínio inteiro. Não é possível hoje responder "quanto deve o 2ºEsq?". | **P1** |
| Juros/penalizações por atraso | ❌ Em falta | Sem suporte, e a taxa/possibilidade depende do regulamento do condomínio — teria de ser configurável. | P2 |
| Recibos | ❌ Em falta | Sem geração de recibo por pagamento. | P1 |
| Pagamentos | 🟡 Parcial | Só um booleano `pago` no movimento, sem registo de meio de pagamento, referência multibanco, data de liquidação distinta da data do lançamento. | P1 |
| Reconciliação bancária | ❌ Em falta | Sem importação de extrato bancário nem qualquer conciliação. | P2 |
| Relatórios financeiros | ❌ Em falta | Só 3 cartões (receitas/despesas/saldo) na página de finanças — sem relatório por período, por categoria, por fração. | P1 |
| Exportação Excel/PDF | ❌ Em falta | Nenhuma exportação em nenhuma página. | **P1** (frequentemente exigido por lei/assembleia para prestação de contas) |
| Declarações de dívida | ❌ Em falta | Documento formal exigido em compra/venda de fração (para saber se há dívidas de quotas). | P2 |
| Mapas de saldos | ❌ Em falta | Ver dívidas por fração. | P1 |

## 4. Ocorrências e manutenção

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Comunicação de avarias | ✅ Implementado | `app/(app)/ocorrencias/page.tsx` + `app/actions/ocorrencias.ts`. | — |
| Pedidos de intervenção | ✅ Implementado | Mesma funcionalidade acima cobre este caso de uso. | — |
| Fotos/anexos | ❌ Em falta | Sem upload de ficheiros em lado nenhum da aplicação. | **P1** |
| Estado da ocorrência | ✅ Implementado | `aberta \| em_curso \| resolvida`, com validação de enum. | — |
| Prioridade | ✅ Implementado | `normal \| importante \| urgente`. | — |
| Fornecedores | ❌ Em falta | Sem entidade "fornecedor" nem associação a uma ocorrência. | P2 |
| Orçamentos (de obra) | ❌ Em falta | Sem suporte a anexar/comparar orçamentos de fornecedores para uma intervenção. | P2 |
| Aprovação de despesas | ❌ Em falta | Sem fluxo de aprovação (ex. despesas acima de X requerem aprovação em assembleia — Código Civil distingue despesas de conservação corrente das que exigem deliberação). | P2 |
| Histórico de intervenções | 🟡 Parcial | Existe `updatedAt` na ocorrência, mas sem histórico de estados (não se sabe quando passou de "aberta" a "em curso"). | P2 |
| Obras urgentes | ❌ Em falta | Sem distinção/fluxo próprio (juridicamente relevante — o administrador pode decidir obras urgentes sem esperar por assembleia, art. 1427º CC). | P2 |
| Obras aprovadas em assembleia | ❌ Em falta | Depende do módulo de Assembleias (secção 2). | P2 |

## 5. Comunicação

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Avisos aos condóminos | ✅ Implementado | `app/(app)/avisos/page.tsx`, com prioridade. | — |
| Notificações (push/email) | ❌ Em falta | Não existe nenhum envio de email configurado em toda a aplicação (nem para reset de password, nem para avisos). | **P1** |
| Mensagens internas (condómino ↔ admin) | ❌ Em falta | Sem qualquer canal de mensagem direta/privada. | P2 |
| Histórico de comunicações | 🟡 Parcial | Avisos ficam listados indefinidamente, mas não há registo de "quem viu o quê". | P2 |
| Confirmação de leitura | ❌ Em falta | Nem em avisos nem (mais crítico) em convocatórias de assembleia. | P1/P2 conforme uso |
| Regras contra exposição de emails entre condóminos | ❌ Em falta | Ver `SECURITY_AUDIT.md` S13 — hoje é o oposto: os contactos são visíveis a todos. | **P1** |

## 6. Documentos

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Upload seguro | ❌ Em falta | `documento.url` é só um link externo de texto; não há armazenamento próprio, nem validação de tipo/tamanho de ficheiro, nem scanning. | **P1** |
| Classificação por tipo | ✅ Implementado | `ata \| regulamento \| orcamento \| outro`. | — |
| Controlo de permissões por documento | ❌ Em falta | Hoje é tudo-ou-nada (qualquer aprovado vê tudo). Não há documentos privados/confidenciais (ex. um orçamento de fornecedor em negociação). | P2 |
| Versionamento | ❌ Em falta | Substituir um documento perde a versão anterior. | P2 |
| Atas / Faturas / Recibos / Contratos / Apólices / Orçamentos / Relatórios | 🟡 Só como categoria de texto | Sem tratamento diferenciado nem campos próprios (ex. uma fatura devia ter fornecedor, valor, NIF). | P2 |
| Exportação e arquivo | ❌ Em falta | — | P2 |

## 7. Auditoria (funcionalidade de produto, distinta da auditoria de segurança)

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Registo de ações importantes | ❌ Em falta | Ver `SECURITY_AUDIT.md` S17. | **P0/P1** |
| Quem criou/alterou/apagou dados | ❌ Em falta | Idem. | **P0/P1** |
| Histórico de alterações | ❌ Em falta | Idem. | P1 |
| Logs consultáveis por admin autorizado | ❌ Em falta | Depende do log de auditoria existir primeiro. | P1 |
| Proteção contra alteração indevida de atas/documentos/deliberações | ❌ Em falta | Não há atas ainda, mas o princípio (imutabilidade após aprovação) tem de ser desenhado desde o início do módulo de Assembleias, não acrescentado depois. | P1 (quando Assembleias for construído) |

## 8. Perfis de utilizador pedidos vs. existentes

| Perfil pedido | Existe? |
|---|---|
| Super Admin (operador da plataforma) | ❌ |
| Empresa de administração (gere vários condomínios) | ❌ |
| Administrador do condomínio | ✅ (`perfil: admin`, mas sem âmbito de condomínio — hoje é "admin de tudo") |
| Condómino proprietário | 🟡 (`perfil: condomino`, sem distinção de proprietário) |
| Inquilino | ❌ |
| Fornecedor externo | ❌ |
| Auditor/consulta (leitura apenas) | ❌ |

## 9. Resumo de prioridades P0/P1 (o que bloqueia mesmo o MVP)

1. ~~**P0** — Entidade `condominio` + isolamento multi-tenant~~ **Resolvido 2026-07-06** (schema e queries); falta o fluxo de onboarding/convite para um segundo condomínio.
2. **P0/P1** — Log de auditoria mínimo + soft-delete em dados financeiros.
3. **P1** — Módulo de Assembleias (convocatória → ordem de trabalhos → presenças/procurações → quórum → votação → ata).
4. **P1** — Gestão financeira formal: orçamento, dívida por fração, recibos, exportação PDF/Excel.
5. **P1** — Upload de ficheiros (documentos, faturas, fotos de ocorrências) com controlo de acesso.
6. **P1** — Envio de email (mínimo: reset de password, convocatórias, avisos importantes).
7. **P1** — Distinção proprietário/inquilino e correção da exposição de contactos.
8. **P1** — Seguro obrigatório e fundo de reserva como entidades próprias, não texto livre/implícito.

Tudo o que está classificado P2/P3 é razoável adiar para depois de um MVP fechado, mas **nenhum item P1 pode ficar de fora de uma versão vendável a uma administração de condomínios real em Portugal** — a ausência de Assembleias/Atas, em particular, torna a aplicação inadequada ao seu propósito declarado, por mais polida que a parte de finanças/avisos já esteja.
