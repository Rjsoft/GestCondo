# Auditoria de Legislação de Condomínios — GestCondo (Fase D)

Data: 2026-07-22. Consolida as subsecções 7.1 a 7.7 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. Fontes primárias: Código Civil (arts. 1419º, 1424º, 1424º-A, 1425º, 1427º, 1430º–1438º-A, 1436º), Decreto-Lei n.º 268/94 de 25 de outubro, Lei n.º 8/2022 de 10 de janeiro (altera o Código Civil, o DL 268/94 e o Código do Notariado) — consolidado consultado em [dre.pt](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2022-177392492) em 2026-07-22. **Auditoria técnica, não parecer jurídico.**

## Documentos desta fase

`docs/legal/MEETINGS_AND_VOTING_MATRIX.md` (secção 7.5), `docs/legal/ADMINISTRATOR_DUTIES_MATRIX.md` (secção 7.6).

## 7.1 Frações e titulares

| Item | Estado no GestCondo |
|---|---|
| Fração autónoma | ✅ `fracao` |
| Permilagem | ✅ `fracao.permilagem` |
| Copropriedade | ✅ mais do que um `membro` condomino pode ligar-se à mesma fração |
| Usufruto | ❌ Sem distinção entre nu-proprietário e usufrutuário — `fracao.proprietario` é texto livre único |
| Mudança de proprietário | 🟡 Sobrescreve sem histórico (já em `FUNCTIONAL_GAPS.md`) |
| Histórico de titularidade | ❌ Idem |
| Residentes/arrendatários | ✅ `perfil: inquilino` |
| Responsabilidade temporal pelas obrigações | 🟡 Ver art. 1424º-A abaixo (LEGAL-01) |

## 7.2 Orçamento e repartição

| Item | Estado |
|---|---|
| Orçamento anual, aprovação, versão | ✅ `orcamento` (ano, valor) |
| Deliberação associada ao orçamento | ❌ Sem ligação a uma assembleia/deliberação específica que o aprove — o orçamento é criado diretamente pelo admin, sem exigir referência a uma ata |
| Repartição por permilagem | ✅ `lib/rateio.ts` |
| Repartição por utilização (elevador) | ✅ `isentaElevador` |
| Despesas de partes comuns que só servem algumas frações (fora do elevador) | ❌ Só o elevador tem tratamento especial — outras despesas de uso parcial (ex. um logradouro só de algumas frações) não têm rateio diferenciado |
| Documentação da decisão, arredondamentos, regularizações | 🟡 Auditoria regista a criação; sem campo formal para "ajuste"/regularização distinto de um lançamento normal |

**LEGAL-02**: orçamento sem ligação obrigatória a uma deliberação de assembleia — tecnicamente o administrador pode criar/alterar um orçamento sem que tenha sido de facto aprovado em assembleia, o que contraria a exigência legal de que o orçamento seja objeto de deliberação (art. 1436º/b, discutido em assembleia convocada para o efeito). Prioridade sugerida: P2 (é uma disciplina de processo, não uma falha técnica — hoje já é possível ligar por convenção, mas nada impõe).

## 7.3 Fundo Comum de Reserva

Confirmado nesta fase: obrigatório por lei (DL 268/94 art. 4º), mínimo **10% da quota-parte anual de cada condómino**, salvo deliberação de percentagem superior; depósito em instituição bancária; administração pela assembleia.

| Item | Estado |
|---|---|
| Constituição/existência | ✅ `destino: 'reserva'` |
| Percentagem mínima de 10% | ❌ **Não imposta nem sugerida automaticamente** — segregação é manual, por lançamento (já em `FUNCTIONAL_GAPS.md`, prioridade P2 "automatizar o cálculo da % mínima") |
| Conta bancária própria | 🟡 Não modelada como entidade distinta (ver gap já identificado na Fase A, comparação com `Teste.xlsx`) |
| Relatório | ✅ Saldo visível no dashboard e em `/financas` |

## 7.4 Quotas e dívidas

| Item | Estado |
|---|---|
| Quotas ordinárias/extraordinárias | 🟡 Só ordinárias têm rateio automático; extraordinárias sem distinção formal nem ligação a uma deliberação (já em `FUNCTIONAL_GAPS.md`) |
| Juros de mora | ✅ Implementado 2026-07-21 |
| Penalizações fixas | ❌ Em falta, se aplicável ao regulamento |
| **Certidão/declaração de dívida** (art. 1424º-A CC) | ❌ **Em falta** — ver LEGAL-01 |
| Título executivo, cobrança judicial, prescrição | N/A — fora do âmbito de uma aplicação de gestão (é matéria de advogado/tribunal), mas a app deve conseguir produzir a prova documental de base (extrato de dívida) |

