# Auditoria Funcional — GestCondo

Data: 2026-07-06. Legenda: ✅ Implementado · 🟡 Parcial/básico · ❌ Em falta. Prioridade pensada para o objetivo declarado (produto profissional multi-condomínio para o mercado português): **P0** bloqueador estrutural, **P1** necessário para MVP utilizável, **P2** necessário para venda comercial, **P3** diferenciador/avançado.

## Visão geral honesta

O que existe hoje cobre uma fatia pequena e bem construída de **gestão administrativa básica de um único condomínio**: finanças simples, avisos, ocorrências, frações, condóminos com fluxo de aprovação. **Não existe nenhuma noção de "condomínio" como entidade** (ver `SECURITY_AUDIT.md` S9) — logo tudo abaixo assume, implicitamente, que isto teria de ser reconstruído sobre uma base multi-tenant antes de ser vendável a mais do que um condomínio.

Módulo inteiro pedido como essencial para o mercado português — **Assembleias** — ganhou o seu núcleo P1 em 2026-07-09 (convocatória, ordem de trabalhos, presenças/procurações, quórum e votação por permilagem, ata imutável) — ver secção 2. **Gestão financeira formal** (orçamentos, dívidas por fração, recibos, exportação, seguro obrigatório, fundo de reserva) ganhou uma primeira versão em 2026-07-07/08 — ver secção 3 — geração automática de quotas por rateio de permilagem (com isenção de elevador), juros de mora, reconciliação bancária (importação CSV + conciliação manual assistida) e relatório de movimentos em PDF ficaram resolvidos em 2026-07-21; falta só a exportação `.xlsx` real (hoje é CSV), se vier a ser necessária.

**Verificado em runtime em 2026-07-21**, contra a base de dados Neon real do utilizador (não só revisto em código): migrações `0007_assembleias`/`0008_upload-ficheiros` aplicadas; ciclo completo de uma assembleia (convocar → adicionar ponto → votar → aprovar deliberação → marcar realizada → aprovar ata → confirmar imutabilidade → imprimir ata) testado manualmente no browser; upload real de ficheiro testado nos três pontos que o usam (documento, foto de ocorrência, apólice de seguro), incluindo a eliminação em cascata do ficheiro no Vercel Blob. Nesse teste encontrou-se e corrigiu-se um desfasamento entre o limite de corpo das server actions (10MB) e o limite real de ficheiro documentado (15MB) — `next.config.mjs`, `bodySizeLimit` subido para 16MB.

---

