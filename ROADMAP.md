# Roadmap — GestCondo

Data: 2026-07-06. Este roadmap assume o objetivo declarado: aplicação profissional multi-condomínio para o mercado português, usável por administrações de condomínio, condóminos, proprietários, inquilinos e empresas de administração externas.

## Estado de maturidade por peça

| Peça | Estado |
|---|---|
| Autenticação (email/password + MFA) | ✅ Resolvido 2026-07-06/21 — email/password via better-auth, e **desde 2026-07-21** MFA/TOTP com códigos de recuperação, rate limiting explícito e verificação de password comprometida (`haveIBeenPwned`), testados em runtime. O MFA é de ativação opcional, **não imposto a administradores**, e o rate limiting usa storage em memória, não partilhado entre instâncias (ver Fase 3 item 5 e `TECHNICAL_DEBT.md`) |
| Fluxo de aprovação de acesso | ✅ Pronto |
| CRUD de finanças | ✅ Resolvido 2026-07-07 a 2026-07-24 — orçamento anual, dívida por fração/mapa de saldos, recibo imprimível, mapa mensal de quotas, rateio por permilagem com isenção de elevador, juros de mora, reconciliação bancária, exportação CSV e relatório em PDF; exercícios financeiros e contas bancárias/caixa em produção desde 2026-07-24 (ver Fase 2, item 8). Documentos de fornecedor com pagamentos parciais e rubricas orçamentais (orçado vs. real) implementados 2026-07-24 (Fase A.2, ver Fase 2, item 9), **em produção desde 2026-07-25** (migrações `drizzle/0025_charming_epoch.sql`/`0026_great_sabretooth.sql` aplicadas e verificadas — schema confirmado, `db:check-drift` OK). Quotas extraordinárias ligadas a deliberação de assembleia e balanço patrimonial (Ativo/Passivo/Situação Líquida) implementados 2026-07-25 (Fase B, ver Fase 2, item 10), **em produção desde 2026-07-25** (aplicado de emergência após incidente de deploy — ver item 10 e `TECHNICAL_DEBT.md` D8). **2026-07-30**: critério de rateio passou a ser configurável por condomínio (`condominio.criterioRateio` — permilagem, regra geral, ou partes iguais nos termos do art. 1424º n.º2 CC), aplicado a quotas mensais e a divisão de despesas extraordinárias; migração `0054` aplicada em dev e em produção 2026-07-30 (`db:check-drift` OK, snapshot manual criado antes — ver `docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md`); código ainda por commitar/deploy nesta data, coluna nova em produção com omissão `'permilagem'` (compatível com o código atual). Falta exportação `.xlsx` real, se vier a ser necessária. |
| CRUD de avisos | ✅ Pronto para o que se propõe (comunicação simples) |
| CRUD de ocorrências | ✅ Resolvido — fotos anexadas 2026-07-09 (`ocorrencia.fotoUrl`, via Vercel Blob); atribuição a um fornecedor 2026-07-26 (`ocorrencia.fornecedorId`, seletor visível ao admin, testado em runtime); fluxo de aprovação de despesas 2026-07-27, **em produção desde 2026-07-27** (`movimento.requerAprovacao` + `movimento.assembleiaPontoId`, migração `0042`; obras urgentes via `movimento.urgente`/`justificacaoUrgencia`, art. 1427º CC — informativo, nunca bloqueia o lançamento). Ver `FUNCTIONAL_GAPS.md` secção 4, hoje inteiramente ✅ |
| CRUD de frações | 🟡 Parcial — multi-condomínio resolvido 2026-07-06/22 (ver linha própria); falta proprietário relacional (`fracao.proprietario` continua a ser texto livre, sem ligação a uma entidade pessoa). **Correção 2026-08-24**: esta linha dizia também que faltava o histórico de titularidade — era falso desde 2026-07-26/27. Existe: `atualizarFracao()` regista a mudança de proprietário no `audit_log`, e a transmissão de fração tem tabela própria (`fracaoTransmissao`, migração `0047`, em produção desde 2026-07-27) com data de escritura e decisão sobre o saldo em dívida — ver `FUNCTIONAL_GAPS.md` secção 1 |
| CRUD de condóminos + aprovação | ✅ Resolvido 2026-07-06 — os 7 perfis (`membro.perfil`, ver `lib/perfis.ts`) e o âmbito por condomínio estão implementados desde a Fase 1 (itens 5 e 6). **Correção 2026-08-24**: esta linha dizia que faltavam representantes legais — era falso. `fracao.representanteLegal` e `fracao.representanteLegalContacto` existem no schema e têm campos em "Nova fração" e "Editar fração" desde antes desta data. O que continua por fazer é um modelo de representação mais rico (procurador com conta própria e poderes delegados), não o registo do nome |
| Assembleias/atas | ✅ Resolvido 2026-07-09, **verificado em runtime 2026-07-21** — convocatória, ordem de trabalhos, presenças/procurações, quórum e votação por permilagem, ata imutável após aprovação; ciclo completo testado manualmente contra a BD Neon real. **2026-07-26**: numeração sequencial do livro de atas (atribuída na aprovação), confirmação de leitura da convocatória (por membro, com contagem visível) e anexos à ata (`assembleia_anexo`, upload/eliminação enquanto a ata não estiver aprovada, migração `0032` **em produção desde 2026-07-26**, `db:check-drift` OK). Falta videoconferência (ver `FUNCTIONAL_GAPS.md`) |
| Multi-condomínio / multi-tenant | ✅ Resolvido 2026-07-22 — schema e isolamento (2026-07-06) + fluxo de onboarding por código de convite/criação de condomínio novo. Falta só o modelo de "empresa de administração" (uma conta a gerir vários condomínios), ver Fase 5. |
| RGPD (textos legais, direitos do titular) | ✅ Resolvido 2026-07-09/21 — políticas `/privacidade` e `/termos` (rascunho técnico, falta revisão jurídica), RAT, `/os-meus-dados` (ver/corrigir/exportar/eliminar), prazos de retenção propostos. Ver Fase 3 e `PRE_CLIENTE_EXTERNO.md` para o que depende de terceiros. |
| Auditoria/log de alterações | ✅ Resolvido 2026-07-06 — `audit_log` + página `/auditoria` + soft-delete em `movimento` |
| Upload de ficheiros | ✅ Resolvido 2026-07-09, **verificado em runtime 2026-07-21** — Vercel Blob (`lib/storage.ts`), ligado a documentos, fotos de ocorrências e apólices de seguro; testado upload+eliminação real nos três pontos. **Alterado 2026-07-22**: os ficheiros passaram para um store **privado** dedicado (`access: 'private'`, `lib/storage.ts`), servidos só através de `app/api/ficheiros/route.ts`, que valida sessão e `condominioId`. Ficheiros carregados antes dessa data continuam no store público antigo, sem migração retroativa |
| Notificações por email | ✅ Resolvido 2026-07-09 — reset de password/verificação, convocatória de assembleia, avisos importantes/urgentes e atualização de estado de ocorrências. Sem notificação push. |
| Exportação PDF/Excel | 🟡 Parcial — exportação CSV de movimentos, recibo e relatório de movimentos em PDF (via impressão do browser) feitos 2026-07-07/21; falta `.xlsx` real, se vier a ser necessário. |
| Exportação/importação completa do condomínio | ✅ Resolvido 2026-07-26, **em produção desde 2026-07-26** — `exportarCondominio()`/`importarCondominio()` (`app/actions/condominio.ts`): exportação em JSON de todos os dados do condomínio (botão em `/condominio`), importação só cria um condomínio **novo** (terceiro modo no onboarding, nunca escreve sobre um existente), com ids remapeados. Não inclui conteúdo binário de anexos nem a lista de condóminos com conta. |
| Ajuda/manual na aplicação | ✅ Resolvido 2026-07-26, **em produção desde 2026-07-26** — página `/ajuda`, visível a todos os perfis, uma secção por módulo, escrita para um utilizador sem experiência nenhuma; expandida 2026-07-31 com exemplos numéricos e glossários para leigos totais (simulação de 5 perfis + auditoria independente). Nova página pública `/instrucoes` (2026-07-31), manual passo a passo para criar um condomínio de raiz, sem sessão iniciada. Ambas ganharam um botão "Ler em voz alta" (2026-07-31, `components/leitura-voz/`, Web Speech API nativa, sem dependências novas — ver `docs/RELATORIO_LEITURA_VOZ.md`). Teste real com NVDA ainda pendente para as três páginas (ver `docs/audit/ACCESSIBILITY_AUDIT.md` e `docs/GUIA_TESTE_NVDA.md`). |
| Controlo de acesso por subscrição | ✅ Resolvido 2026-07-26, **em produção desde 2026-07-26** (migração `0031` aplicada, `db:check-drift` OK) — painel `/plataforma` (`user.operadorPlataforma`, distinto do `superAdmin` — ver Fase 5 item 1) lista todos os condomínios e permite suspender/reativar o acesso (bloqueia `requireMembroAprovado`/`requireAdmin` para todos os membros, incluindo admin, exceto o operador). Cobrança em si continua manual; isto só corta/repõe o acesso. Testado em runtime real (suspender, `SuspensoScreen`, reativar, terminar sessão). Só `rjc-si@netcabo.pt` é operador em produção — `rui.coelho@netcabo.pt` teve o acesso removido (dev e produção) por já não ser necessário. MFA obrigatório para qualquer conta operadora resolvido 2026-07-26 (ver `FUNCTIONAL_GAPS.md`). |
| Testes automatizados | ✅ `vitest` + **294 testes unitários em 22 ficheiros** (contagem verificada por execução a 2026-08-24; permissões, formatação, juros, extrato, contas financeiras, remapeamento de importação, cobrança, importação em massa de frações e saldos, modelos CSV, etc.) + **21 ficheiros** de integração real contra a BD Neon do utilizador (`pnpm test:db`, número de testes não recontado nesta passagem, incl. isolamento multi-tenant, round-trip de exportação/importação de condomínio e controlo de acesso por subscrição); faltam testes de autorização e2e via HTTP |
| Controlo de versões / CI | ✅ Git desde 2026-07-06; `.github/workflows/ci.yml` criado 2026-07-06 e **ativo desde 2026-07-24** — repositório em `Rjsoft/GestCondo`, CI (lint, typecheck, testes, build) confirmado a correr em pull requests. **2026-08-24**: a `main` passou a estar protegida (ruleset "Protecao da main", sem bypass) — PR obrigatório, check `ci` verde obrigatório, sem force-push nem eliminação; verificado com um push real rejeitado. Nesta data corrigiu-se também o CI, que estava vermelho desde 2026-08-18 sem bloquear nada (colisão `packageManager` vs. `version: 9` do `pnpm/action-setup`). Processo completo em `docs/PROCEDIMENTO_RELEASE.md`, incluindo o rollback de deployment, **testado a sério em produção nesta data** (`d8cb664` → `9184d24`, ~4 min revertido, dados reais verificados, reposto por Promote — ver `TECHNICAL_DEBT.md` D11 para as quatro armadilhas encontradas) |

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
8. ✅ **Feito 2026-07-06** — Configurado envio de email transacional (reset de password, verificação de email) via API REST do Resend (`lib/email.ts`). A `RESEND_API_KEY` está definida na Vercel (Produção e Preview, confirmado 2026-07-24), pelo que o modo local de consola — o fallback usado quando a variável não existe — já não se aplica em produção. **Não foi verificada a entrega real de um email em produção.**
9. ✅ **Feito 2026-07-06** — `.env.example`, `.gitignore` corrigido, e cabeçalhos de segurança básicos (`SECURITY_AUDIT.md` S14).
10. ✅ Introduzir framework de testes — `vitest` + testes unitários de permissões e teste de integração de isolamento multi-tenant (`pnpm test:db`) feito 2026-07-06.

