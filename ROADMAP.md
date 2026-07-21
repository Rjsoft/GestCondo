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
| Assembleias/atas | ✅ Resolvido 2026-07-09, **verificado em runtime 2026-07-21** — convocatória, ordem de trabalhos, presenças/procurações, quórum e votação por permilagem, ata imutável após aprovação; ciclo completo testado manualmente contra a BD Neon real. Falta anexos à ata, confirmação de leitura e videoconferência (ver `FUNCTIONAL_GAPS.md`) |
| Multi-condomínio / multi-tenant | 🟡 Schema e isolamento de queries resolvidos 2026-07-06; falta o fluxo de produto (criar/convidar para um 2º condomínio) |
| RGPD (textos legais, direitos do titular) | ❌ Inexistente (0%) |
| Auditoria/log de alterações | ✅ Resolvido 2026-07-06 — `audit_log` + página `/auditoria` + soft-delete em `movimento` |
| Upload de ficheiros | ✅ Resolvido 2026-07-09, **verificado em runtime 2026-07-21** — Vercel Blob (`lib/storage.ts`), ligado a documentos, fotos de ocorrências e apólices de seguro; testado upload+eliminação real nos três pontos. Requer que o Blob store seja criado com acesso **Public** (um store Private não funciona e não pode ser convertido depois) |
| Notificações por email | ✅ Resolvido 2026-07-09 — reset de password/verificação, convocatória de assembleia, avisos importantes/urgentes e atualização de estado de ocorrências. Sem notificação push. |
| Exportação PDF/Excel | ❌ Inexistente (0%) |
| Testes automatizados | ✅ `vitest` + 38 testes unitários (permissões, formatação) + teste de integração real de isolamento multi-tenant (`pnpm test:db`, contra a BD Neon do utilizador) desde 2026-07-06; faltam testes de autorização e2e via HTTP |
| Controlo de versões / CI | ✅ Git desde 2026-07-06; `.github/workflows/ci.yml` criado 2026-07-06 (só corre quando/se for enviado para o GitHub) |

Não há funcionalidades "mockadas" ou simuladas no sentido de existir uma fachada enganosa — o que não existe simplesmente não está no código. Isto é preferível a ter simulações escondidas, mas significa que a distância até "pronto para uso real" é maior do que a app aparenta ao navegar por ela.

## Recomendação

**Não reconstruir de raiz.** A stack e o padrão de código são sólidos e o esforço já investido em UI/autorização é reaproveitável quase na totalidade.

**Não é um "refatorar parcialmente" cosmético.** É necessária uma **refatoração estrutural do modelo de dados (multi-tenant) e da introdução de fundamentos de engenharia (git, testes, migrações, auditoria) antes** de continuar a acrescentar módulos funcionais — caso contrário, cada módulo novo (Assembleias, financeiro formal) terá de ser reescrito outra vez quando o multi-tenant for introduzido depois.

**Veredito:** continuar sobre a base atual, com a **Fase 1 obrigatória e não negociável** antes de qualquer nova funcionalidade voltada para o utilizador final.

---

## Fase 1 — Estabilização técnica (fundação, antes de qualquer nova feature de produto)

**Estado em 2026-07-06: fechada.** Todos os 10 itens abaixo estão feitos, incluindo o teste de isolamento multi-tenant (item 12 da lista de próximos passos), depois de o utilizador ter ligado a aplicação a uma base de dados PostgreSQL real (Neon). Ao ligar essa BD pela primeira vez, foram encontrados e corrigidos dois bugs reais só visíveis com uma BD real: uma condição de corrida no bootstrap do primeiro condomínio, e uma asserção não-nula insegura que fazia as páginas rebentar quando a sessão expirava a meio do pedido (ver `SECURITY_AUDIT.md` S10 e commits `d862aed`/`35cadc1`).