### LEGAL-01 — Declaração de encargos/dívida em falta (art. 1424º-A CC)

**Confirmado nesta auditoria com base legal precisa**: desde a Lei n.º 8/2022, o administrador é obrigado a emitir, a pedido do condómino, uma declaração escrita com o montante de todos os encargos correntes do condomínio (natureza, valores, prazos de pagamento) e quaisquer dívidas existentes (natureza, valores, datas de constituição e vencimento), **no prazo máximo de 10 dias**. Este documento é **instrutório obrigatório** da escritura ou documento particular autenticado de venda da fração. A responsabilidade pelas dívidas existentes determina-se pelo momento em que deveriam ter sido pagas, salvo renúncia expressa do comprador a esta declaração.

O GestCondo já tem os dados subjacentes (`getMapaSaldos()` calcula exatamente "quotas lançadas − quotas pagas" por fração), mas **não existe nenhuma funcionalidade para gerar este documento formal** com o prazo e o conteúdo exigidos por lei.

- **Severidade**: Alta (é uma obrigação legal ativa desde 2022, não uma boa prática).
- **Prioridade**: **P1** (subida de P2, onde estava em `FUNCTIONAL_GAPS.md`, dado o prazo legal confirmado de 10 dias e o facto de ser documento obrigatório de venda).
- **Esforço estimado**: Pequeno — os dados já existem em `getMapaSaldos()`; falta uma página imprimível (mesmo padrão de `/financas/recibo/[id]` e `/financas/balanco/[id]`) com o conteúdo exigido pelo art. 1424º-A.

## 7.5 Assembleias

Ver `docs/legal/MEETINGS_AND_VOTING_MATRIX.md`. Núcleo P1 já implementado (2026-07-09) está correto na sua decisão de não codificar uma regra universal de maioria — a app mostra os números, o administrador qualifica a decisão à luz da matéria.

**LEGAL-03**: `assembleia.dataPrimeiraConvocatoria`/`dataSegundaConvocatoria` não valida que sejam dias distintos (art. 1432º/6-7 exige isto explicitamente) — hoje é possível, tecnicamente, marcar a 2ª convocatória para o mesmo dia da 1ª, o que seria juridicamente inválido. Severidade Baixa, prioridade P3 (validação de formulário, não uma falha estrutural).

## 7.6 Administrador

Ver `docs/legal/ADMINISTRATOR_DUTIES_MATRIX.md` — 4 gaps identificados (execução de deliberações em 15 dias úteis, dever de informação semestral sobre processos judiciais, três orçamentos para obras extraordinárias, declaração de encargos/dívida — este último já contado como LEGAL-01 acima).

## 7.7 Obras, seguros e manutenção

Já coberto em detalhe por `FUNCTIONAL_GAPS.md` secção 4 (fornecedores, orçamentos de obra, aprovação de despesas, obras urgentes vs. aprovadas em assembleia). Esta auditoria confirma a base legal exata: obras urgentes cabem ao administrador (art. 1427º, fora do âmbito desta pesquisa mas já referenciado no código do projeto), obras de inovação exigem a dupla maioria do art. 1425º (ver secção 3 acima), e a partir da Lei 8/2022 exigem três orçamentos.

## Resumo de achados novos desta fase

| ID | Título | Severidade | Prioridade | Ficheiro |
|---|---|---|---|---|
| LEGAL-01 | Declaração de encargos/dívida (art. 1424º-A) em falta, com prazo legal de 10 dias confirmado | Alta | **P1** | `app/actions/financas.ts` (dados já existem) |
| LEGAL-02 | Orçamento sem ligação obrigatória a uma deliberação de assembleia | Média | P2 | `app/actions/orcamentos.ts` |
| LEGAL-03 | Datas de 1ª/2ª convocatória sem validação de dia distinto | Baixa | P3 | `app/actions/assembleias.ts` |
| LEGAL-04 | Execução de deliberações sem campo de prazo (15 dias úteis) nem alerta | Média | P2 | `lib/db/schema.ts` (`assembleia_ponto`) |
| LEGAL-05 | Sem suporte a três orçamentos de fornecedor para obras extraordinárias/inovação | Média | P2 | Depende do módulo de fornecedores (`FUNCTIONAL_GAPS.md` secção 4) |
| LEGAL-06 | Sem dever de informação semestral sobre processos judiciais em curso | Baixa | P2 (só relevante se houver processo) | Funcionalidade nova |

## Próxima fase

Fase E (secções 8-9 do prompt): documentos e prova, auditoria e rastreabilidade — `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md`.
