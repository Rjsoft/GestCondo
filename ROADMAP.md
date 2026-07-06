# Roadmap — GestCondo

Data: 2026-07-06. Este roadmap assume o objetivo declarado: aplicação profissional multi-condomínio para o mercado português, usável por administrações de condomínio, condóminos, proprietários, inquilinos e empresas de administração externas.

## Estado de maturidade por peça

| Peça | Estado |
|---|---|
| Autenticação básica (email/password) | ✅ Pronto |
| Fluxo de aprovação de acesso | ✅ Pronto |
| CRUD de finanças (lançamentos simples) | 🟡 Parcial — falta orçamento, dívida por fração, recibos |
| CRUD de avisos | ✅ Pronto para o que se propõe (comunicação simples) |
| CRUD de ocorrências | 🟡 Parcial — falta anexos/fotos, fornecedores, aprovação de despesas |
| CRUD de frações | 🟡 Parcial — falta multi-condomínio, proprietário relacional, histórico |
| CRUD de condóminos + aprovação | 🟡 Parcial — falta perfis (proprietário/inquilino/fornecedor/auditor), âmbito por condomínio |
| Assembleias/atas | ❌ Inexistente (0%) |
| Multi-condomínio / multi-tenant | 🟡 Schema e isolamento de queries resolvidos 2026-07-06; falta o fluxo de produto (criar/convidar para um 2º condomínio) |
| RGPD (textos legais, direitos do titular) | ❌ Inexistente (0%) |
| Auditoria/log de alterações | ❌ Inexistente (0%) |
| Upload de ficheiros | ❌ Inexistente (0%) |
| Notificações por email | ❌ Inexistente (0%) — inclui recuperação de password |
| Exportação PDF/Excel | ❌ Inexistente (0%) |
| Testes automatizados | ❌ Inexistente (0%) |
| Controlo de versões / CI | ❌ Inexistente (0%) |

Não há funcionalidades "mockadas" ou simuladas no sentido de existir uma fachada enganosa — o que não existe simplesmente não está no código. Isto é preferível a ter simulações escondidas, mas significa que a distância até "pronto para uso real" é maior do que a app aparenta ao navegar por ela.

## Recomendação

**Não reconstruir de raiz.** A stack e o padrão de código são sólidos e o esforço já investido em UI/autorização é reaproveitável quase na totalidade.

**Não é um "refatorar parcialmente" cosmético.** É necessária uma **refatoração estrutural do modelo de dados (multi-tenant) e da introdução de fundamentos de engenharia (git, testes, migrações, auditoria) antes** de continuar a acrescentar módulos funcionais — caso contrário, cada módulo novo (Assembleias, financeiro formal) terá de ser reescrito outra vez quando o multi-tenant for introduzido depois.

**Veredito:** continuar sobre a base atual, com a **Fase 1 obrigatória e não negociável** antes de qualquer nova funcionalidade voltada para o utilizador final.

---

## Fase 1 — Estabilização técnica (fundação, antes de qualquer nova feature de produto)

1. ✅ **Feito 2026-07-06** — Inicializar repositório git; primeiro commit do estado atual (`0b9154e`, branch `main`).
2. Configurar CI mínimo (lint + typecheck + build) — mesmo que corra só localmente para já.
3. ✅ **Feito 2026-07-06** — Corrigido `pnpm lint` (T1) e os 14 erros de tipo pré-existentes de `@base-ui/react` (T2), com `ignoreBuildErrors` removido de `next.config.mjs`. Ver `TECHNICAL_DEBT.md`.
4. ✅ Introduzir `drizzle-kit` com migrações versionadas — feito 2026-07-06 (ver `TECHNICAL_DEBT.md` T4; a migração gerada é uma *baseline*, ler a nota sobre BDs já existentes antes de aplicar).
5. ✅ **Feito 2026-07-06** — Redesenhado o schema para multi-tenant: entidade `condominio`, `condominioId` em todas as tabelas de dados do condomínio, e âmbito de acesso por condomínio em todas as server actions e no dashboard. Falta ainda o fluxo de produto para criar/convidar para um segundo condomínio (ver `FUNCTIONAL_GAPS.md`).
6. Redesenhar o modelo de papéis para os 7 perfis pedidos (ver `FUNCTIONAL_GAPS.md` secção 8), com âmbito por condomínio (um utilizador pode ter papéis diferentes em condomínios diferentes).
7. Introduzir tabela e mecanismo de `audit_log`; mudar eliminações de dados financeiros para soft-delete.
8. Configurar envio de email transacional (mínimo: reset de password, verificação de email).
9. Adicionar `.env.example`, corrigir `.gitignore`, cabeçalhos de segurança básicos.
10. Introduzir framework de testes e cobrir, no mínimo, autorização/isolamento entre condomínios (ver `MVP_PLAN.md`).