## 1. Gestão do condomínio

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Condomínios/edifícios (entidade própria) | ✅ Implementado 2026-07-22 | Tabela `condominio` (nome, morada, NIF) com isolamento por `condominioId` em todas as queries (ver `SECURITY_AUDIT.md` S9). Ecrã de definições em `/condominio` (editar nome/morada/NIF, gerar código de convite). Onboarding: conta sem `membro` escolhe entre entrar com código de convite (fica pendente, como qualquer registo novo) ou criar um condomínio novo (fica admin). Testado em runtime com duas contas descartáveis e dois condomínios distintos. | — |
| Frações autónomas | 🟡 Parcial | `app/(app)/fracoes/page.tsx` + schema `fracao`: identificação, proprietário (texto livre), permilagem, contactos, notas. Sem condomínio associado. | P1 (completar) |
| Permilagens | 🟡 Parcial — aviso adicionado 2026-07-21 | Campo `permilagem` existe e soma-se no dashboard. Ainda não há validação bloqueante de que a soma é 1000‰, mas o diálogo de geração de quotas (`components/financas/gerar-quotas-dialog.tsx`) mostra sempre a permilagem total apurada, com aviso visual se desviar de 1000‰ — o rateio usa sempre a soma real, nunca um total fixo, por isso continua matematicamente correto mesmo que a soma não seja 1000‰. | P1 → P2 |
| Proprietários | ✅ Compropriedade e NIF resolvidos 2026-07-21 | `fracao.proprietario` continua texto livre (registo legal de propriedade, válido mesmo antes de o proprietário ter conta na app), agora com `fracao.nif` opcional, mostrado em `/fracoes` sob o nome do proprietário. **Desde 2026-07-07**, um `membro` com `perfil: condomino` pode ligar-se de facto a essa fração via `membro.fracaoId`. **Compropriedade** (mais do que um `membro` condomino na mesma fração) já era tecnicamente possível na BD, mas sem UI que o mostrasse — `/fracoes` tem agora a coluna "Condómino(s) com conta" (só visível a quem gere/audita), listando todos os condóminos com conta ligados a cada fração. `nif`/edição de frações existentes só é possível na criação — não há ainda um "editar fração" geral (mesma limitação já existente para identificação/proprietário/permilagem). | — |
| Inquilinos | 🟡 Parcial — implementado 2026-07-07 | `perfil: inquilino` (desde o redesenho de papéis) agora pode ligar-se a uma fração via `membro.fracaoId`, tal como um condómino — um proprietário e o seu inquilino podem ter contas em simultâneo, ambas ligadas à mesma fração, cada uma com o seu nível de acesso (inquilino não vê finanças/frações, ver `SECURITY_AUDIT.md` S8). Editável em `/condominos` (`EditarMembroDialog`, agora com um seletor de fração em vez de texto livre). | P1 → P2 |
| Contactos de emergência | ❌ Em falta | Sem campo/estrutura dedicada. | P2 |
| Representantes legais | ❌ Em falta | Sem suporte a procurador/representante de um proprietário (pessoa coletiva, herança indivisa, etc. — muito comum em condomínios PT). | P2 |
| Histórico de titularidade | ❌ Em falta | Alterar `fracao.proprietario` sobrescreve o valor anterior sem histórico — perde-se o registo de quem era o proprietário antes de uma venda, relevante para apurar responsabilidade por dívidas. | P2 |
| Documentos do prédio | 🟡 Parcial | `app/(app)/documentos/page.tsx` guarda título/categoria/link, mas sem upload real (ver secção Documentos abaixo). | P1 |
| Regulamento do condomínio | ❌ Em falta | Poderia viver como uma categoria de documento, mas não há nenhum tratamento especial (ex. necessidade de aceitação/leitura por condómino). | P2 |
| Seguro obrigatório | ✅ Implementado 2026-07-08 | Entidade `seguro` própria (seguradora, apólice, tipo, validade, prémio), gerida em `/financas` (separador "Seguro"), com aviso visual quando a apólice expirou ou expira nos próximos 30 dias. Falta ainda anexar o documento da apólice (depende de upload de ficheiros). | — |
| Capital seguro (valor de reconstrução atualizado, DL 268/94) | ✅ Implementado 2026-07-22 | Distinto do prémio: é o valor pelo qual o edifício está seguro, obrigatório atualizar anualmente. Gap identificado por comparação com um template de contabilidade de condomínio real (`14_Seguro_Actualizacao`). Campo `seguro.capitalSeguro`, opcional, mostrado em `/financas` junto do prémio. | — |
| Fundo comum de reserva | ✅ Implementado 2026-07-08 | Movimentos podem ser marcados com `destino: "reserva"` em vez de `"geral"` e passam a ser seguidos numa conta própria (`getSaldoFundoReserva()`), visível no dashboard e em `/financas`, excluída do saldo da conta corrente normal. Falta ainda impor por regra a % mínima de quota destinada ao fundo (DL nº 268/94) — hoje a segregação é manual, por lançamento. | P2 (automatizar o cálculo da % mínima) |
| Dados formais do edifício | ❌ Em falta | Sem registo matricial, conservatória, licença de habitação, projeto/arquiteto, área de construção. `condominio` só tem nome/morada/NIF. Gap identificado 2026-07-22 por comparação com um template de contabilidade de condomínio real (`7_EDIFICIO`). | P2 |
| Património/inventário do condomínio | ❌ Em falta | Sem entidade para bens do condomínio (mobiliário, equipamento, segurança) com valor de aquisição/depreciação/valor atual. Gap identificado 2026-07-22, mesma comparação (`10_PATRIMONIO`). | P2 |
| Área privativa/comum por fração (m²) | 🟡 Parcial | `fracao` tem permilagem mas não área em m² (privativa nem parte comum) — informação normalmente presente na ficha de fração. Gap identificado 2026-07-22, mesma comparação (`8_FRACCOES`). | P3 |

## 2. Assembleias — implementado 2026-07-09 (núcleo P1), verificado em runtime 2026-07-21

