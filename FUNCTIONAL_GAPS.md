# Auditoria Funcional — GestCondo

Data: 2026-07-06. Legenda: ✅ Implementado · 🟡 Parcial/básico · ❌ Em falta. Prioridade pensada para o objetivo declarado (produto profissional multi-condomínio para o mercado português): **P0** bloqueador estrutural, **P1** necessário para MVP utilizável, **P2** necessário para venda comercial, **P3** diferenciador/avançado.

## Visão geral honesta

O que existe hoje cobre uma fatia pequena e bem construída de **gestão administrativa básica de um único condomínio**: finanças simples, avisos, ocorrências, frações, condóminos com fluxo de aprovação. **Não existe nenhuma noção de "condomínio" como entidade** (ver `SECURITY_AUDIT.md` S9) — logo tudo abaixo assume, implicitamente, que isto teria de ser reconstruído sobre uma base multi-tenant antes de ser vendável a mais do que um condomínio.

Módulo inteiro pedido como essencial para o mercado português — **Assembleias** — está **completamente ausente** (0%). **Gestão financeira formal** (orçamentos, dívidas por fração, recibos, exportação) ganhou uma primeira versão em 2026-07-07 — ver secção 3 — mas ainda falta geração automática de quotas, rateio por permilagem, juros/reconciliação bancária e exportação em formato `.xlsx`/PDF real.

---