## Fase 2 — MVP funcional (utilizável por um condomínio real, um só administrador)

1. Gestão financeira formal: orçamento anual, dívida por fração/condómino, recibos, exportação PDF/Excel, mapa de saldos.
2. Upload de ficheiros com controlo de acesso (documentos, faturas, fotos de ocorrências).
3. Distinção proprietário/inquilino e correção da exposição de contactos pessoais.
4. Seguro obrigatório e fundo de reserva como entidades geridas (não texto livre).
5. Notificações por email para avisos importantes e novas ocorrências.
6. Autogestão de dados pessoais pelo condómino (ver os seus dados, corrigir contacto).
7. Confirmação antes de ações destrutivas na UI; paginação/pesquisa nas listagens.

Ver `MVP_PLAN.md` para o detalhe desta fase.

## Fase 3 — RGPD, segurança e auditoria (pode correr em paralelo com a Fase 2, mas tem de fechar antes do primeiro cliente real)

1. Política de Privacidade, Termos de Utilização, aviso de finalidade no registo.
2. Registo de Atividades de Tratamento (documento interno).
3. Direitos do titular: exportação, eliminação de conta, retificação self-service.
4. Política de retenção por tipo de dado.
5. MFA para administradores, rate limiting explícito, política de password no servidor.
6. Modelo de Acordo de Subcontratação (DPA) para empresas de administração clientes.
7. Auditoria de segurança externa (pentest ligeiro) antes do primeiro cliente pagante.

Ver `SECURITY_AUDIT.md` e `GDPR_CHECKLIST.md`.

## Fase 4 — Funcionalidades avançadas (diferenciação comercial)

1. Módulo de Assembleias completo: convocatórias, ordem de trabalhos, presenças, procurações, quórum, votação por permilagem, atas, anexos, histórico.
2. Reconciliação bancária, juros/penalizações configuráveis, declarações de dívida.
3. Gestão de fornecedores, orçamentos de obra, fluxo de aprovação de despesas.
4. Mensagens internas, confirmação de leitura de convocatórias/avisos.
5. Versionamento de documentos, categorização avançada (faturas com fornecedor/NIF/valor).
6. Histórico de titularidade de frações, representantes legais.

## Fase 5 — Preparação para produção/comercialização

1. Perfil Super Admin + Empresa de administração operacionais, com onboarding de novos condomínios/clientes.
2. Faturação do próprio SaaS (se aplicável ao modelo de negócio).
3. Backups verificados, plano de recuperação de desastre documentado e testado.
4. Monitorização/observabilidade (erros, performance, disponibilidade).
5. SLA e suporte definidos.
6. Auditoria de segurança/RGPD externa formal antes do lançamento comercial amplo.

---

## Lista concreta de próximos passos (ordem de execução recomendada)

1. ✅ `git init` + primeiro commit — feito 2026-07-06.
2. ✅ Corrigir `pnpm lint` e os erros de tipo de `@base-ui/react`; remover `ignoreBuildErrors` — feito 2026-07-06.
3. ✅ Desenhar e implementar o schema multi-tenant (`condominio` + `condominioId`) — feito 2026-07-06.
4. Redesenhar o modelo de papéis (7 perfis, com âmbito por condomínio).
5. ✅ Introduzir `drizzle-kit` com migrações — feito 2026-07-06.
6. Implementar `audit_log` + soft-delete nas eliminações de dados financeiros.
7. Configurar provedor de email + reset de password + verificação de email.
8. Escrever Política de Privacidade/Termos e mostrar aviso de finalidade no registo.
9. Implementar upload de ficheiros com controlo de acesso.
10. Construir gestão financeira formal (orçamento, dívida por fração, recibos, exportação).
11. Construir módulo de Assembleias (o maior módulo em falta, tratar como projeto próprio dentro do roadmap).
12. Introduzir testes automatizados cobrindo isolamento multi-tenant e permissões (o mais crítico de tudo para não regredir em segurança à medida que o produto cresce).

Este roadmap é sequencial nas primeiras 6–7 tarefas (cada uma depende ou é fortemente facilitada pela anterior); a partir daí, as tarefas de Fase 2–4 podem ser paralelizadas por equipa/sprint.