| Funcionalidade | Estado | Prioridade |
|---|---|---|
| Convocatórias | ✅ Tipo (ordinária/extraordinária), local, 1ª e 2ª convocatória (`app/actions/assembleias.ts:criarAssembleia`) | P1 |
| Ordem de trabalhos | ✅ Pontos numerados sequencialmente, adicionáveis enquanto a assembleia não está encerrada | P1 |
| Registo de presenças | ✅ Por fração, com nome do representante | P1 |
| Representações/procurações | ✅ Campo `tipo` (`presencial`/`procuracao`) na presença | P1 |
| Cálculo de quórum (por permilagem) | ✅ Permilagem presente / permilagem total do condomínio, mostrado na página de detalhe e na ata. Sem distinção automática de limiar 1ª vs. 2ª convocatória — a app mostra o número, quem qualifica se o quórum exigido foi atingido é o administrador | P1 |
| Votação por permilagem | ✅ Voto por fração (`favor`/`contra`/`abstencao`) por ponto, com soma de permilagem por opção | P1 |
| Deliberações | ✅ Resultado (`aprovado`/`reprovado`/`adiado`) definido manualmente pelo administrador por ponto, com base nos números mostrados | P1 |
| Atas | ✅ **P1** — texto livre + ata gerada automaticamente (presenças, votação, deliberações) em `/assembleias/ata/[id]`, imprimível. Torna-se imutável assim que aprovada (`estado: 'aprovada'` bloqueia qualquer escrita nas tabelas associadas) | — |
| Anexos à ata | ❌ | P2 — depende de upload de ficheiros (ver secção 6) |
| Histórico de assembleias | ✅ Lista em `/assembleias`, ordenada por data | P1 |
| Videoconferência (quando legalmente admissível) | ❌ | P3 |
| Notificação por email de convocatórias | ✅ Envio automático a todos os membros aprovados do condomínio ao convocar (`lib/email.ts`) | — |
| Registo de receção/leitura/confirmação de convocatória | ❌ | P2 — juridicamente relevante para provar convocação regular |

Este é o módulo funcionalmente mais crítico para o mercado português (as assembleias e as suas atas são o instrumento legal central da vida do condomínio, Código Civil arts. 1430º–1438º-A) e o que está mais distante de existir. Não há atalhos aqui: é um módulo novo de raiz, com implicações de integridade de dados fortes (uma ata aprovada não pode ser silenciosamente editável — ver auditoria abaixo).