## 1. Gestão do condomínio

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Condomínios/edifícios (entidade própria) | 🟡 Parcial — schema resolvido 2026-07-06 | Tabela `condominio` (nome, morada, NIF) existe e todas as tabelas de dados têm `condominioId` com isolamento aplicado em todas as queries (ver `SECURITY_AUDIT.md` S9). Falta o fluxo de produto: criar um segundo condomínio, convidar/associar utilizadores a um condomínio específico, e um ecrã de definições do condomínio (hoje o nome fica fixo em "Condomínio" desde o bootstrap, sem forma de o editar pela UI). | **P0 → P1** (bloqueador estrutural resolvido; falta o fluxo de onboarding) |
| Frações autónomas | 🟡 Parcial | `app/(app)/fracoes/page.tsx` + schema `fracao`: identificação, proprietário (texto livre), permilagem, contactos, notas. Sem condomínio associado. | P1 (completar) |
| Permilagens | 🟡 Parcial | Campo `permilagem` existe e soma-se no dashboard, mas não há validação de que a soma das permilagens de um condomínio é 1000‰ (ou 100%), o que é a base de qualquer cálculo de quotas/votos corretos. | P1 |
| Proprietários | 🟡 Parcial | `fracao.proprietario` continua texto livre (registo legal de propriedade, válido mesmo antes de o proprietário ter conta na app). **Desde 2026-07-07**, um `membro` com `perfil: condomino` pode ligar-se de facto a essa fração via `membro.fracaoId` — a app já distingue "quem é o proprietário registado" (texto) de "que conta de utilizador está ligada a esta fração como proprietário" (relação real). Não suporta compropriedade (vários `membro` condomino na mesma fração é tecnicamente possível, mas sem UI pensada para isso) nem NIF. | P1 → P2 |
| Inquilinos | 🟡 Parcial — implementado 2026-07-07 | `perfil: inquilino` (desde o redesenho de papéis) agora pode ligar-se a uma fração via `membro.fracaoId`, tal como um condómino — um proprietário e o seu inquilino podem ter contas em simultâneo, ambas ligadas à mesma fração, cada uma com o seu nível de acesso (inquilino não vê finanças/frações, ver `SECURITY_AUDIT.md` S8). Editável em `/condominos` (`EditarMembroDialog`, agora com um seletor de fração em vez de texto livre). | P1 → P2 |
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
| Orçamento anual | 🟡 Parcial — implementado 2026-07-07 | Nova tabela `orcamento` (ano, valor anual, notas), um por condomínio/ano, gerida em `/financas` (separador "Orçamentos"). **Falta ainda**: rubricas discriminadas (só um valor global), orçamento previsto vs. executado, e geração automática de quotas mensais a partir dele. | P1 → P2 |
| Quotas ordinárias | 🟡 Parcial | Um `movimento` do tipo `receita`, agora **obrigatoriamente ligado a uma fração** (`criarMovimento` valida isto — ver `app/actions/financas.ts`), mas sem gerar automaticamente uma quota por fração/mês a partir da permilagem/orçamento — continua a ser lançamento manual um a um. | P1 |
| Quotas extraordinárias | ❌ Em falta | Sem distinção de ordinária/extraordinária nem ligação a uma deliberação de assembleia que a aprove. | P1 |
| Despesas comuns | 🟡 Parcial | `movimento` tipo `despesa`, categoria livre, sem rateio automático por permilagem. | P1 |
| Fundo comum de reserva | ❌ Em falta | Ver secção 1. | **P1** |
| Dívidas por condómino/fração | ✅ Implementado 2026-07-07 | Separador "Dívidas por fração" em `/financas` (`getMapaSaldos()`): para cada fração, quotas lançadas − quotas pagas = dívida. Responde diretamente a "quanto deve o 2ºEsq?". Verificado com um teste de integração real (`lib/db/mapa-saldos.dbtest.ts`) contra o tipo `numeric` do Postgres. | — |
| Juros/penalizações por atraso | ❌ Em falta | Sem suporte, e a taxa/possibilidade depende do regulamento do condomínio — teria de ser configurável. | P2 |
| Recibos | ✅ Implementado 2026-07-07 | Página `/financas/recibo/[id]` (só para movimentos tipo receita) com identificação do condomínio/fração/proprietário/valor e botão "Imprimir / guardar em PDF" (via impressão do browser — sem biblioteca de PDF nova). Acessível a partir do menu de ações de cada movimento. | — |
| Pagamentos | 🟡 Parcial | Só um booleano `pago` no movimento, sem registo de meio de pagamento, referência multibanco, data de liquidação distinta da data do lançamento. | P1 |
| Reconciliação bancária | ❌ Em falta | Sem importação de extrato bancário nem qualquer conciliação. | P2 |
| Relatórios financeiros | 🟡 Parcial | 3 cartões (receitas/despesas/saldo) mais o mapa de saldos por fração — ainda sem relatório por período/categoria. | P1 |
| Exportação Excel/PDF | 🟡 Parcial — implementado 2026-07-07 | Botão "Exportar CSV" na lista de movimentos (abre corretamente no Excel, com BOM UTF-8 para acentos/€). **Não é um `.xlsx` real nem PDF** — decisão deliberada para não introduzir uma dependência nova sem poder testá-la visualmente nesta sessão; CSV cobre a necessidade de prestação de contas com risco mínimo. | P2 (evoluir para `.xlsx`/PDF se necessário) |
| Declarações de dívida | ❌ Em falta | Documento formal exigido em compra/venda de fração (para saber se há dívidas de quotas). | P2 |
| Mapas de saldos | ✅ Implementado 2026-07-07 | Ver dívidas por fração, acima — é a mesma funcionalidade. | — |

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
| Notificações (push/email) | 🟡 Parcial — infraestrutura de email pronta desde 2026-07-06 (`lib/email.ts`, ver `SECURITY_AUDIT.md` S1/S2), usada hoje só para verificação de conta e reset de password. Ainda não envia email quando um aviso importante é publicado ou uma ocorrência é atualizada. | P1 |
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
| Registo de ações importantes | ✅ Implementado 2026-07-06 | `audit_log` (ver `SECURITY_AUDIT.md` S17). | — |
| Quem criou/alterou/apagou dados | ✅ Implementado 2026-07-06 | Idem — ator, ação, entidade, timestamp. | — |
| Histórico de alterações | 🟡 Parcial | O `audit_log` regista *que* algo foi alterado e por quem, mas não um diff antes/depois do conteúdo (só um resumo em texto livre opcional). | P2 |
| Logs consultáveis por admin autorizado | ✅ Implementado 2026-07-06 | Página `/auditoria`, acessível a admin/gestor/auditor. | — |
| Proteção contra alteração indevida de atas/documentos/deliberações | ❌ Em falta | Não há atas ainda, mas o princípio (imutabilidade após aprovação) tem de ser desenhado desde o início do módulo de Assembleias, não acrescentado depois. | P1 (quando Assembleias for construído) |

