# Matriz de Retenção de Dados — GestCondo

Data: 2026-07-22. Formaliza como matriz o que `GDPR_CHECKLIST.md` secção 5 já descrevia em texto corrido. **Os prazos concretos ainda não foram validados por um jurista/contabilista** — ver coluna "Confirmado?".

| Categoria | Prazo proposto | Fundamento | Evento inicial | Exceções | Anonimização/eliminação | Responsável pela execução | Confirmado? |
|---|---|---|---|---|---|---|---|
| Contas de utilizador (`user`, `account`, `session`) | Enquanto a conta existir | Execução de contrato | Criação da conta | — | Eliminação a pedido do titular (`user.deleteUser`) | Automático (better-auth) | Sim, comportamento implementado |
| Contactos (`membro.telefone/email`, `fracao.contactoEmail/Telefone`) | Enquanto a fração/vínculo existir | Execução de contrato | Criação do registo | — | Substituído/removido quando o vínculo termina | Admin | Não |
| Proprietários (`fracao.proprietario`, `nif`) | Enquanto a fração existir no condomínio | Obrigação legal (registo de propriedade horizontal) | Criação da fração | Sem histórico de titularidade — alteração sobrescreve o valor anterior (gap já identificado em `FUNCTIONAL_GAPS.md`) | Sobrescrita, sem histórico | Admin | Não |
| Quotas, pagamentos, despesas (`movimento`) | Prazo de retenção contabilística/fiscal — **10 anos é a referência habitual em Portugal, a confirmar caso a caso** | Obrigação legal fiscal/contabilística | Data do lançamento | Nenhuma — soft-delete garante retenção mesmo após "eliminação" | Soft-delete (`deletedAt`), nunca `DELETE` físico | Automático (schema) | Prazo exato não confirmado |
| Recibos | Igual aos movimentos que documentam | Idem | Emissão | — | Gerados a pedido, não persistidos como entidade própria | — | Não |
| Documentos fiscais (declarações de dívida, quando existirem) | Igual aos movimentos | Idem | Emissão | — | — | — | Funcionalidade ainda não implementada (`FUNCTIONAL_GAPS.md`) |
| Atas de assembleia (`assembleia`, aprovada) | **Sem prazo — retenção permanente** | Obrigação legal (registo legal da vida do condomínio, Código Civil arts. 1430º e segs.) | Aprovação da ata | Imutável após aprovação | Nunca eliminada | Automático (bloqueio de escrita) | Sim, por natureza do documento |
| Deliberações, votos, presenças | Igual às atas | Idem | Realização da assembleia | — | — | — | Sim |
| Procurações (`assembleia_presenca.tipo='procuracao'`) | Igual às atas | Idem | Registo da presença | — | — | — | Sim |
| Contratos (seguro, fornecedores) | Enquanto vigentes + prazo de prova documental após cessação | Execução de contrato / obrigação legal | Celebração | — | Eliminação manual hoje (sem soft-delete em `seguro`) | Admin | Não |
| Seguros (`seguro`) | Ver acima | Obrigação legal (seguro obrigatório do edifício) | Início da apólice | — | `DELETE` físico hoje — sem soft-delete | Admin | Não |
| Incidentes de segurança | Documentação permanente do próprio incidente (art. 33º/5 RGPD), independentemente da notificação | Obrigação legal | Deteção do incidente | — | — | — | Procedimento ainda por implementar, ver `DATA_BREACH_PROCEDURE.md` |
| Ocorrências (`ocorrencia`) | Sem prazo definido hoje | A definir | Criação | — | `DELETE` físico | Admin | Não |
| Comunicações (`aviso`) | Sem prazo definido hoje | A definir | Criação | — | `DELETE` físico | Admin | Não |
| Logs de segurança (better-auth: sessões, tentativas de login) | Sessões expiram em 7 dias (`expiresIn`); **sem confirmação de expurgo físico da BD após expirar** | Interesse legítimo (segurança) | Criação da sessão | — | Expurgo automático não confirmado | A confirmar (better-auth) | Não |
| Logs de auditoria (`audit_log`) | **Sem prazo definido** | Interesse legítimo / obrigação de responsabilização (art. 5º/2) | Cada ação registada | — | Sem expurgo automático | — | Não |
| Backups | Dependente da política do fornecedor (Neon) | Continuidade de serviço | — | — | — | Neon | **Não confirmado — ação a tomar** |
| Dados de potenciais clientes (leads) | N/A | — | — | — | — | — | Sem funcionalidade de captação de leads identificada |
| Pedidos de exercício de direitos | Sem registo formal hoje (ver `DATA_SUBJECT_RIGHTS_PROCEDURE.md`) | Prova de cumprimento do prazo de 1 mês | Receção do pedido | — | — | — | Não — gap identificado |
| Reclamações/litígios | Durante a pendência do litígio + prazo de prescrição aplicável | Defesa de direitos | Início do litígio | — | — | — | Não confirmado |

## Ações prioritárias identificadas

1. **Nenhuma tabela além de `movimento` usa soft-delete** — `fracao`, `aviso`, `documento`, `ocorrencia`, `seguro` continuam com `DELETE` físico (já identificado em `GDPR_CHECKLIST.md` secção 5, aqui confirmado ainda válido).
2. **Sem expurgo automático em nenhuma categoria** — nem sessões expiradas, nem logs de auditoria, nem candidaturas rejeitadas.
3. **Prazo fiscal/contabilístico de 10 anos não confirmado formalmente** — deve ser validado por um contabilista certificado antes de ser tratado como política definitiva.
4. **Política de retenção de backups da Neon não confirmada** — depende do plano contratado.
