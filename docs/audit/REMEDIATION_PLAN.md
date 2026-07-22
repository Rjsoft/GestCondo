# Plano de Correção — GestCondo

Data: 2026-07-22. Organiza os achados desta auditoria (`docs/audit/RGPD_AUDIT.md`, `LEGAL_COMPLIANCE_AUDIT.md`, `DOCUMENT_TRACEABILITY_AUDIT.md`, `docs/legal/PRIVACY_POLICY_REVIEW.md`, `TERMS_OF_USE_REVIEW.md`, `LEGAL_DOCUMENTS_REGISTER.md`) pelas 4 fases pedidas em `PROMPT_AUDITORIA_JURIDICA_RGPD.md` secção 14.

**Nota importante que difere do desenho original do prompt**: as fases 1–3 pressupõem um percurso "antes do piloto → antes da produção". **O GestCondo já está em produção com um piloto real** (condomínio do utilizador). Por isso, itens aqui listados como "Fase 2/3" não são preparação futura — são correções a aplicar retroativamente, com a urgência que isso implica.

## Fase 1 — Bloqueadores

| Item | Estado | Ação |
|---|---|---|
| Fuga de dados entre condomínios | ✅ Resolvido e verificado (teste de integração real, `SECURITY_AUDIT.md` S9) | Nenhuma |
| Permissões incorretas | ✅ Resolvido (7 perfis, `SECURITY_AUDIT.md` S8) | Nenhuma |
| Documentos publicamente acessíveis | ❌ **Bucket Vercel Blob é público** | Corrigir antes de qualquer documento com dados pessoais sensíveis ser carregado em maior volume |
| Passwords/segredos expostos | ✅ Nenhum encontrado | Nenhuma |
| Ausência de auditoria financeira | ✅ Resolvido (`audit_log`) | Nenhuma |
| Eliminações irreversíveis sem rasto | 🟡 Resolvido para `movimento`; **não para `seguro`/`aviso`/`documento`/`ocorrencia`** (DOC-01) | Aplicar soft-delete, começando por `seguro` (documento com valor probatório legal) |
| Falhas graves de base jurídica | ✅ Nenhuma encontrada — bases jurídicas corretamente não-consentimento | Nenhuma |
| Textos legais enganadores | ✅ Não enganadores, mas incompletos (22 gaps, ver Fase 2) | Ver abaixo |

## Fase 2 — Correções retroativas urgentes (equivalente a "antes do piloto", já em atraso)

| Item | Achado(s) | Ação |
|---|---|---|
| Política de Privacidade | PP-1 a PP-10 | Fechar os 10 gaps (identidade/contacto do responsável, reclamação à CNPD, Vercel Analytics, segurança, cookies, transferências, decisões automatizadas) |
| Termos de Utilização | TU-1 a TU-12 | Fechar os 12 gaps (identidade, propriedade intelectual, documentos carregados, pagamentos, lei aplicável/foro, RAL/ODR, legitimidade de representação ao criar condomínio) |
| Acordo de Tratamento de Dados (DPA) | RGPD-03, `LEGAL_DOCUMENTS_REGISTER.md` | ~~Redigir~~ **Modelo pronto** (`DPA_TEMPLATE.md`, 2026-07-22) — falta preencher e celebrar quando surgir o primeiro cliente administradora real (hoje não há nenhum) |
| Contrato SaaS | `LEGAL_DOCUMENTS_REGISTER.md` | Redigir documento comercial formal |
| Retenção | RGPD-04, RGPD-05, DOC-01 | Soft-delete adicional, expurgo automático de sessões/logs |
| Direitos | RGPD-02, RGPD-06 | Completar exportação de dados pessoais; registo formal de pedidos de oposição/limitação |
| Incidentes | — | Procedimento já desenhado (`DATA_BREACH_PROCEDURE.md`) — falta designar formalmente um responsável e comunicar aos subcontratantes a obrigação de notificação |
| Logs | AUDIT-01, AUDIT-02 | Auditar login/falhas de login/recuperação de conta e exportações |
| Exportação/cancelamento | RGPD-02 | Ver acima |
| Fluxos jurídicos essenciais | LEGAL-01 | ~~**Declaração de encargos/dívida (art. 1424º-A)**~~ **Resolvido 2026-07-22** — `/financas/declaracao-divida/[fracaoId]` |

## Fase 3 — Antes de expandir para mais condomínios/clientes (equivalente a "antes da produção", já ativo mas a reforçar)

| Item | Achado(s) | Ação |
|---|---|---|
| Assembleias | LEGAL-03, DOC-02 | Validar dia distinto entre convocatórias; considerar numeração sequencial de atas |
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
3. **Fechar gaps de Privacidade/Termos** (22 no total) — a maioria são adições de texto, não código. Próximo passo mais importante em aberto.
4. **Soft-delete em `seguro`** (parte de DOC-01) — esforço pequeno, mesmo padrão já usado em `movimento`.
5. **Bucket de ficheiros deixar de ser público** — depende de recriar o Blob store (ver nota operacional em `FUNCTIONAL_GAPS.md`), mais disruptivo.
6. Resto da Fase 2/3, depois Fase 4 por oportunidade.
