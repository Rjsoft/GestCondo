# Roadmap — GestCondo

Data: 2026-07-06. Este roadmap assume o objetivo declarado: aplicação profissional multi-condomínio para o mercado português, usável por administrações de condomínio, condóminos, proprietários, inquilinos e empresas de administração externas.

## Estado de maturidade por peça

| Peça | Estado |
|---|---|
| Autenticação básica (email/password) | ✅ Pronto |
| Fluxo de aprovação de acesso | ✅ Pronto |
| CRUD de finanças | ✅ Resolvido 2026-07-07 a 2026-07-24 — orçamento anual, dívida por fração/mapa de saldos, recibo imprimível, mapa mensal de quotas, rateio por permilagem com isenção de elevador, juros de mora, reconciliação bancária, exportação CSV e relatório em PDF; exercícios financeiros e contas bancárias/caixa em produção desde 2026-07-24 (ver Fase 2, item 8). Falta rubricas no orçamento (hoje é valor global) e exportação `.xlsx` real, se vier a ser necessária. |
| CRUD de avisos | ✅ Pronto para o que se propõe (comunicação simples) |
| CRUD de ocorrências | 🟡 Parcial — falta anexos/fotos, fornecedores, aprovação de despesas |
| CRUD de frações | 🟡 Parcial — falta multi-condomínio, proprietário relacional, histórico |
| CRUD de condóminos + aprovação | 🟡 Parcial — falta perfis (proprietário/inquilino/fornecedor/auditor), âmbito por condomínio |
| Assembleias/atas | ✅ Resolvido 2026-07-09, **verificado em runtime 2026-07-21** — convocatória, ordem de trabalhos, presenças/procurações, quórum e votação por permilagem, ata imutável após aprovação; ciclo completo testado manualmente contra a BD Neon real. Falta anexos à ata, confirmação de leitura e videoconferência (ver `FUNCTIONAL_GAPS.md`) |
| Multi-condomínio / multi-tenant | ✅ Resolvido 2026-07-22 — schema e isolamento (2026-07-06) + fluxo de onboarding por código de convite/criação de condomínio novo. Falta só o modelo de "empresa de administração" (uma conta a gerir vários condomínios), ver Fase 5. |
| RGPD (textos legais, direitos do titular) | ✅ Resolvido 2026-07-09/21 — políticas `/privacidade` e `/termos` (rascunho técnico, falta revisão jurídica), RAT, `/os-meus-dados` (ver/corrigir/exportar/eliminar), prazos de retenção propostos. Ver Fase 3 e `PRE_CLIENTE_EXTERNO.md` para o que depende de terceiros. |
| Auditoria/log de alterações | ✅ Resolvido 2026-07-06 — `audit_log` + página `/auditoria` + soft-delete em `movimento` |
| Upload de ficheiros | ✅ Resolvido 2026-07-09, **verificado em runtime 2026-07-21** — Vercel Blob (`lib/storage.ts`), ligado a documentos, fotos de ocorrências e apólices de seguro; testado upload+eliminação real nos três pontos. Requer que o Blob store seja criado com acesso **Public** (um store Private não funciona e não pode ser convertido depois) |
| Notificações por email | ✅ Resolvido 2026-07-09 — reset de password/verificação, convocatória de assembleia, avisos importantes/urgentes e atualização de estado de ocorrências. Sem notificação push. |
| Exportação PDF/Excel | 🟡 Parcial — exportação CSV de movimentos, recibo e relatório de movimentos em PDF (via impressão do browser) feitos 2026-07-07/21; falta `.xlsx` real, se vier a ser necessário. |
| Testes automatizados | ✅ `vitest` + 67 testes unitários (permissões, formatação, juros, extrato, etc.) + teste de integração real de isolamento multi-tenant (`pnpm test:db`, contra a BD Neon do utilizador); faltam testes de autorização e2e via HTTP |
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
5. ✅ **Feito 2026-07-06** — Redesenhado o schema para multi-tenant: entidade `condominio`, `condominioId` em todas as tabelas de dados do condomínio, e âmbito de acesso por condomínio em todas as server actions e no dashboard. **Feito 2026-07-22** — fluxo de onboarding para um 2º (e seguintes) condomínio: código de convite por condomínio (gerado/regenerado em `/condominio`, admin), ou criação de um condomínio novo por qualquer conta sem `membro` ainda. Removido o comportamento antigo em que qualquer conta nova se juntava automaticamente ao primeiro condomínio alguma vez criado — risco real de segurança agora que há dados reais em produção. Testado em runtime (dev): dois condomínios distintos, isolamento confirmado, conta real do admin existente não afetada.
6. ✅ **Feito 2026-07-06** — Redesenhado o modelo de papéis para os 7 perfis pedidos (ver `FUNCTIONAL_GAPS.md` secção 8 e `SECURITY_AUDIT.md` S8), com âmbito por condomínio.
7. ✅ **Feito 2026-07-06** — Introduzida tabela e mecanismo de `audit_log`; eliminação de dados financeiros passou a soft-delete.
8. ✅ **Feito 2026-07-06** — Configurado envio de email transacional (reset de password, verificação de email) — falta só configurar uma `RESEND_API_KEY` real antes de produção (hoje cai em modo local/consola).
9. ✅ **Feito 2026-07-06** — `.env.example`, `.gitignore` corrigido, e cabeçalhos de segurança básicos (`SECURITY_AUDIT.md` S14).
10. ✅ Introduzir framework de testes — `vitest` + testes unitários de permissões e teste de integração de isolamento multi-tenant (`pnpm test:db`) feito 2026-07-06.