## Fase 2 — MVP funcional (utilizável por um condomínio real, um só administrador)

1. ✅ **Feito 2026-07-07 a 2026-07-21** — Gestão financeira formal: orçamento anual (valor global, sem rubricas), dívida por fração/mapa de saldos, recibo imprimível, exportação CSV, relatório de movimentos em PDF (`/financas/relatorio`, via impressão do browser), rateio automático de quotas por permilagem com isenção de elevador, juros de mora, reconciliação bancária (importação CSV + conciliação manual assistida). Falta apenas: exportação `.xlsx` real (hoje é CSV), se necessária.
2. ✅ **Feito 2026-07-09, verificado em runtime 2026-07-21** — Upload de ficheiros (documentos, fotos de ocorrências, apólice de seguro) via Vercel Blob. **Alterado 2026-07-22**: passou a usar um store **privado** dedicado (`access: 'private'`), servido só através de `app/api/ficheiros/route.ts` com validação de sessão e `condominioId` — não criar um store público.
3. ✅ **Feito 2026-07-07** — Distinção proprietário/inquilino (`membro.fracaoId`, liga um `membro` condomino ou inquilino à sua fração) e correção da exposição de contactos pessoais (`SECURITY_AUDIT.md` S13). **Feito 2026-07-21** — NIF do proprietário (`fracao.nif`) e visibilidade de compropriedade (`/fracoes` mostra todos os condóminos com conta ligados à mesma fração).
4. ✅ **Feito 2026-07-08** — Seguro obrigatório (apólice, seguradora, validade, alerta de expiração) e fundo de reserva (movimentos com `destino: "reserva"`, seguido à parte da conta corrente) como entidades geridas, não texto livre. **Feito 2026-07-23** — associação apólice↔frações cobertas (`seguro_fracao`), visível em `/financas` e `/fracoes`.
5. ✅ **Feito 2026-07-09** — Notificações por email para avisos importantes/urgentes e para atualização de estado de ocorrências.
6. ✅ **Feito 2026-07-09** — Autogestão de dados pessoais pelo condómino (`/os-meus-dados`: ver os seus dados, corrigir contacto), construído como parte da Fase 3 (RGPD).
7. ✅ **Feito 2026-07-21** — Confirmação antes de eliminar nas 7 ações destrutivas da aplicação (avisos, documentos, ocorrências, orçamentos, frações, seguros, movimentos), via `components/ui/confirm-dialog.tsx`. Paginação + pesquisa em avisos, documentos, ocorrências, auditoria e movimentos financeiros (`/financas`, tab "Movimentos" — cartões de totais e exportação CSV continuam sobre o conjunto completo, não paginado); pesquisa (sem paginação, por serem conjuntos tipicamente pequenos por condomínio) em frações e condóminos.

    **Incidente de produção detetado e corrigido 2026-07-21** (não é dívida em aberto, registado para referência futura): a migração `drizzle/0012_simple_king_bedlam.sql` (tabela `extratoBancario`, reconciliação bancária) tinha sido aplicada à BD de desenvolvimento mas nunca à de produção, porque não existe nenhum passo automático de migração no deploy — derrubava por completo `/financas` em produção (erro 500, `relation "extratoBancario" does not exist"`). Corrigido aplicando a migração em falta à BD de produção (Neon, branch `production`). Ver `TECHNICAL_DEBT.md` D8 para o risco estrutural subjacente (recorrerá em qualquer migração futura, se não for automatizado).