1. ✅ **Feito 2026-07-06** — Inicializar repositório git; primeiro commit do estado atual (`0b9154e`, branch `main`).
2. ✅ **Feito 2026-07-06** — Configurado CI mínimo (`.github/workflows/ci.yml`: lint, typecheck, testes, build). Só corre de facto quando/se o repositório for enviado para o GitHub.
3. ✅ **Feito 2026-07-06** — Corrigido `pnpm lint` (T1) e os 14 erros de tipo pré-existentes de `@base-ui/react` (T2), com `ignoreBuildErrors` removido de `next.config.mjs`. Ver `TECHNICAL_DEBT.md`.
4. ✅ Introduzir `drizzle-kit` com migrações versionadas — feito 2026-07-06 (ver `TECHNICAL_DEBT.md` T4; a migração gerada é uma *baseline*, ler a nota sobre BDs já existentes antes de aplicar).
5. ✅ **Feito 2026-07-06** — Redesenhado o schema para multi-tenant: entidade `condominio`, `condominioId` em todas as tabelas de dados do condomínio, e âmbito de acesso por condomínio em todas as server actions e no dashboard. Falta ainda o fluxo de produto para criar/convidar para um segundo condomínio (ver `FUNCTIONAL_GAPS.md`).
6. ✅ **Feito 2026-07-06** — Redesenhado o modelo de papéis para os 7 perfis pedidos (ver `FUNCTIONAL_GAPS.md` secção 8 e `SECURITY_AUDIT.md` S8), com âmbito por condomínio.
7. ✅ **Feito 2026-07-06** — Introduzida tabela e mecanismo de `audit_log`; eliminação de dados financeiros passou a soft-delete.
8. ✅ **Feito 2026-07-06** — Configurado envio de email transacional (reset de password, verificação de email) — falta só configurar uma `RESEND_API_KEY` real antes de produção (hoje cai em modo local/consola).
9. ✅ **Feito 2026-07-06** — `.env.example`, `.gitignore` corrigido, e cabeçalhos de segurança básicos (`SECURITY_AUDIT.md` S14).
10. ✅ Introduzir framework de testes — `vitest` + testes unitários de permissões e teste de integração de isolamento multi-tenant (`pnpm test:db`) feito 2026-07-06.

## Fase 2 — MVP funcional (utilizável por um condomínio real, um só administrador)

1. 🟡 **Em curso desde 2026-07-07** — Gestão financeira formal: orçamento anual (valor global, sem rubricas), dívida por fração/mapa de saldos ✅, recibo imprimível ✅, exportação CSV ✅ (não `.xlsx`/PDF real), rateio automático de quotas por permilagem com isenção de elevador ✅ **(2026-07-21)**. Falta: juros, reconciliação bancária, exportação `.xlsx`/PDF real.
2. ✅ **Feito 2026-07-09, verificado em runtime 2026-07-21** — Upload de ficheiros (documentos, fotos de ocorrências, apólice de seguro) via Vercel Blob. Store tem de ser criado com acesso Public.
3. ✅ **Feito 2026-07-07** — Distinção proprietário/inquilino (`membro.fracaoId`, liga um `membro` condomino ou inquilino à sua fração) e correção da exposição de contactos pessoais (`SECURITY_AUDIT.md` S13).
4. ✅ **Feito 2026-07-08** — Seguro obrigatório (apólice, seguradora, validade, alerta de expiração) e fundo de reserva (movimentos com `destino: "reserva"`, seguido à parte da conta corrente) como entidades geridas, não texto livre.
5. ✅ **Feito 2026-07-09** — Notificações por email para avisos importantes/urgentes e para atualização de estado de ocorrências.
6. ✅ **Feito 2026-07-09** — Autogestão de dados pessoais pelo condómino (`/os-meus-dados`: ver os seus dados, corrigir contacto), construído como parte da Fase 3 (RGPD).
7. Confirmação antes de ações destrutivas na UI; paginação/pesquisa nas listagens.

Ver `MVP_PLAN.md` para o detalhe desta fase.

## Fase 3 — RGPD, segurança e auditoria (pode correr em paralelo com a Fase 2, mas tem de fechar antes do primeiro cliente real)

