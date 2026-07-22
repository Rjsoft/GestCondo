# Plano de Correção — GestCondo

Data: 2026-07-22. Organiza os achados desta auditoria (`docs/audit/RGPD_AUDIT.md`, `LEGAL_COMPLIANCE_AUDIT.md`, `DOCUMENT_TRACEABILITY_AUDIT.md`, `docs/legal/PRIVACY_POLICY_REVIEW.md`, `TERMS_OF_USE_REVIEW.md`, `LEGAL_DOCUMENTS_REGISTER.md`) pelas 4 fases pedidas em `PROMPT_AUDITORIA_JURIDICA_RGPD.md` secção 14.

**Nota importante que difere do desenho original do prompt**: as fases 1–3 pressupõem um percurso "antes do piloto → antes da produção". **O GestCondo já está em produção com um piloto real** (condomínio do utilizador). Por isso, itens aqui listados como "Fase 2/3" não são preparação futura — são correções a aplicar retroativamente, com a urgência que isso implica.

## Fase 1 — Bloqueadores

| Item | Estado | Ação |
|---|---|---|
| Fuga de dados entre condomínios | ✅ Resolvido e verificado (teste de integração real, `SECURITY_AUDIT.md` S9) | Nenhuma |
| Permissões incorretas | ✅ Resolvido (7 perfis, `SECURITY_AUDIT.md` S8) | Nenhuma |
| Documentos publicamente acessíveis | ✅ **Resolvido 2026-07-22** — store privado dedicado (`gestcondo-ficheiros-privado`) + rota autenticada (`app/api/ficheiros/route.ts`). **Confirmado que não há ficheiros antigos por migrar**: 0 registos com `url` em `documento`/`ocorrencia`/`seguro` em produção, 0 blobs no store antigo. | Nenhuma |
| Passwords/segredos expostos | ✅ Nenhum encontrado | Nenhuma |
| Ausência de auditoria financeira | ✅ Resolvido (`audit_log`) | Nenhuma |
| Eliminações irreversíveis sem rasto | ✅ Resolvido — soft-delete em `movimento`, `seguro`, `aviso`, `documento`, `ocorrencia` (DOC-01 fechado 2026-07-22) | Nenhuma |
| Falhas graves de base jurídica | ✅ Nenhuma encontrada — bases jurídicas corretamente não-consentimento | Nenhuma |
| Textos legais enganadores | ✅ Não enganadores, mas incompletos (22 gaps, ver Fase 2) | Ver abaixo |

## Fase 2 — Correções retroativas urgentes (equivalente a "antes do piloto", já em atraso)

| Item | Achado(s) | Ação |
|---|---|---|
| Política de Privacidade | PP-1 a PP-10 | ✅ **9/10 resolvidos 2026-07-22** (reclamação à CNPD, Vercel Analytics, segurança, cookies, transferências, decisões automatizadas, distinção de cenários, data). Falta só PP-1 (identidade/contacto do responsável), placeholder `[A preencher]` deixado no texto — decisão do utilizador, ainda pendente |
| Termos de Utilização | TU-1 a TU-12 | ✅ **9/12 resolvidos 2026-07-22** (propriedade intelectual, documentos carregados, pagamentos — estado atual declarado, RAL/ODR, utilização proibida, legitimidade de representação, exportação/eliminação, força maior, data). Faltam TU-1/TU-5 (identidade/foro, decisão do utilizador) e TU-7 (classificação B2B/B2C, precisa de confirmação jurídica) |
| Acordo de Tratamento de Dados (DPA) | RGPD-03, `LEGAL_DOCUMENTS_REGISTER.md` | ~~Redigir~~ **Modelo pronto** (`DPA_TEMPLATE.md`, 2026-07-22) — falta preencher e celebrar quando surgir o primeiro cliente administradora real (hoje não há nenhum) |
| Contrato SaaS | `LEGAL_DOCUMENTS_REGISTER.md` | Redigir documento comercial formal |
| Retenção | RGPD-04 (fechado), RGPD-05 | Expurgo automático de sessões/logs — soft-delete já cobre todas as tabelas relevantes |
| Direitos | ~~RGPD-02~~ (resolvido), RGPD-06 | Exportação de dados pessoais já completa (2026-07-22); falta só o registo formal de pedidos de oposição/limitação (RGPD-06, não-autosserviço) |
| Incidentes | — | Procedimento já desenhado (`DATA_BREACH_PROCEDURE.md`) — falta designar formalmente um responsável e comunicar aos subcontratantes a obrigação de notificação |
| Logs | ~~AUDIT-01~~ (resolvido 2026-07-22), AUDIT-02 (resolvido para `exportarMeusDados`) | Falta só a exportação CSV de movimentos (AUDIT-02, restante) |
| Exportação/cancelamento | RGPD-02 | Ver acima |
| Fluxos jurídicos essenciais | LEGAL-01 | ~~**Declaração de encargos/dívida (art. 1424º-A)**~~ **Resolvido 2026-07-22** — `/financas/declaracao-divida/[fracaoId]` |