## Fase 2 — MVP funcional (utilizável por um condomínio real, um só administrador)

1. ✅ **Feito 2026-07-07 a 2026-07-21** — Gestão financeira formal: orçamento anual (valor global, sem rubricas), dívida por fração/mapa de saldos, recibo imprimível, exportação CSV, relatório de movimentos em PDF (`/financas/relatorio`, via impressão do browser), rateio automático de quotas por permilagem com isenção de elevador, juros de mora, reconciliação bancária (importação CSV + conciliação manual assistida). Falta apenas: exportação `.xlsx` real (hoje é CSV), se necessária.
2. ✅ **Feito 2026-07-09, verificado em runtime 2026-07-21** — Upload de ficheiros (documentos, fotos de ocorrências, apólice de seguro) via Vercel Blob. Store tem de ser criado com acesso Public.
3. ✅ **Feito 2026-07-07** — Distinção proprietário/inquilino (`membro.fracaoId`, liga um `membro` condomino ou inquilino à sua fração) e correção da exposição de contactos pessoais (`SECURITY_AUDIT.md` S13). **Feito 2026-07-21** — NIF do proprietário (`fracao.nif`) e visibilidade de compropriedade (`/fracoes` mostra todos os condóminos com conta ligados à mesma fração).
4. ✅ **Feito 2026-07-08** — Seguro obrigatório (apólice, seguradora, validade, alerta de expiração) e fundo de reserva (movimentos com `destino: "reserva"`, seguido à parte da conta corrente) como entidades geridas, não texto livre. **Feito 2026-07-23** — associação apólice↔frações cobertas (`seguro_fracao`), visível em `/financas` e `/fracoes`.
5. ✅ **Feito 2026-07-09** — Notificações por email para avisos importantes/urgentes e para atualização de estado de ocorrências.
6. ✅ **Feito 2026-07-09** — Autogestão de dados pessoais pelo condómino (`/os-meus-dados`: ver os seus dados, corrigir contacto), construído como parte da Fase 3 (RGPD).
7. ✅ **Feito 2026-07-21** — Confirmação antes de eliminar nas 7 ações destrutivas da aplicação (avisos, documentos, ocorrências, orçamentos, frações, seguros, movimentos), via `components/ui/confirm-dialog.tsx`. Paginação + pesquisa em avisos, documentos, ocorrências, auditoria e movimentos financeiros (`/financas`, tab "Movimentos" — cartões de totais e exportação CSV continuam sobre o conjunto completo, não paginado); pesquisa (sem paginação, por serem conjuntos tipicamente pequenos por condomínio) em frações e condóminos.

    **Incidente de produção detetado e corrigido 2026-07-21** (não é dívida em aberto, registado para referência futura): a migração `drizzle/0012_simple_king_bedlam.sql` (tabela `extratoBancario`, reconciliação bancária) tinha sido aplicada à BD de desenvolvimento mas nunca à de produção, porque não existe nenhum passo automático de migração no deploy — derrubava por completo `/financas` em produção (erro 500, `relation "extratoBancario" does not exist"`). Corrigido aplicando a migração em falta à BD de produção (Neon, branch `production`). Ver `TECHNICAL_DEBT.md` D8 para o risco estrutural subjacente (recorrerá em qualquer migração futura, se não for automatizado).

