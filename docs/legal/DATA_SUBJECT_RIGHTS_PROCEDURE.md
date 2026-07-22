# Procedimento de Exercício de Direitos dos Titulares — GestCondo

Data: 2026-07-22. Formaliza, como procedimento, o que `GDPR_CHECKLIST.md` secção 3 já documentava como checklist. Base: RGPD arts. 12º–22º.

## 1. Prazo de resposta

Um mês a contar da receção do pedido (art. 12º/3), prorrogável por mais dois meses em pedidos complexos ou numerosos, com informação ao titular do motivo do atraso dentro do primeiro mês. **Hoje não existe nenhum mecanismo automático de contagem de prazo** para os pedidos que não sejam autosserviço (ver secção 3) — risco a corrigir.

## 2. Direitos com autosserviço (sem intervenção do administrador)

| Direito | Como se exerce | Ficheiro |
|---|---|---|
| Acesso (art. 15º) | `/os-meus-dados` mostra os dados próprios do `membro` | `app/actions/perfil.ts:getMeuPerfil` |
| Retificação (art. 16º) | `/os-meus-dados`, corrigir nome/telefone | `app/actions/perfil.ts:atualizarMeuPerfil` — nunca aceita um `id` do cliente, sempre a própria linha do chamador |
| Portabilidade (art. 20º) | Botão "Exportar os meus dados" (JSON) | `app/actions/perfil.ts:exportarMeusDados` |
| Apagamento (art. 17º) | `user.deleteUser` do better-auth, com confirmação por email | `lib/auth.ts` |

**Limitação identificada nesta fase**: `exportarMeusDados()` só devolve a linha `membro` (nome, email, telefone, perfil, estado, fração, condomínio, data de criação) — **não inclui** movimentos financeiros associados à fração do titular, ocorrências que reportou, nem votos/presenças em assembleias. Isto pode não satisfazer integralmente o art. 15º/3 (cópia dos dados objeto de tratamento) nem o art. 20º (dados fornecidos ao responsável, num formato estruturado). Ver `RGPD_AUDIT.md`, achado RGPD-02.

## 3. Direitos sem autosserviço (processados manualmente pelo administrador)

| Direito | Estado | Procedimento hoje | Procedimento proposto |
|---|---|---|---|
| Oposição (art. 21º) | Sem mecanismo dedicado | O titular contacta o administrador do condomínio fora da aplicação | Registar o pedido (data, titular, motivo) num canal auditável — hoje não há onde o fazer dentro da app |
| Limitação do tratamento (art. 18º) | Sem mecanismo dedicado | Idem | Idem |
| Retificação/eliminação de dados que o titular não pode editar diretamente (ex. `fracao.proprietario`, permilagem) | Sem mecanismo dedicado | O titular pede ao administrador, que edita manualmente | Registar o pedido e a decisão (`audit_log` já regista a alteração em si, mas não o pedido que a originou) |

**Risco identificado**: sem um registo formal do pedido (data de receção, prazo, decisão, evidência), não é possível demonstrar cumprimento do prazo de um mês nem responder a uma eventual reclamação à CNPD sobre um pedido não autosserviço. Recomenda-se, no mínimo, que o administrador registe estes pedidos por email (já ocorre implicitamente) e que se considere, numa fase seguinte, um formulário dedicado dentro da app que gere um registo com timestamp.

## 4. Validação de identidade

Para pedidos feitos através da própria conta autenticada (a generalidade dos casos hoje), a autenticação já validam a identidade. Para pedidos processados manualmente (ex. por email a um administrador), **não existe um procedimento formal de validação de identidade** — risco de um pedido de eliminação/acesso ser aceite de alguém que não é o titular. Recomenda-se confirmar sempre a partir do email registado na conta.

## 5. Situações em que o apagamento não pode ocorrer

Já corretamente implementado: dados financeiros (`movimento`) usam soft-delete por obrigação de retenção contabilística/fiscal; atas de assembleia aprovadas são imutáveis por serem o registo legal das deliberações (Código Civil arts. 1430º e segs.). Nestes casos, a eliminação da conta remove a linha `membro` (identificação do titular ativo) mas os registos financeiros/atas mantêm-se com o `userId`/nome histórico, sem ligação a uma conta ativa — isto deve estar claramente explicado na Política de Privacidade (a confirmar se já está, na Fase C).

## 6. Registo e prova

Todos os direitos de autosserviço deixam rasto automático (a própria alteração de dados, visível se necessário via `audit_log`, embora este não registe explicitamente "houve um pedido de retificação", só a alteração em si). Pedidos manuais não deixam rasto sistemático — ver secção 3.
