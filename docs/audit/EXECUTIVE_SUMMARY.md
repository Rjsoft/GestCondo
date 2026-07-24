# Resumo Executivo — Auditoria Jurídica, RGPD e de Conformidade — GestCondo

Data: 2026-07-22. Fecha a auditoria pedida em `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. **Auditoria técnica, não parecer jurídico.**

## 1. Resumo executivo

O GestCondo chega a esta auditoria numa maturidade bem acima do habitual para uma primeira revisão: já tem Política de Privacidade, Termos de Utilização, direitos dos titulares com autosserviço, `audit_log`, isolamento multi-tenant verificado, MFA, gestão financeira formal com balanço e seguro obrigatório. A auditoria encontrou **28 achados concretos** distribuídos por 6 fases, mas **nenhuma falha estrutural grave nova** — os problemas encontrados são, na sua maioria, lacunas de completude (documentos incompletos, obrigações da Lei 8/2022 ainda não refletidas) e não vulnerabilidades ou violações ativas, com uma exceção corrigida durante a própria auditoria (email transacional não configurado em produção).

**Contexto importante confirmado pelo utilizador**: embora a base de dados de produção já contenha dados reais de condóminos (importados de um documento de assembleia real), **o utilizador é hoje o único com conta/acesso à aplicação** — nenhum outro condómino real ainda se registou ou usa o GestCondo. Isto reduz a exposição prática imediata de vários achados (ex. RGPD-07, email transacional) a um único titular, mas não muda a prioridade de os corrigir — são precisamente os requisitos a fechar **antes** de outros condóminos reais se juntarem.

## 2. Nível geral de maturidade

**Alto para um produto pré-comercial.** Já tem modelo de DPA pronto (`DPA_TEMPLATE.md`) para quando surgir a primeira empresa administradora cliente — falta preencher os dados reais das partes e obter revisão jurídica antes de assinar, não é mais um documento em falta.

## 3. Riscos críticos

1. **(Resolvido durante a auditoria)** Email transacional não estava configurado em produção — verificação de conta, reset de password e convocatórias não chegavam a ninguém. Corrigido e verificado end-to-end.
2. **(Resolvido durante a auditoria, como modelo)** DPA — `docs/legal/DPA_TEMPLATE.md` criado; sem cliente administradora real ainda, por isso passa a P2 (reavaliar para P0 com o primeiro cliente).
3. **(Resolvido durante a auditoria)** Declaração de encargos/dívida (art. 1424º-A) implementada — `/financas/declaracao-divida/[fracaoId]`.
4. **(Resolvido durante a auditoria)** Bucket de ficheiros público — relevante também para RGPD, não só segurança. Corrigido em 2026-07-22 com um store privado dedicado e uma rota autenticada; confirmado que não havia ficheiros antigos por migrar.

## 4. Bloqueadores de produção

Nenhum bloqueador que impeça o funcionamento técnico. Bloqueador **comercial/legal** remanescente: Contrato SaaS em falta para expandir a clientes além do piloto atual (o DPA já tem modelo pronto, só falta um cliente real para o preencher).

## 5. Lacunas RGPD

10 achados (RGPD-01 a RGPD-10, `docs/audit/RGPD_AUDIT.md`) — destaque: Vercel Analytics não divulgado (corrigido parcialmente); exportação de dados pessoais e soft-delete (RGPD-02, RGPD-04) já resolvidos 2026-07-22; falta ainda expurgo automático de logs.

## 6. Lacunas jurídicas

6 achados (LEGAL-01 a LEGAL-06, `docs/audit/LEGAL_COMPLIANCE_AUDIT.md`) — o mais urgente (declaração de encargos/dívida, LEGAL-01) já **resolvido nesta sessão**; restam: sem ligação formal orçamento↔deliberação, gaps nas obrigações introduzidas pela Lei 8/2022 (prazo de execução de deliberações, três orçamentos para obras, informação semestral sobre processos).

## 7. Lacunas contratuais

16 documentos em falta de 24 considerados (`docs/legal/LEGAL_DOCUMENTS_REGISTER.md`) — o DPA já tem modelo (`DPA_TEMPLATE.md`); o mais urgente que resta é o Contrato SaaS; o resto é P2/P3.

## 8. Lacunas de segurança

Sem vulnerabilidades OWASP clássicas. O bucket de ficheiros público foi **resolvido em 2026-07-22**, ainda durante esta auditoria — store privado dedicado + rota autenticada (`SECURITY_AUDIT.md`, `docs/audit/REMEDIATION_PLAN.md`). Gap conhecido que permanece: `rate limit` storage não partilhado entre instâncias (`SECURITY_AUDIT.md` S5).

## 9. Documentação em falta

7 achados de documentos/rastreabilidade (DOC-01 a DOC-04, AUDIT-01 a AUDIT-03, `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md`); dos 22 gaps nos textos legais (PP-1 a PP-10, TU-1 a TU-12), 18 foram resolvidos 2026-07-22 — restam só os 4 que dependem de decisões do utilizador (identidade legal do operador, contacto de privacidade, foro, classificação B2B/B2C), marcados como `[A preencher]` nas próprias páginas publicadas.

## 10. Correções prioritárias

1. ~~Declaração de encargos/dívida (LEGAL-01)~~ — resolvido nesta sessão.
2. ~~DPA~~ — modelo pronto nesta sessão (`DPA_TEMPLATE.md`); falta só um cliente real para preencher e assinar.
3. Fechar gaps de Privacidade/Termos.
4. Soft-delete em `seguro`.
5. Bucket de ficheiros deixar de ser público.

Ver `docs/audit/REMEDIATION_PLAN.md` para o detalhe completo por fase.

## 11. Funcionalidades que devem ser bloqueadas

Nenhuma — não foi encontrada nenhuma funcionalidade que devesse ser desativada por risco imediato aos utilizadores.

## 12. Funcionalidades que exigem configuração jurídica antes de expandir

Onboarding multi-condomínio (exige preencher e assinar o `DPA_TEMPLATE.md` antes de uma segunda empresa administradora real o usar); geração de recibos (validade fiscal já analisada em sessão anterior, condomínios sem IVA estão isentos de faturação certificada).

## 13. Matérias que exigem parecer de advogado

Ver `docs/legal/LEGAL_RGPD_COMPLIANCE_HANDBOOK.md` secção 25 — 6 itens, incluindo a divergência sobre alteração de regulamento integrado no título constitutivo, o conteúdo do DPA, e a validação final da Política de Privacidade/Termos antes de mais utilizadores reais.

## 14. Matérias que exigem parecer de DPO

Confirmação formal das regiões de processamento dos subcontratantes (Neon/Resend/Vercel Blob), avaliação de interesse legítimo do Vercel Analytics, e revisão do DPIA screening se o produto escalar significativamente.

## 15. Plano de implementação

Ver `docs/audit/REMEDIATION_PLAN.md` — 4 fases, com nota de que as fases "antes do piloto"/"antes da produção" do prompt original já deveriam ter ocorrido, dado que o piloto real já está em produção; tratadas como correções retroativas urgentes, não preparação futura.

## 16. Checklist de aprovação para piloto (já em curso — validação retroativa)

- [x] Isolamento multi-tenant
- [x] Autenticação/MFA
- [x] Auditoria das escritas principais
- [x] Textos legais publicados (rascunho técnico)
- [x] Email transacional a funcionar (corrigido nesta auditoria)
- [x] Declaração de encargos/dívida (corrigido nesta auditoria)
- [x] Modelo de DPA pronto (só relevante assinar se/quando uma administradora externa aderir)

## 17. Checklist de aprovação para produção (expansão a mais clientes)

- [ ] DPA preenchido e celebrado com a empresa administradora cliente (modelo já pronto, `DPA_TEMPLATE.md`)
- [ ] Contrato SaaS formal
- [ ] Gaps de Privacidade/Termos fechados (22 itens)
- [ ] Bucket de ficheiros privado
- [ ] Soft-delete em `seguro`/`aviso`/`documento`/`ocorrencia`
- [ ] Parecer jurídico sobre os 6 itens da secção 25 do Caderno
- [ ] Confirmação de regiões de processamento dos subcontratantes

## Documentos produzidos por esta auditoria

`docs/audit/SYSTEM_DATA_MAP.md`, `RGPD_AUDIT.md`, `LEGAL_COMPLIANCE_AUDIT.md`, `DOCUMENT_TRACEABILITY_AUDIT.md`, `REMEDIATION_PLAN.md`, `EXECUTIVE_SUMMARY.md` (este ficheiro); `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md`, `DATA_SUBPROCESSORS_REGISTER.md`, `DATA_RETENTION_MATRIX.md`, `DATA_SUBJECT_RIGHTS_PROCEDURE.md`, `DATA_BREACH_PROCEDURE.md`, `DPIA_SCREENING.md`, `PRIVACY_POLICY_REVIEW.md`, `TERMS_OF_USE_REVIEW.md`, `MEETINGS_AND_VOTING_MATRIX.md`, `ADMINISTRATOR_DUTIES_MATRIX.md`, `LEGAL_DOCUMENTS_REGISTER.md`, `LEGAL_RGPD_COMPLIANCE_HANDBOOK.md`, `DPA_TEMPLATE.md`. Mais: `RAT.md` e `GDPR_CHECKLIST.md` atualizados no próprio local (decisão tomada no início da auditoria, para não duplicar informação).
