# Matriz de Funções e Obrigações do Administrador — GestCondo

Data: 2026-07-22. Produzida na Fase D da auditoria (secção 7.6 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`). Base: Código Civil art. 1436º, alterado pela Lei n.º 8/2022, de 10 de janeiro; DL n.º 268/94; art. 1424º-A CC (declaração de encargos, introduzido pela Lei 8/2022). Fontes consultadas em 2026-07-22.

| Obrigação | Base legal | Prazo | Ação no GestCondo | Alerta na app? | Risco de incumprimento |
|---|---|---|---|---|---|
| Convocar a assembleia (ordinária, anual; extraordinária, quando necessário) | Art. 1436º/a | Assembleia ordinária: anual (data exata fixada por regulamento/uso) | `criarAssembleia` (`app/actions/assembleias.ts`) | ❌ Sem lembrete automático de periodicidade anual | Deliberações essenciais (contas, orçamento) por fazer |
| Elaborar o orçamento de receitas e despesas para cada ano | Art. 1436º/b | Anual | `criarOrcamento` (`app/actions/orcamentos.ts`) | — | Sem orçamento aprovado, rateio de quotas fica sem base formal |
| Verificar a existência do seguro contra incêndio | Art. 1436º/c | Contínuo | Entidade `seguro`, com aviso visual de expiração (30 dias) | ✅ Implementado | Seguro caduco expõe o condomínio |
| Cobrar as receitas e efetuar as despesas comuns | Art. 1436º/d | Contínuo | `movimento` (receitas/despesas) | — | — |
| Verificar a existência do fundo comum de reserva | Art. 1436º/e, DL 268/94 art. 4º | Contínuo, mínimo 10% da quota anual | `getSaldoFundoReserva()`, `destino: 'reserva'` | ✅ Saldo visível no dashboard | **Sem imposição automática do mínimo de 10%** — segregação é manual, por lançamento (ver `FUNCTIONAL_GAPS.md`) |
| Exigir dos condóminos a quota nas despesas aprovadas, incluindo juros legais e sanções pecuniárias | Art. 1436º/f | Conforme vencimento | `gerarQuotasOrcamento`, `lancarJurosMora` | ✅ Implementado 2026-07-21 | — |
| Praticar atos conservatórios dos direitos relativos aos bens comuns | Art. 1436º/g | Conforme necessário | Sem funcionalidade dedicada (é uma ação jurídica externa à app) | N/A | — |
| Regular o uso das coisas comuns e a prestação dos serviços de interesse comum | Art. 1436º/h | Contínuo | Regulamento do condomínio — `FUNCTIONAL_GAPS.md` já assinala como documento sem tratamento especial | ❌ | — |
| Executar as deliberações da assembleia | Art. 1436º/i | **Máximo 15 dias úteis** | Sem campo/alerta de prazo por deliberação | ❌ **Gap identificado nesta auditoria** | Sem registo do prazo, não há como provar cumprimento nem alertar o administrador de um atraso |
| Prestar contas à assembleia | Art. 1436º/j | Anual | Relatório de movimentos (`/financas/relatorio`), balanço orçamento vs. real (`/financas/balanco/[id]`) | ✅ Implementado 2026-07-22 | — |
| Assegurar a execução do regulamento do condomínio e das disposições legais e administrativas relativas ao condomínio | Art. 1436º/l | Contínuo | Sem funcionalidade dedicada | N/A | — |
| Guardar e manter todos os documentos que digam respeito ao condomínio | Art. 1436º/m | Permanente | `documento` (upload Vercel Blob) | ✅ Implementado 2026-07-09 | Bucket público — ver `SECURITY_AUDIT.md` |
| **Informar os condóminos, por escrito ou email, sempre que o condomínio for citado/notificado em processo judicial**, e sobre a evolução do processo, pelo menos semestralmente | Lei n.º 8/2022 (altera art. 1436º) | Imediato + semestral | **Sem funcionalidade** | ❌ **Gap identificado nesta auditoria** | Incumprimento de uma obrigação legal explícita introduzida em 2022 |
| **Apresentar três orçamentos diferentes** para obras de conservação extraordinária ou de inovação | Lei n.º 8/2022 | Antes da deliberação sobre a obra | Sem campo para registar múltiplos orçamentos de fornecedor por obra | ❌ **Gap identificado nesta auditoria** — relacionado com o gap já conhecido "Fornecedores/Orçamentos de obra" em `FUNCTIONAL_GAPS.md` | Deliberação de obra sem os três orçamentos pode ser impugnável |
| **Emitir declaração escrita, a pedido do condómino, com o montante de todos os encargos correntes do condomínio** | Art. 1424º-A CC (Lei n.º 8/2022) | **Máximo 10 dias** desde o pedido; documento instrutório obrigatório da escritura/documento particular de venda da fração | **Sem funcionalidade** — corresponde à "Declaração de dívida" já assinalada como gap em `FUNCTIONAL_GAPS.md`, agora com base legal precisa e prazo confirmado | ❌ | Sem esta declaração, a venda da fração fica sem o documento legalmente exigido, e o condomínio arrisca disputas sobre responsabilidade por dívidas na transmissão |

## Gaps novos identificados nesta fase (não estavam documentados com esta precisão)

1. **Execução de deliberações em 15 dias úteis** — sem campo de prazo nem alerta. Prioridade sugerida: P2 (a app já regista a deliberação; falta só o prazo de execução e um lembrete).
2. **Dever de informação semestral sobre processos judiciais** — funcionalidade totalmente nova, sem equivalente hoje. Prioridade sugerida: P2 (só relevante quando o condomínio estiver de facto envolvido num processo).
3. **Três orçamentos obrigatórios para obras extraordinárias** — liga-se ao gap já conhecido de "Fornecedores/Orçamentos de obra" (`FUNCTIONAL_GAPS.md` secção 4), agora com o requisito legal exato (são precisos três, não um).
4. **Declaração de encargos/dívida (art. 1424º-A)** — já identificado como gap em `FUNCTIONAL_GAPS.md` secção 3 ("Declarações de dívida"), agora com prazo legal confirmado (10 dias) e o facto de ser documento instrutório obrigatório da venda — reforça a prioridade (sugere-se subir de P2 para P1, dado ser um requisito ativo desde 2022, não uma boa prática).

## Nota final

Todos os gaps acima envolvem obrigações introduzidas ou reforçadas pela Lei n.º 8/2022 — a mais recente alteração relevante ao regime da propriedade horizontal, ainda não totalmente refletida no `FUNCTIONAL_GAPS.md` existente (que já apontava “Declarações de dívida” e “Obras de assembleia” em termos gerais, mas sem estes prazos/números exatos).