## 3. Gestão financeira

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Orçamento anual | 🟡 Parcial — implementado 2026-07-07, geração de quotas 2026-07-21, balanço previsto vs. real 2026-07-22 | Tabela `orcamento` (ano, valor anual, valor anual do elevador opcional, notas), um por condomínio/ano, gerida em `/financas` (separador "Orçamentos"), com um botão "Gerar quotas mensais" que cria as 12 quotas/fração automaticamente (ver linha "Quotas ordinárias"). **Falta ainda**: rubricas discriminadas por categoria de despesa (o valor anual continua a ser um único número, exceto o elevador) — necessário para orçamento previsto *por rubrica* vs. executado, não só o total. | P1 → P2 |
| Balanço orçamento aprovado vs. real, com desvio (art. 1436º CC) | ✅ Implementado 2026-07-22 | `/financas/balanco/[id]`, a partir de um orçamento — compara o valor anual aprovado com receitas/despesas reais lançadas nesse ano (destino "geral", excluindo fundo de reserva), despesas discriminadas por categoria, e desvio (real − previsto) em € e %. Gap identificado por comparação com um template de contabilidade de condomínio real (`6_CONTAS`/`6A_BALANCO`). Página imprimível, mesmo padrão do relatório de movimentos. Ainda não discrimina por rubrica de orçamento (ver linha acima) — o previsto usado é sempre o total do orçamento. | — |
| Quotas ordinárias | ✅ Rateio automático implementado 2026-07-21 | Um `movimento` do tipo `receita`, **obrigatoriamente ligado a uma fração** (`criarMovimento`, ver `app/actions/financas.ts`). `app/actions/orcamentos.ts:gerarQuotasOrcamento` + `lib/rateio.ts` geram as 12 quotas mensais de cada fração a partir do orçamento anual, rateadas por permilagem — com confirmação prévia (pré-visualização por fração) e bloqueio contra gerar em duplicado para o mesmo orçamento (verificado por `movimento.orcamentoId`, uma FK real). Suporta isenção da parcela do elevador por fração (`fracao.isentaElevador`, comum para o rés-do-chão em Portugal — Código Civil art. 1424º) com um valor anual de elevador próprio no orçamento, rateado só pelas frações não isentas. Lançamento manual um a um continua disponível para casos fora do rateio automático (quotas extraordinárias, ajustes). | — |
| Quotas extraordinárias | ❌ Em falta | Sem distinção de ordinária/extraordinária nem ligação a uma deliberação de assembleia que a aprove. | P1 |
| Despesas comuns | 🟡 Parcial | `movimento` tipo `despesa`, categoria livre, sem rateio automático por permilagem. | P1 |
| Fundo comum de reserva | ✅ Implementado 2026-07-08 | Ver secção 1. | — |
| Dívidas por condómino/fração | ✅ Implementado 2026-07-07 | Separador "Dívidas por fração" em `/financas` (`getMapaSaldos()`): para cada fração, quotas lançadas − quotas pagas = dívida. Responde diretamente a "quanto deve o 2ºEsq?". Verificado com um teste de integração real (`lib/db/mapa-saldos.dbtest.ts`) contra o tipo `numeric` do Postgres. | — |
| Juros de mora por atraso | ✅ Implementado 2026-07-21 | `lib/juros.ts` + `app/actions/financas.ts:lancarJurosMora` — juros simples, proporcionais aos dias de atraso, sobre quotas por pagar cuja data já passou (a própria data da quota é usada como vencimento, sem campo de vencimento nem tolerância próprios). A taxa anual é introduzida pelo administrador no momento de lançar (`components/financas/lancar-juros-dialog.tsx`, com pré-visualização por fração) — a app não sugere nem guarda uma taxa, por depender do regulamento do condomínio ou da taxa legal em vigor. Confirmado cria um `movimento` de receita por fração com dívida. Penalizações fixas (não proporcionais a juros) continuam por implementar, se aplicável ao regulamento do condomínio. | P2 (penalizações fixas, se necessário) |
| Recibos | ✅ Implementado 2026-07-07 | Página `/financas/recibo/[id]` (só para movimentos tipo receita) com identificação do condomínio/fração/proprietário/valor e botão "Imprimir / guardar em PDF" (via impressão do browser — sem biblioteca de PDF nova). Acessível a partir do menu de ações de cada movimento. | — |
| Pagamentos | ✅ Implementado 2026-07-22 | Além do booleano `pago`, o movimento regista meio de pagamento (transferência/multibanco/numerário/cheque/outro), referência multibanco e data de liquidação (distinta da data do lançamento). Capturados ao criar um movimento já pago, ou ao marcar como pago um movimento pendente (`components/financas/marcar-pago-dialog.tsx`) — em ambos os casos opcionais, para não travar quem só quer registar rápido. Visíveis no recibo e na exportação CSV. Testado em runtime com conta descartável. | — |
| Reconciliação bancária | ✅ Implementado 2026-07-21 | Importação de extrato bancário CSV (`components/financas/importar-extrato-dialog.tsx`) com mapeamento manual de colunas (Data/Descrição/Valor único ou Débito+Crédito, delimitador e separador decimal configuráveis) — não assume o formato de nenhum banco específico. Conciliação manual entre linhas do extrato e movimentos pagos da conta corrente (`destino: 'geral'`), com sugestões automáticas por valor igual + data próxima (`lib/extrato.ts:sugerirCorrespondencias`), opção de ignorar linhas sem correspondência esperada (ex: taxas bancárias) e desfazer conciliações. Só abrange a conta corrente — o fundo de reserva fica de fora, por estar tipicamente noutra conta bancária. Testado em runtime com movimentos e extrato fictícios. | — |
| Relatórios financeiros | 🟡 Parcial | 3 cartões (receitas/despesas/saldo) mais o mapa de saldos por fração — ainda sem relatório por período/categoria. | P1 |
| Exportação Excel/PDF | 🟡 Parcial — CSV 2026-07-07, PDF 2026-07-21 | Botão "Exportar CSV" na lista de movimentos (abre corretamente no Excel, com BOM UTF-8 para acentos/€). **Feito 2026-07-21**: `/financas/relatorio` — relatório de movimentos imprimível (mesmo padrão do recibo: `window.print()`, sem biblioteca nova), com totais e lista completa, acessível pelo botão "Relatório (PDF)" na tab Movimentos. Verificado em runtime. **Não é um `.xlsx` real** — decisão deliberada de não introduzir a dependência `exceljs` sem necessidade confirmada; CSV cobre a prestação de contas com risco mínimo. | P3 (evoluir para `.xlsx` real, só se necessário) |
| Declarações de dívida | ❌ Em falta | Documento formal exigido em compra/venda de fração (para saber se há dívidas de quotas). | P2 |
| Mapas de saldos | ✅ Implementado 2026-07-07 | Ver dívidas por fração, acima — é a mesma funcionalidade. | — |
| Mapa mensal de quotizações (vista calendário fração × mês) | 🟡 Parcial | Os dados já existem (`movimento` com `fracaoId`/`pago`/`data`), mas não há uma vista dedicada tipo "mapa mensal por fração" — hoje só se vê linha a linha na lista de movimentos ou agregado no mapa de saldos. Gap identificado 2026-07-22 por comparação com um template de contabilidade de condomínio real (`12_Quotizações`/`12A`/`12B`). | P2 |
| Conta bancária como entidade (IBAN, saldo próprio) | 🟡 Parcial | Há reconciliação de extrato CSV (`lib/extrato.ts`), mas não uma entidade "conta bancária" com IBAN/saldo/tipo (à ordem, a prazo) — hoje assume-se implicitamente uma única conta corrente. Gap identificado 2026-07-22, mesma comparação (`BANCOS`). | P3 |