8. ✅ **Feito 2026-07-24, em produção desde 2026-07-24** — Modelo contabilístico de origem (Fase A.1 de `docs/product/MBD_GEST_GAP_ANALYSIS.md`): exercício financeiro (`exercicioFinanceiro`) e conta bancária/caixa (`contaFinanceira`) como entidades próprias, com saldo inicial por exercício, fecho/reabertura auditados, transporte de saldo entre exercícios e associação em massa de movimentos antigos — separador "Exercícios e contas" em `/financas`, com assistente de primeira configuração. Ver `FUNCTIONAL_GAPS.md` para o detalhe técnico.

    **Promoção para produção concluída em 2026-07-24**: migração `drizzle/0024_slim_human_fly.sql` aplicada à BD de produção (drift confirmado a zero antes e depois, totais financeiros inalterados), PR #1 mergido para `main` e deploy concluído. Verificado em produção que as páginas principais carregam sem erros e sem regressões, e a funcionalidade foi usada com dados reais (exercício "2026" criado e registado em `audit_log`). **Validação em `docs/CHECKLIST_TESTE_MANUAL.md`**: 51 de 81 casos passaram, 26 bloqueados e 4 não executados, sem falhas confirmadas. Continuam pendentes: perfis não-Admin, NVDA, viewport/zoom reais e testes com utilizador não treinado.

    **Lacunas de processo desta migração** (a corrigir antes da próxima, não reabrem a Fase A.1): não houve janela de intervenção acordada, nem snapshot explícito antes de escrever, nem plano de rollback testado. Ver `TECHNICAL_DEBT.md` D8.

