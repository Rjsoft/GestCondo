# Registo de Documentos Jurídicos Necessários — GestCondo

Data: 2026-07-22. Produzido na Fase F da auditoria (secção 10 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`). Identifica os documentos necessários para exploração comercial do GestCondo, o que já existe, e o que falta.

| Documento | Estado | Onde | Prioridade se em falta |
|---|---|---|---|
| Política de Privacidade | 🟡 Existe, rascunho técnico | `/privacidade`, revisão em `docs/legal/PRIVACY_POLICY_REVIEW.md` (10 gaps, Fase C) | P1 (fechar os gaps PP-1 a PP-10) |
| Termos de Utilização | 🟡 Existe, rascunho técnico | `/termos`, revisão em `docs/legal/TERMS_OF_USE_REVIEW.md` (12 gaps, Fase C) | P1 (fechar os gaps TU-1 a TU-12) |
| **Contrato SaaS** (entre operador e cliente — administradora ou condomínio direto) | ❌ **Em falta** | — | **P1** — necessário para formalizar o que os Termos de Utilização só descrevem em geral: objeto, preço (quando existir), SLA, obrigações específicas |
| **Acordo de Tratamento de Dados (DPA)** | ❌ **Em falta, agora ativamente necessário** | Análise de papéis em `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` (achado RGPD-03, Fase B) | **P0/P1** — o cenário que o exige (empresa administradora a gerir vários condomínios) já está em produção |
| Cláusulas de subcontratação (dentro do DPA) | ❌ Em falta | Depende do DPA acima | P1 (junto com o DPA) |
| Lista de subcontratantes | ✅ Feito | `RAT.md`, `docs/legal/DATA_SUBPROCESSORS_REGISTER.md` | — |
| Política de cookies | ❌ Em falta como documento próprio | Parcialmente coberta na revisão da Política de Privacidade (gap PP-6) | P2 — o GestCondo não usa cookies de rastreio, pelo que pode ser uma secção curta em vez de um documento separado |
| Tabela/matriz de conservação | ✅ Feito | `docs/legal/DATA_RETENTION_MATRIX.md` | — |
| Política de segurança | ❌ Em falta como documento formal | Conteúdo técnico já existe disperso em `SECURITY_AUDIT.md` | P2 — mais relevante quando houver clientes empresariais a pedir devido diligência |
| Política de acessos | ❌ Em falta como documento formal | Conteúdo técnico em `lib/perfis.ts`/`SECURITY_AUDIT.md` | P2 |
| Política de backups | ❌ Em falta | Depende de confirmar a política de backups da Neon (ver `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`, ação pendente) | P2 |
| Procedimento de incidentes | ✅ Feito | `docs/legal/DATA_BREACH_PROCEDURE.md` | — |
| Procedimento de direitos dos titulares | ✅ Feito | `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md` | — |
| Política de suporte | ❌ Em falta | — | P3 — sem equipa de suporte formal ainda (confirmado no Cenário 5 do `CONTROLLER_PROCESSOR_MATRIX.md`) |
| Política de exportação | 🟡 Parcial | A funcionalidade existe (`/os-meus-dados`), mas sem documento formal a explicar limites (ver RGPD-02 — exportação incompleta) | P2 |
| Política de eliminação | 🟡 Parcial | Comportamento implementado (soft-delete financeiro, `user.deleteUser`), sem documento formal a explicar exceções ao utilizador | P2 |
| Acordo de confidencialidade (NDA) | ❌ Em falta | — | P3 — só relevante para negociações com clientes empresariais específicos |
| Termos para utilizadores convidados | ❌ Em falta | Relevante para o fluxo de convite por código (onboarding multi-condomínio, 2026-07-22) | P2 |
| Termos para fornecedores | ❌ Em falta | O perfil `fornecedor` existe, mas sem termos próprios nem fluxo de atribuição (já em `FUNCTIONAL_GAPS.md`) | P3 — baixa urgência enquanto o fluxo de fornecedores não existir |
| Acordo de Nível de Serviço (SLA) | ❌ Em falta | — | P2 — mais relevante quando houver clientes pagantes |
| Plano de continuidade de negócio | ❌ Em falta | — | P3 |
| Plano de recuperação de desastre | ❌ Em falta | Depende de confirmar backups/replicação da Neon | P2 |
| Registo de Atividades de Tratamento (ROPA) | ✅ Feito | `RAT.md` | — |
| Avaliação de Impacto (DPIA) | ✅ Feito (conclusão: não necessária hoje) | `docs/legal/DPIA_SCREENING.md` | — |
| Avaliação de interesse legítimo | ❌ Em falta como documento formal | O Vercel Analytics (Cenário 4, `CONTROLLER_PROCESSOR_MATRIX.md`) é o único tratamento com base em interesse legítimo autónomo da plataforma — deveria ter um LIA (*Legitimate Interest Assessment*) curto | P2 |
| Informação aos condóminos sobre o DPA/subcontratação | ❌ Em falta | Depende do DPA acima existir primeiro | P2 |

## Resumo por urgência

### P0/P1 — bloqueadores comerciais reais (o cenário que os exige já está em produção)
1. **DPA** (Acordo de Tratamento de Dados) — entre o operador e qualquer empresa administradora que use a plataforma para vários condomínios.
2. **Contrato SaaS** — falta o documento que formaliza a relação comercial em si (os Termos de Utilização não substituem um contrato).
3. Fechar os gaps de `PRIVACY_POLICY_REVIEW.md` e `TERMS_OF_USE_REVIEW.md` (22 gaps no total, Fase C).

### P2 — importantes mas não bloqueadores imediatos
Política de cookies (curta), política de segurança/acessos/backups, política de exportação/eliminação (formalizar o que já existe tecnicamente), termos para convidados, SLA, plano de recuperação de desastre, avaliação de interesse legítimo (Vercel Analytics).

### P3 — só relevantes com escala/clientes específicos
NDA, termos para fornecedores, política de suporte, plano de continuidade.

## Nota final

Nenhum destes documentos é gerado automaticamente por esta auditoria — são todos **decisões contratuais/comerciais** que dependem do utilizador (nome da entidade, modelo de preços, SLA prometido). O papel desta auditoria é apontar exatamente quais faltam e porquê, não redigi-los sem essas decisões prévias (à exceção dos que já foram produzidos nas fases anteriores, que são de natureza técnica/interna, não comercial).
