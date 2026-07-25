# Procedimento de Exercício de Direitos dos Titulares — GestCondo

Data: 2026-07-22, **atualizada 2026-07-25** (processo mínimo de oposição/limitação definido — ver secção 3). Formaliza, como procedimento, o que `GDPR_CHECKLIST.md` secção 3 já documentava como checklist. Base: RGPD arts. 12º–22º.

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

**Processo mínimo definido 2026-07-25** (`docs/audit/PRE_CLIENTE_EXTERNO.md` item 7): o titular contacta o administrador do condomínio (responsável pelo tratamento, decide o mérito do pedido) diretamente, ou, em alternativa, o contacto de privacidade do operador (`rjc-si@netcabo.pt`, ver `app/privacidade/page.tsx` secção 1), que reencaminha o pedido ao administrador competente. Quem recebe o pedido regista, num registo simples (folha de cálculo ou pasta de email dedicada — sem necessidade de funcionalidade nova na app nesta fase), a data de receção, identificação do titular, condomínio, direito invocado, e a data/teor da resposta, para poder demonstrar cumprimento do prazo de um mês (secção 1). O operador (RJCSI) presta assistência técnica ao administrador para executar a decisão quando tecnicamente necessário (ex. localizar um dado específico para limitar o seu tratamento), mas **não decide o mérito do pedido** — essa decisão cabe sempre ao responsável pelo tratamento, consistente com o papel do operador definido no Contrato SaaS (cláusula 2) e no DPA.

| Direito | Estado | Procedimento adotado |
|---|---|---|
| Oposição (art. 21º) | ✅ Processo mínimo definido | Ver acima |
| Limitação do tratamento (art. 18º) | ✅ Processo mínimo definido | Ver acima |
| Retificação/eliminação de dados que o titular não pode editar diretamente (ex. `fracao.proprietario`, permilagem) | ✅ Processo mínimo definido | Ver acima — mesmo canal e registo; a alteração em si já fica registada em `audit_log`, o registo cobre agora também o pedido que a originou |

**Limitação que continua a existir**: o registo é manual (folha de cálculo/email), não um formulário dentro da app com timestamp automático — suficiente como processo mínimo para o primeiro cliente externo, mas vale a pena evoluir para um formulário dedicado numa fase seguinte, à medida que o volume de pedidos justificar o investimento.

## 4. Validação de identidade

Para pedidos feitos através da própria conta autenticada (a generalidade dos casos hoje), a autenticação já valida a identidade. Para pedidos processados manualmente (ex. por email a um administrador), **não existe um procedimento formal de validação de identidade** — risco de um pedido de eliminação/acesso ser aceite de alguém que não é o titular. Recomenda-se confirmar sempre a partir do email registado na conta.

## 5. Situações em que o apagamento não pode ocorrer

Já corretamente implementado: dados financeiros (`movimento`) usam soft-delete por obrigação de retenção contabilística/fiscal; atas de assembleia aprovadas são imutáveis por serem o registo legal das deliberações (Código Civil arts. 1430º e segs.). Nestes casos, a eliminação da conta remove a linha `membro` (identificação do titular ativo) mas os registos financeiros/atas mantêm-se com o `userId`/nome histórico, sem ligação a uma conta ativa — isto deve estar claramente explicado na Política de Privacidade (a confirmar se já está, na Fase C).

## 6. Registo e prova

Todos os direitos de autosserviço deixam rasto automático (a própria alteração de dados, visível se necessário via `audit_log`, embora este não registe explicitamente "houve um pedido de retificação", só a alteração em si). Pedidos manuais não deixam rasto sistemático — ver secção 3.