9. ✅ **Feito 2026-07-24, em produção desde 2026-07-25** — Fase A.2 de `docs/product/MBD_GEST_GAP_ANALYSIS.md`: documentos de fornecedor com pagamentos parciais (`documento_fornecedor` + `pagamento_documento_fornecedor`, separador próprio em `/financas`, migração `drizzle/0025_charming_epoch.sql`, PR #2, commit `cdf9007`) e rubricas orçamentais orçado-vs-real por categoria (`orcamento_rubrica`, balanço em `/financas/balanco/[id]` passa a discriminar por rubrica, migração `drizzle/0026_great_sabretooth.sql`, PR #3, commit `93f605a`). Testado com `pnpm test`/`pnpm test:db` (`lib/documentos-fornecedor.test.ts`, `lib/db/documentos-fornecedor.dbtest.ts`, `lib/db/balanco-orcamento.dbtest.ts`). **Promovido a produção em 2026-07-25**, seguindo `docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md`: snapshot manual criado antes de migrar, migrações `0025`/`0026` aplicadas com `drizzle-kit migrate`, `pnpm db:check-drift` confirmado "OK" (um desalinhamento de hash de metadados da migração `0025` entre dev e produção foi encontrado e corrigido — não era uma diferença de schema real, ver nota abaixo), schema confirmado objetivamente em produção (3 tabelas novas com o número de colunas esperado, constraint `UNIQUE(id, condominioId)` em `movimento` presente, 34 linhas de `movimento` inalteradas), smoke test em `/financas` (produção) sem erros nos separadores "Documentos de fornecedor" e "Gerir rubricas", sem gravar dados de teste.

    **Achado de processo**: o hash de bookkeeping da migração `0025` em `drizzle.__drizzle_migrations` (desenvolvimento) não coincidia com o hash calculado a partir do ficheiro atual (hipótese mais provável: conversão de fim de linha CRLF/LF no Windows entre o momento em que foi aplicada a dev e a promoção a produção) — sem impacto no schema real (idêntico dos dois lados), mas corrigido por segurança (haveria erro em `pnpm db:migrate` contra dev da próxima vez, ao tentar reaplicar uma migração já existente).

    **Feito 2026-08-17** — botão "Copiar rubricas do orçamento anterior" no diálogo "Gerir rubricas" (`copiarRubricasOrcamentoAnterior`, `app/actions/orcamentos.ts`): pré-preenche o orçamento atual com a mesma categoria/valor do orçamento anterior mais recente (não necessariamente `ano - 1`), editável antes de gravar, sem qualquer reajuste automático (decisão do utilizador). Só visível/permitido enquanto o orçamento de destino não tiver nenhuma rubrica própria, para nunca duplicar em cima de dados já lançados. Sem tabela nem migração nova (`orcamento_rubrica` já existia). Verificado com `pnpm test` (215 testes) e `tsc`/`eslint` sem erros; sem teste de integração dedicado nem verificação manual em runtime nesta sessão.

10. ✅ **Feito 2026-07-25, em produção desde 2026-07-25** — Fase B de `docs/product/MBD_GEST_GAP_ANALYSIS.md`: quotas extraordinárias ligadas a deliberação de assembleia (`movimento.assembleiaPontoId`, FK simples para `assembleia_ponto`, migração `drizzle/0027_slippery_reavers.sql`) e balanço patrimonial Ativo/Passivo/Situação Líquida (`getBalancoPatrimonial`, separador "Balanço patrimonial" em `/financas` + página imprimível `/financas/balanco-patrimonial/[exercicioId]`, sem tabela nova — cálculo puro sobre `conta_financeira`/`movimento`/`documento_fornecedor` já existentes). Testado com `pnpm test`/`pnpm test:db` (`lib/db/quota-extraordinaria.dbtest.ts`, `lib/db/balanco-patrimonial.dbtest.ts`) e smoke test manual em runtime (dev e produção). **Limitação assumida**: balanço patrimonial não inclui adiantamentos de condóminos como passivo próprio (G04 não implementado); totais não validados contra o PDF de referência da fase original (ficheiro não está no repositório).

    **Incidente de produção detetado e corrigido 2026-07-25** (ver `TECHNICAL_DEBT.md` D8, terceira ocorrência): o deploy da Vercel é automático a cada push para `main` — o commit desta fase ficou em produção minutos depois do push, **antes** de a migração `0027` ter sido aplicada à BD de produção, derrubando todo o módulo `/financas` (leitura e escrita de qualquer movimento, não só a funcionalidade nova) até a migração ter sido aplicada de emergência. Corrigido: snapshot manual, `drizzle-kit migrate` contra produção, `db:check-drift` confirmado "OK", schema confirmado objetivamente (coluna + FK presentes, `movimento` com as mesmas 34 linhas de antes), smoke test em `/financas` produção real (movimentos, balanço patrimonial com dados reais, diálogo de novo movimento) sem erros.

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

1. ~~Módulo de Assembleias completo: convocatórias, ordem de trabalhos, presenças, procurações, quórum, votação por permilagem, atas, anexos, histórico~~ — **feito 2026-07-09 a 2026-07-26**, incluindo anexos à ata (`assembleia_anexo`, migração `0032`) e numeração do livro de atas. Falta só videoconferência (P3). Ver a linha "Assembleias/atas" na tabela de maturidade.
2. Penalizações fixas configuráveis (distintas dos juros proporcionais já implementados). ~~Declarações de dívida~~ — **feito 2026-07-22** (`/financas/declaracao-divida/[fracaoId]`, ver `FUNCTIONAL_GAPS.md` secção 3). Reconciliação bancária e juros de mora já feitos — ver `FUNCTIONAL_GAPS.md` secção 3.
3. ~~Gestão de fornecedores, orçamentos de obra, fluxo de aprovação de despesas~~ — **feito 2026-07-22/27**: `/fornecedores` (CRUD, migração `0022`), orçamentos de obra (`orcamento_obra`, migração `0043`) e aprovação de despesas/obras urgentes (`movimento.requerAprovacao`, migração `0042`), todos em produção. Ver `FUNCTIONAL_GAPS.md` secção 4.
4. ~~Mensagens internas~~ — **feito 2026-07-27** (tabela `mensagem`, página `/mensagens`, condómino↔administração). ~~Confirmação de leitura de convocatórias/avisos~~ — **feito 2026-07-26**, ver linha "Assembleias/atas" e "Comunicação" na tabela de maturidade.
5. ~~Versionamento de documentos~~ — **feito** (tabela `documentoVersao`). Categorização avançada de faturas com fornecedor/NIF/valor coberta pelos documentos de fornecedor (Fase A.2). Ver `FUNCTIONAL_GAPS.md`.
6. ~~Histórico de titularidade de frações, representantes legais~~ — **ambos feitos**: transmissão de fração com histórico (`fracaoTransmissao`, migração `0047`, produção desde 2026-07-27) e `fracao.representanteLegal`/`representanteLegalContacto` com campos na interface. **Correção 2026-08-24**: este item, e as duas linhas da tabela de maturidade que remetiam para ele, davam ambos como pendentes.

## Fase 5 — Preparação para produção/comercialização

1. Perfil Super Admin + Empresa de administração operacionais, com onboarding de novos condomínios/clientes.
2. Faturação do próprio SaaS (se aplicável ao modelo de negócio). ~~Controlo técnico de acesso por incumprimento~~ — **feito 2026-07-26**: painel `/plataforma` (novo papel `operadorPlataforma`, distinto do Super Admin acima) permite suspender/reativar o acesso de qualquer condomínio; cobrança em si continua manual. Ver `FUNCTIONAL_GAPS.md`.
3. ~~Backups verificados, plano de recuperação de desastre documentado e testado~~ — **feito 2026-08-18**: `docs/PLANO_RECUPERACAO_DESASTRE.md` com RPO/RTO estimados, e multi-step restore testado a sério (branch novo a partir de snapshot de produção, dados verificados, branch eliminado). Continua por testar o one-step restore (destrutivo) e por resolver a ausência de cópias fora da Neon — ver `TECHNICAL_DEBT.md` D7.
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
7. ✅ Configurar provedor de email + reset de password + verificação de email — feito 2026-07-06; `RESEND_API_KEY` definida na Vercel (confirmado 2026-07-24), entrega real ainda não verificada em produção.
7b. ✅ CI mínimo (`.github/workflows/ci.yml`) e cabeçalhos de segurança básicos — feito 2026-07-06.
7c. ✅ Testes automatizados — `vitest`, criado 2026-07-06 com testes unitários de permissões e o teste de integração de isolamento multi-tenant (item 12) contra a BD Neon real do utilizador. **Em 2026-08-24 são 294 testes unitários em 22 ficheiros** (contagem verificada por execução; ver a tabela de maturidade).
8. Escrever Política de Privacidade/Termos e mostrar aviso de finalidade no registo.
9. ✅ Implementar upload de ficheiros com controlo de acesso — feito 2026-07-09 (Vercel Blob, documentos/ocorrências/seguro). **Verificado em runtime 2026-07-21** com um token real: upload, acesso ao ficheiro e eliminação em cascata confirmados nos três pontos de uso. **Alterado 2026-07-22**: os ficheiros passaram para um store **privado** dedicado (`access: 'private'`, `BLOB_PRIVADO_READ_WRITE_TOKEN`), acessíveis só via `app/api/ficheiros/route.ts`, que valida sessão e `condominioId` — o store público original não suporta acesso privado por objeto e não pode ser convertido, por isso foi substituído em vez de alterado. Ficheiros carregados antes dessa data continuam no store antigo, sem migração retroativa.
10. ✅ Construir gestão financeira formal — feito 2026-07-07: orçamento anual (valor global), dívida por fração/mapa de saldos, recibo imprimível, exportação CSV (ver `FUNCTIONAL_GAPS.md` secção 3). **Feito 2026-07-21** — geração automática de 12 quotas mensais por fração a partir do orçamento, rateadas por permilagem (`lib/rateio.ts`, `app/actions/orcamentos.ts:gerarQuotasOrcamento`), com isenção configurável da parcela do elevador por fração (comum para o rés-do-chão em Portugal); juros de mora sobre quotas em atraso, taxa introduzida pelo administrador (`lib/juros.ts`, `app/actions/financas.ts:lancarJurosMora`); reconciliação bancária por importação de extrato CSV com mapeamento de colunas e conciliação manual assistida por sugestões automáticas (`lib/extrato.ts`, `app/actions/extrato.ts`). Testado em runtime contra a BD Neon de desenvolvimento, incluindo isenção de elevador, lançamento de juros e importação/conciliação/desfazer/ignorar de um extrato fictício. **Feito 2026-07-21** — relatório de movimentos em PDF (`/financas/relatorio`, botão "Relatório (PDF)" na tab Movimentos, mesmo padrão de impressão do recibo — sem biblioteca nova), verificado em runtime. Falta apenas: exportação `.xlsx` real (hoje é CSV), se necessária.
11. ✅ Construir módulo de Assembleias — feito 2026-07-09: convocatória (com email automático aos condóminos aprovados), ordem de trabalhos, presenças/procurações, quórum e votação por permilagem, deliberações, ata imutável após aprovação. **Verificado em runtime 2026-07-21**: ciclo completo testado manualmente contra a BD Neon real, incluindo a imutabilidade após aprovação da ata. Ver `FUNCTIONAL_GAPS.md` secção 2 para o detalhe. Confirmação de leitura e anexos à ata resolvidos 2026-07-26; falta videoconferência.
12. ✅ Introduzir testes cobrindo isolamento multi-tenant e permissões — feito 2026-07-06 (`lib/perfis.test.ts` para permissões; `lib/db/tenant-isolation.dbtest.ts` para isolamento entre condomínios, corrido contra uma BD Neon real dentro de uma transação sempre revertida).

---

## Simulação de usabilidade/acessibilidade por personas (2026-07-31)

Simulação técnica (não teste real) cobrindo toda a aplicação por personas — 30 personas
(`docs/audit/USER_PERSONAS.md`), percursos simulados por tarefa
(`docs/audit/USABILITY_SIMULATION.md`), revisão de acessibilidade por análise de código
(`docs/audit/ACCESSIBILITY_REVIEW.md`), revisão por perfil funcional
(`docs/audit/ROLE_BASED_USAGE_REVIEW.md`), consolidada em 22 achados priorizados
(`docs/audit/USABILITY_FINDINGS.md`) e um plano de melhorias por fases
(`docs/audit/USABILITY_IMPROVEMENT_PLAN.md`).

**Estado (2026-07-31): 22 dos 22 achados corrigidos e testados** — inclui o lote de
correções de esforço baixo/médio, o F13 (acesso convidado a uma ata), o F03 (nível
"colaborador operacional" dentro do papel `gestor`) e o F04 (condómino/senhorio com várias
frações no mesmo condomínio — dois índices únicos PARCIAIS em `membro` substituíram
`membro_user_condominio_idx`, preservando a proteção contra corrida do S10
(`SECURITY_AUDIT.md`) para quem não tem fração, e permitindo várias linhas por
conta+condomínio quando cada uma tem fração diferente; seletor de fração na barra lateral
(`FracaoSelector`) e ação admin `associarFracaoAdicional` para ligar uma segunda fração a
uma conta já aprovada; testado em runtime com uma conta de teste com duas frações,
incluindo troca entre elas).

**Schema em produção confirmado 2026-08-17** — as 4 migrações geradas nesta sessão
(`0055_charming_lester`, F08 — coluna `movimento.updatedAt`, controlo otimista de
concorrência; `0056_neat_malice`, F13 — tabela `acesso_convidado`; `0057_strange_payback`,
F03 — coluna `membro.nivelGestor`; `0058_membro_multi_fracao`, F04 — os dois índices
parciais acima) foram verificadas diretamente em produção (Neon, branch `production`,
consulta a `information_schema`/`pg_indexes`, não só à bookkeeping do drizzle): tabela,
colunas e índices novos confirmados presentes, `membro_user_condominio_idx` (índice antigo
substituído pela 0058) confirmado ausente. **Sem incidente** — ao contrário das ocorrências
anteriores descritas em `TECHNICAL_DEBT.md` D8. **Nota de precisão**: o `created_at` do
drizzle reflete a data de *geração* da migração (2026-07-31), não a de aplicação a
produção — não há registo da data exata em que foram promovidas; a única data confirmada é
a desta verificação.

O teste real com NVDA já planeado (`docs/GUIA_TESTE_NVDA.md`) continua a ser a validação
mais importante em falta — nenhuma conclusão de acessibilidade desta simulação substitui
esse teste.

**Simulação real de um comprador novo (2026-08-17)**: diferente da simulação por personas
acima (leitura de código), esta foi execução real, clique a clique, em desenvolvimento —
registo → onboarding → condomínio → 9 frações (6 apartamentos + 3 lojas, isenção de
elevador) → orçamento anual → quotas → convite de condómino → aviso. Confirma que o guia
público `/instrucoes` corresponde ao comportamento real da aplicação, sem divergências.
Encontrou e corrigiu um bug real (elevador cobrado a mais do orçamento aprovado, ver
`lib/rateio.ts`) e acrescentou edição inline de rubricas orçamentais. Detalhe completo em
`docs/audit/SIMULACAO_COMPRADOR_NOVO.md`.

**Workflow de estados de cobrança de dívidas (2026-08-17), em produção desde 2026-08-17**:
fecha o P1 de `FUNCTIONAL_GAPS.md` secção 3 — liga as peças soltas já existentes (juros de
mora, interpelação, declaração de dívida, antiguidade da dívida, lembretes informais) através
de um processo de cobrança por fração com estado explícito (`em_atraso` → ... →
`regularizado`/`encerrado`/`cancelado`), plano prestacional (acompanhamento
administrativo, nunca escreve em `movimento`) e prova histórica de emissão de
documentos (snapshot + hash, imune a alterações posteriores). Migração `0059`, novo
`app/actions/cobranca.ts`, `/financas/processos-cobranca`. Testado com 13 testes
unitários (`lib/cobranca.test.ts`) e 6 de integração real (`lib/db/cobranca.dbtest.ts`,
incl. confirmação de que nenhuma escrita altera `movimento`) e verificado em runtime
(dev) ciclo completo. Ver `FUNCTIONAL_GAPS.md` secção 3 para o detalhe completo,
incluindo o que ficou deliberadamente fora de âmbito.

**Promoção a produção (2026-08-17)**: o push do commit `a37d77e` para `main` foi
automaticamente bloqueado pelo gate de build (`scripts/check-pending-migrations.mjs`,
ver `TECHNICAL_DEBT.md` D8) por a migração `0059` ainda não estar aplicada em
produção — funcionou exatamente como desenhado, sem incidente, a versão anterior
continuou a servir tráfego sem interrupção. Snapshot manual criado em produção antes de
migrar (o anterior, de 2026-07-31, foi eliminado primeiro — limite do plano Free).
`drizzle-kit migrate` falhou de forma inexplicada contra produção (processo terminava
sem erro nem sucesso, mesmo com ligação direta `pg` a funcionar em segundos) —
aplicada a migração manualmente por SQL direto (as 4 `CREATE TABLE`, sem alterações a
tabelas existentes) dentro de uma transação, seguido do registo da linha de bookkeeping
em `drizzle.__drizzle_migrations` com o mesmo hash de dev (mesmo procedimento de
recurso já documentado em `docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md`/`CLAUDE.md`).
Confirmado por comparação direta de hashes: dev e produção com as mesmas 60 migrações,
sem divergência. Redeploy manual do mesmo commit concluído com sucesso (`READY`).
Smoke test em produção real: `/financas` → "Dívidas por fração" (botão "Processos de
cobrança" visível) e `/financas/processos-cobranca` carregam sem erro, com dados reais.
**Achado de processo**: `pnpm db:check-drift` (`scripts/check-migration-drift.mjs`) tem
um bug na leitura de `.env.local` que impediu correr a verificação oficial nesta sessão
— contornado com uma comparação manual equivalente; o script fica por corrigir, não
avaliado nesta sessão.

Este roadmap é sequencial nas primeiras 6–7 tarefas (cada uma depende ou é fortemente facilitada pela anterior); a partir daí, as tarefas de Fase 2–4 podem ser paralelizadas por equipa/sprint.