## 8. Perfis de utilizador pedidos vs. existentes

**Atualizado 2026-07-06:** os 7 perfis foram modelados (`lib/perfis.ts`) e ligados às permissões reais em todas as server actions e páginas.

| Perfil pedido | Existe? |
|---|---|
| Super Admin (operador da plataforma) | 🟡 Flag `user.superAdmin` existe e dá poderes de gestão/consulta em qualquer condomínio a que a pessoa também pertença como `membro`. Falta o fluxo de produto (painel cross-condomínio, onboarding de novos condomínios) — ver Fase 5 do `ROADMAP.md`. |
| Empresa de administração (gere vários condomínios) | 🟡 `perfil: 'gestor'` tem exatamente os mesmos poderes que `admin` dentro de um condomínio, e a mesma pessoa/empresa pode ter uma linha `membro` com `perfil: 'gestor'` em vários condomínios em simultâneo (o schema já suporta isto). Falta o fluxo de onboarding para associar uma empresa a um novo condomínio — hoje só existe um condomínio por instalação (ver `SECURITY_AUDIT.md` S9). |
| Administrador do condomínio | ✅ `perfil: 'admin'`, com âmbito por condomínio (`membro.condominioId`). |
| Condómino proprietário | ✅ `perfil: 'condomino'` — vê dados financeiros/patrimoniais (`PERFIS_ACESSO_FINANCEIRO`). |
| Inquilino | ✅ `perfil: 'inquilino'` — vê avisos/documentos/ocorrências, mas **não** finanças nem frações (nem no dashboard nem nas páginas dedicadas, que devolvem 404 se acedidas diretamente). |
| Fornecedor externo | 🟡 `perfil: 'fornecedor'` existe com o mesmo acesso mínimo que inquilino. Falta o fluxo de atribuição de ocorrências/orçamentos a um fornecedor específico (P2, ver secção 4). |
| Auditor/consulta (leitura apenas) | ✅ `perfil: 'auditor'` — vê tudo o que admin/gestor veem (incluindo a lista de condóminos), mas `requireMembroComEscrita`/`podeEscrever` bloqueia qualquer escrita (criar aviso, reportar ocorrência, aprovar condómino, etc.). |

## 9. Resumo de prioridades P0/P1 (o que bloqueia mesmo o MVP)

1. ~~**P0** — Entidade `condominio` + isolamento multi-tenant~~ **Resolvido 2026-07-06** (schema e queries); falta o fluxo de onboarding/convite para um segundo condomínio.
2. ~~**P0/P1** — Log de auditoria mínimo + soft-delete em dados financeiros~~ **Resolvido 2026-07-06.**
3. **P1** — Módulo de Assembleias (convocatória → ordem de trabalhos → presenças/procurações → quórum → votação → ata).
4. **P1** — Gestão financeira formal: orçamento, dívida por fração, recibos, exportação PDF/Excel.
5. **P1** — Upload de ficheiros (documentos, faturas, fotos de ocorrências) com controlo de acesso.
6. **P1** — Envio de email (mínimo: reset de password, convocatórias, avisos importantes).
7. **P1** — Distinção proprietário/inquilino e correção da exposição de contactos.
8. **P1** — Seguro obrigatório e fundo de reserva como entidades próprias, não texto livre/implícito.

Tudo o que está classificado P2/P3 é razoável adiar para depois de um MVP fechado, mas **nenhum item P1 pode ficar de fora de uma versão vendável a uma administração de condomínios real em Portugal** — a ausência de Assembleias/Atas, em particular, torna a aplicação inadequada ao seu propósito declarado, por mais polida que a parte de finanças/avisos já esteja.