1. ✅ **Feito 2026-07-09** — Política de Privacidade (`/privacidade`), Termos de Utilização (`/termos`), aviso de finalidade no registo (checkbox em `components/auth-form.tsx`). Textos marcados como rascunho técnico — precisam de revisão jurídica antes de utilizadores reais.
2. ✅ **Feito 2026-07-09** — Registo de Atividades de Tratamento (`RAT.md`, documento interno).
3. ✅ **Feito 2026-07-09** — Direitos do titular: `/os-meus-dados` (ver, corrigir nome/telefone, exportar em JSON, eliminar conta com confirmação por email via `user.deleteUser` do better-auth).
4. ✅ **Feito 2026-07-09** — Prazos de retenção propostos por tipo de dado (`GDPR_CHECKLIST.md` secção 5) — ainda não validados por jurista/contabilista nem automatizados (sem expurgo automático).
5. 🟡 **Parcial 2026-07-09** — Rate limiting explícito no better-auth feito (`lib/auth.ts`, storage em memória — não partilhado entre instâncias); MFA para administradores e política de password reforçada (verificação de password comprometida) continuam por fazer, ficam para uma sessão dedicada.
6. Modelo de Acordo de Subcontratação (DPA) para empresas de administração clientes — adiado até existir o fluxo de onboarding multi-condomínio.
7. Auditoria de segurança externa (pentest ligeiro) antes do primeiro cliente pagante — decisão/ação do utilizador, fora do que pode ser feito nesta ferramenta.

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
4. ✅ Redesenhar o modelo de papéis (7 perfis, com âmbito por condomínio) — feito 2026-07-06.
5. ✅ Introduzir `drizzle-kit` com migrações — feito 2026-07-06.
6. ✅ Implementar `audit_log` + soft-delete nas eliminações de dados financeiros — feito 2026-07-06.
7. ✅ Configurar provedor de email + reset de password + verificação de email — feito 2026-07-06 (falta `RESEND_API_KEY` real antes de produção).
7b. ✅ CI mínimo (`.github/workflows/ci.yml`) e cabeçalhos de segurança básicos — feito 2026-07-06.
7c. ✅ Testes automatizados — `vitest` + 38 testes unitários de permissões, mais o teste de integração de isolamento multi-tenant (item 12) feito 2026-07-06 contra a BD Neon real do utilizador.
8. Escrever Política de Privacidade/Termos e mostrar aviso de finalidade no registo.
9. ✅ Implementar upload de ficheiros com controlo de acesso — feito 2026-07-09 (Vercel Blob, documentos/ocorrências/seguro). **Verificado em runtime 2026-07-21** com um `BLOB_READ_WRITE_TOKEN` real: upload, acesso público ao ficheiro e eliminação em cascata confirmados nos três pontos de uso. Descoberto e corrigido nesse teste: o Blob store tem de ser criado com acesso Public (um store Private falha e não pode ser convertido depois de criado).
10. 🟡 Construir gestão financeira formal — feito 2026-07-07: orçamento anual (valor global), dívida por fração/mapa de saldos, recibo imprimível, exportação CSV (ver `FUNCTIONAL_GAPS.md` secção 3). **Feito 2026-07-21** — geração automática de 12 quotas mensais por fração a partir do orçamento, rateadas por permilagem (`lib/rateio.ts`, `app/actions/orcamentos.ts:gerarQuotasOrcamento`), com isenção configurável da parcela do elevador por fração (comum para o rés-do-chão em Portugal). Testado em runtime contra a BD Neon real, incluindo o caso de isenção. Falta: juros/penalizações, reconciliação bancária, exportação `.xlsx`/PDF real.
11. ✅ Construir módulo de Assembleias — feito 2026-07-09: convocatória (com email automático aos condóminos aprovados), ordem de trabalhos, presenças/procurações, quórum e votação por permilagem, deliberações, ata imutável após aprovação. **Verificado em runtime 2026-07-21**: ciclo completo testado manualmente contra a BD Neon real, incluindo a imutabilidade após aprovação da ata. Ver `FUNCTIONAL_GAPS.md` secção 2 para o detalhe e o que ficou fora (anexos à ata, confirmação de leitura, videoconferência).
12. ✅ Introduzir testes cobrindo isolamento multi-tenant e permissões — feito 2026-07-06 (`lib/perfis.test.ts` para permissões; `lib/db/tenant-isolation.dbtest.ts` para isolamento entre condomínios, corrido contra uma BD Neon real dentro de uma transação sempre revertida).

Este roadmap é sequencial nas primeiras 6–7 tarefas (cada uma depende ou é fortemente facilitada pela anterior); a partir daí, as tarefas de Fase 2–4 podem ser paralelizadas por equipa/sprint.