8. ✅ **Feito 2026-07-24, em produção desde 2026-07-24** — Modelo contabilístico de origem (Fase A.1 de `docs/product/MBD_GEST_GAP_ANALYSIS.md`): exercício financeiro (`exercicioFinanceiro`) e conta bancária/caixa (`contaFinanceira`) como entidades próprias, com saldo inicial por exercício, fecho/reabertura auditados, transporte de saldo entre exercícios e associação em massa de movimentos antigos — separador "Exercícios e contas" em `/financas`, com assistente de primeira configuração. Ver `FUNCTIONAL_GAPS.md` para o detalhe técnico.

    **Promoção para produção concluída em 2026-07-24**: migração `drizzle/0024_slim_human_fly.sql` aplicada à BD de produção (drift confirmado a zero antes e depois, totais financeiros inalterados), PR #1 mergido para `main` e deploy concluído. Verificado em produção que as páginas principais carregam sem erros e sem regressões, e a funcionalidade foi usada com dados reais (exercício "2026" criado e registado em `audit_log`). **Validação em `docs/CHECKLIST_TESTE_MANUAL.md`**: 51 de 81 casos passaram, 26 bloqueados e 4 não executados, sem falhas confirmadas. Continuam pendentes: perfis não-Admin, NVDA, viewport/zoom reais e testes com utilizador não treinado.

    **Lacunas de processo desta migração** (a corrigir antes da próxima, não reabrem a Fase A.1): não houve janela de intervenção acordada, nem snapshot explícito antes de escrever, nem plano de rollback testado. Ver `TECHNICAL_DEBT.md` D8.

Ver `MVP_PLAN.md` para o detalhe desta fase.

## Fase 3 — RGPD, segurança e auditoria (pode correr em paralelo com a Fase 2, mas tem de fechar antes do primeiro cliente real)

1. ✅ **Feito 2026-07-09** — Política de Privacidade (`/privacidade`), Termos de Utilização (`/termos`), aviso de finalidade no registo (checkbox em `components/auth-form.tsx`). Textos marcados como rascunho técnico — precisam de revisão jurídica antes de utilizadores reais.
2. ✅ **Feito 2026-07-09** — Registo de Atividades de Tratamento (`RAT.md`, documento interno).
3. ✅ **Feito 2026-07-09** — Direitos do titular: `/os-meus-dados` (ver, corrigir nome/telefone, exportar em JSON, eliminar conta com confirmação por email via `user.deleteUser` do better-auth).
4. ✅ **Feito 2026-07-09** — Prazos de retenção propostos por tipo de dado (`GDPR_CHECKLIST.md` secção 5) — ainda não validados por jurista/contabilista nem automatizados (sem expurgo automático).
5. ✅ **Feito 2026-07-21** — Rate limiting explícito no better-auth (`lib/auth.ts`, storage em memória — não partilhado entre instâncias, ver `TECHNICAL_DEBT.md`). MFA/TOTP + códigos de recuperação (plugin `two-factor`, ativação opcional por qualquer membro em `/os-meus-dados`, não imposta a administradores nesta versão) e verificação de password comprometida (plugin `haveIBeenPwned`) — ambos plugins nativos do better-auth já instalado, sem dependência nova. Testado em runtime com conta descartável: ativação, login com TOTP, login com código de recuperação, desativação.
6. Modelo de Acordo de Subcontratação (DPA) para empresas de administração clientes — adiado até existir o fluxo de onboarding multi-condomínio.
7. Auditoria de segurança externa (pentest ligeiro) antes do primeiro cliente pagante — decisão/ação do utilizador, fora do que pode ser feito nesta ferramenta.