## 4. Ocorrências e manutenção

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Comunicação de avarias | ✅ Implementado | `app/(app)/ocorrencias/page.tsx` + `app/actions/ocorrencias.ts`. | — |
| Pedidos de intervenção | ✅ Implementado | Mesma funcionalidade acima cobre este caso de uso. | — |
| Fotos/anexos | ✅ Implementado 2026-07-09 | `ocorrencia.fotoUrl` via Vercel Blob (`app/actions/ocorrencias.ts`), incluindo eliminação em cascata do ficheiro. | — |
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
| Notificações (push/email) | ✅ Implementado 2026-07-09 — email enviado quando um aviso `importante`/`urgente` é publicado (a todos os membros aprovados) e quando o estado de uma ocorrência é atualizado (a quem a reportou). Avisos `normal` não geram email, para não sobrecarregar a caixa de entrada. Sem notificação push (só email). | — |
| Mensagens internas (condómino ↔ admin) | ❌ Em falta | Sem qualquer canal de mensagem direta/privada. | P2 |
| Histórico de comunicações | 🟡 Parcial | Avisos ficam listados indefinidamente, mas não há registo de "quem viu o quê". | P2 |
| Confirmação de leitura | ❌ Em falta | Nem em avisos nem (mais crítico) em convocatórias de assembleia. | P1/P2 conforme uso |
| Regras contra exposição de emails entre condóminos | ✅ Resolvido 2026-07-07 | Ver `SECURITY_AUDIT.md` S13. | — |

## 6. Documentos