## Fase 3 — Antes de expandir para mais condomínios/clientes (equivalente a "antes da produção", já ativo mas a reforçar)

| Item | Achado(s) | Ação |
|---|---|---|
| Assembleias | ~~LEGAL-03~~ (resolvido 2026-07-22, corrigido 2026-07-22), DOC-02 | Validação de intervalo mínimo de 30 minutos entre convocatórias (mesmo dia ou dia distinto) já feita; falta só considerar numeração sequencial de atas (DOC-02, baixa prioridade) |
| Maiorias | — | Já corretamente não-automatizadas (`MEETINGS_AND_VOTING_MATRIX.md`) — sem ação, considerar campo de referência opcional |
| Atas | DOC-02 | Ver acima |
| Dívidas | LEGAL-01 | Ver Fase 2 |
| Certidões | LEGAL-01 | Idem — é o mesmo item |
| Notificações | LEGAL-06 | Dever de informação semestral sobre processos judiciais (só relevante se/quando existir um processo) |
| Contratos | — | Ver Fase 2 (DPA, SaaS) |
| Subcontratantes | RGPD-09 | Localizar/solicitar DPA de Neon/Resend/Vercel |
| Segurança | Bucket público (Fase 1) | Ver Fase 1 |
| Continuidade | `LEGAL_DOCUMENTS_REGISTER.md` | Plano de recuperação de desastre — depende de confirmar backups da Neon |
| Testes de isolamento | ✅ Já feito | Nenhuma |

## Fase 4 — Evolução (melhorias, sem urgência)

| Item | Achado(s) |
|---|---|
| Orçamento discriminado por rubricas, ligação a deliberações | LEGAL-02, `FUNCTIONAL_GAPS.md` |
| Prazo de execução de deliberações (15 dias úteis) | LEGAL-04 |
| Três orçamentos para obras extraordinárias | LEGAL-05 |
| Histórico de versões de orçamento | DOC-03 |
| Numeração exclusiva de recibos | DOC-04 |
| Download auditado | AUDIT-03 |
| Política de cookies dedicada, política de segurança/acessos/backups formais | `LEGAL_DOCUMENTS_REGISTER.md` |
| Avaliação de interesse legítimo (Vercel Analytics) | `LEGAL_DOCUMENTS_REGISTER.md` |
| Termos para convidados/fornecedores, SLA, NDA, política de suporte | `LEGAL_DOCUMENTS_REGISTER.md` |

## Ordem de execução recomendada (visão única, cruzando as 4 fases por impacto real)

1. ~~**Declaração de encargos/dívida** (LEGAL-01)~~ — **Resolvido 2026-07-22.**
2. ~~**DPA**~~ — **Modelo pronto 2026-07-22** (`DPA_TEMPLATE.md`); sem cliente real ainda, deixa de ser urgente até haver um.
3. ~~**Fechar gaps de Privacidade/Termos**~~ — **18/22 resolvidos 2026-07-22.** Restam 4, todos bloqueados em decisões que só o utilizador pode tomar: identidade legal do operador + contacto de privacidade (PP-1/TU-1), foro competente (TU-5) e classificação B2B/B2C (TU-7, precisa também de confirmação jurídica). Assinalados com `[A preencher]` diretamente nas páginas publicadas.
4. ~~**Soft-delete em `seguro`**~~ — **feito 2026-07-22**, e estendido também a `aviso`/`documento`/`ocorrencia` (DOC-01 fechado).
5. ~~**Bucket de ficheiros deixar de ser público**~~ — **feito 2026-07-22**, via novo store privado (ver `FUNCTIONAL_GAPS.md`).
6. ~~**Auditar login/falha de login/recuperação de conta** (AUDIT-01)~~ — **feito 2026-07-22**, hook `after` do better-auth em `lib/auth.ts`.
7. Resto da Fase 2/3, depois Fase 4 por oportunidade.