Ver `SECURITY_AUDIT.md` e `GDPR_CHECKLIST.md`.

## Fase 4 — Funcionalidades avançadas (diferenciação comercial)

1. Módulo de Assembleias completo: convocatórias, ordem de trabalhos, presenças, procurações, quórum, votação por permilagem, atas, anexos, histórico.
2. Penalizações fixas configuráveis (distintas dos juros proporcionais já implementados), declarações de dívida. Reconciliação bancária e juros de mora já feitos — ver `FUNCTIONAL_GAPS.md` secção 3.
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
10. ✅ Construir gestão financeira formal — feito 2026-07-07: orçamento anual (valor global), dívida por fração/mapa de saldos, recibo imprimível, exportação CSV (ver `FUNCTIONAL_GAPS.md` secção 3). **Feito 2026-07-21** — geração automática de 12 quotas mensais por fração a partir do orçamento, rateadas por permilagem (`lib/rateio.ts`, `app/actions/orcamentos.ts:gerarQuotasOrcamento`), com isenção configurável da parcela do elevador por fração (comum para o rés-do-chão em Portugal); juros de mora sobre quotas em atraso, taxa introduzida pelo administrador (`lib/juros.ts`, `app/actions/financas.ts:lancarJurosMora`); reconciliação bancária por importação de extrato CSV com mapeamento de colunas e conciliação manual assistida por sugestões automáticas (`lib/extrato.ts`, `app/actions/extrato.ts`). Testado em runtime contra a BD Neon de desenvolvimento, incluindo isenção de elevador, lançamento de juros e importação/conciliação/desfazer/ignorar de um extrato fictício. **Feito 2026-07-21** — relatório de movimentos em PDF (`/financas/relatorio`, botão "Relatório (PDF)" na tab Movimentos, mesmo padrão de impressão do recibo — sem biblioteca nova), verificado em runtime. Falta apenas: exportação `.xlsx` real (hoje é CSV), se necessária.
11. ✅ Construir módulo de Assembleias — feito 2026-07-09: convocatória (com email automático aos condóminos aprovados), ordem de trabalhos, presenças/procurações, quórum e votação por permilagem, deliberações, ata imutável após aprovação. **Verificado em runtime 2026-07-21**: ciclo completo testado manualmente contra a BD Neon real, incluindo a imutabilidade após aprovação da ata. Ver `FUNCTIONAL_GAPS.md` secção 2 para o detalhe e o que ficou fora (anexos à ata, confirmação de leitura, videoconferência).
12. ✅ Introduzir testes cobrindo isolamento multi-tenant e permissões — feito 2026-07-06 (`lib/perfis.test.ts` para permissões; `lib/db/tenant-isolation.dbtest.ts` para isolamento entre condomínios, corrido contra uma BD Neon real dentro de uma transação sempre revertida).

Este roadmap é sequencial nas primeiras 6–7 tarefas (cada uma depende ou é fortemente facilitada pela anterior); a partir daí, as tarefas de Fase 2–4 podem ser paralelizadas por equipa/sprint.