| Funcionalidade | Estado | Nota | Prioridade |
|---|---|---|---|
| Upload seguro | ✅ Implementado 2026-07-09, verificado em runtime 2026-07-21 | Vercel Blob (`lib/storage.ts`), com validação de tipo/tamanho por finalidade (PDF/imagem, 8–15MB). `documento.url` continua a aceitar um link colado à mão como alternativa. Fotos de ocorrência e apólice de seguro também ligadas (`ocorrencia.fotoUrl`, `seguro.anexoUrl`). Sem scanning de malware; controlo de acesso é o mesmo já existente por página (`condominioId`/perfil), não uma verificação por ficheiro — ver a linha seguinte. **Nota operacional importante:** o Blob store da Vercel tem de ser criado com acesso **Public** — um store criado como **Private** falha todos os uploads (`Cannot use public access on a private store`) e o modo de acesso não pode ser alterado depois de criado, só recriando o store. | — |
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
| Super Admin (operador da plataforma) | 🟡 Flag `user.superAdmin` existe e dá poderes de gestão/consulta em qualquer condomínio a que a pessoa também pertença como `membro`. **Onboarding para novos condomínios resolvido 2026-07-22** (ver acima); falta ainda um painel cross-condomínio dedicado — ver Fase 5 do `ROADMAP.md`. |
| Empresa de administração (gere vários condomínios) | 🟡 `perfil: 'gestor'` tem exatamente os mesmos poderes que `admin` dentro de um condomínio, e a mesma pessoa pode ter uma linha `membro` com `perfil: 'gestor'` em vários condomínios em simultâneo (o schema já suporta isto, e já é possível criar/juntar-se a mais do que um condomínio — ver acima). Falta um seletor de "condomínio ativo" na sessão para uma conta que faça parte de vários — hoje `getMembroAtual()` só considera a primeira linha `membro` da conta. |
| Administrador do condomínio | ✅ `perfil: 'admin'`, com âmbito por condomínio (`membro.condominioId`). |
| Condómino proprietário | ✅ `perfil: 'condomino'` — vê dados financeiros/patrimoniais (`PERFIS_ACESSO_FINANCEIRO`). |
| Inquilino | ✅ `perfil: 'inquilino'` — vê avisos/documentos/ocorrências, mas **não** finanças nem frações (nem no dashboard nem nas páginas dedicadas, que devolvem 404 se acedidas diretamente). |
| Fornecedor externo | 🟡 `perfil: 'fornecedor'` existe com o mesmo acesso mínimo que inquilino. Falta o fluxo de atribuição de ocorrências/orçamentos a um fornecedor específico (P2, ver secção 4). |
| Auditor/consulta (leitura apenas) | ✅ `perfil: 'auditor'` — vê tudo o que admin/gestor veem (incluindo a lista de condóminos), mas `requireMembroComEscrita`/`podeEscrever` bloqueia qualquer escrita (criar aviso, reportar ocorrência, aprovar condómino, etc.). |

## 9. Resumo de prioridades P0/P1 (o que bloqueia mesmo o MVP)

1. ~~**P0** — Entidade `condominio` + isolamento multi-tenant~~ **Resolvido 2026-07-06** (schema e queries) **+ 2026-07-22** (onboarding/convite para um segundo condomínio).
2. ~~**P0/P1** — Log de auditoria mínimo + soft-delete em dados financeiros~~ **Resolvido 2026-07-06.**
3. ~~**P1** — Módulo de Assembleias (convocatória → ordem de trabalhos → presenças/procurações → quórum → votação → ata).~~ **Resolvido 2026-07-09** (núcleo P1); faltam anexos à ata e confirmação de leitura (P2).
4. **P1** — Gestão financeira formal: orçamento, dívida por fração, recibos, exportação PDF/Excel. Rateio automático de quotas por permilagem (com isenção de elevador) e relatório PDF **resolvidos 2026-07-21** — falta ainda exportação `.xlsx` real (hoje é CSV), se necessária.
5. ~~**P1** — Upload de ficheiros (documentos, faturas, fotos de ocorrências) com controlo de acesso.~~ **Resolvido 2026-07-09** via Vercel Blob (`lib/storage.ts`); controlo de acesso ao nível da página, não por ficheiro (ver secção 6).
6. ~~**P1** — Envio de email: reset de password/verificação, convocatórias, avisos importantes, atualização de ocorrências.~~ **Resolvido 2026-07-09.**
7. ~~**P1** — Distinção proprietário/inquilino e correção da exposição de contactos.~~ **Resolvido 2026-07-07** (`membro.fracaoId`, `SECURITY_AUDIT.md` S13); compropriedade e NIF do proprietário **resolvidos 2026-07-21** (ver secção 1).
8. ~~**P1** — Seguro obrigatório e fundo de reserva como entidades próprias, não texto livre/implícito.~~ **Resolvido 2026-07-08.**

Tudo o que está classificado P2/P3 é razoável adiar para depois de um MVP fechado, mas **nenhum item P1 pode ficar de fora de uma versão vendável a uma administração de condomínios real em Portugal** — a ausência de Assembleias/Atas, em particular, torna a aplicação inadequada ao seu propósito declarado, por mais polida que a parte de finanças/avisos já esteja.
