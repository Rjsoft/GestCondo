# Auditoria Completa — GestCondo

**Data:** 2026-07-06
**Âmbito:** todo o código-fonte do repositório (`app/`, `components/`, `lib/`, configuração de build/dependências). Sem acesso a infraestrutura de produção (não existe ainda).
**Metodologia:** leitura integral do código-fonte (todas as páginas, componentes, server actions, schema de base de dados, configuração); execução de `pnpm install`, `tsc --noEmit`, `next build`, `pnpm audit`, `pnpm run lint`; arranque do servidor de desenvolvimento e verificação HTTP das rotas públicas e do redirecionamento de rotas protegidas.

**Limitação importante:** este ambiente não tem acesso a uma instância PostgreSQL real, pelo que não foi possível exercitar manualmente, num browser, os fluxos que dependem de dados (registo → aprovação → CRUD de cada módulo). A avaliação funcional desses fluxos baseia-se em leitura exaustiva do código de cada server action e página, não em teste manual ponta-a-ponta. Isto deve ser feito assim que houver uma base de dados de desenvolvimento disponível — ver `MVP_PLAN.md`.

**Correções feitas durante a auditoria original:** nenhuma alteração ao código-fonte foi necessária para a concluir. Para o `next build` e o smoke test HTTP correrem, foram usadas variáveis de ambiente fictícias (`DATABASE_URL`, `BETTER_AUTH_SECRET`) apenas no processo local dessa sessão — nada foi persistido no repositório.

**Atualização 2026-07-06 — Fase 1 em curso:** a pedido do utilizador, avançou-se com os itens 1–3 da lista de próximos passos (secção G): (1) `git init` + primeiro commit; (2) correção do `pnpm lint`; (3) correção dos 14 erros de tipo de `@base-ui/react` e remoção de `ignoreBuildErrors`; e (4) o redesenho do schema multi-tenant — nova tabela `condominio`, `condominioId` em todas as tabelas de dados, isolamento aplicado em todas as server actions e no dashboard, `drizzle-kit` configurado com a primeira migração (`drizzle/0000_multi_tenant_baseline.sql`). Detalhe em `TECHNICAL_DEBT.md` (T1, T2, T4, D1–D4) e `SECURITY_AUDIT.md` (S9, S10, S12). Estas foram as únicas alterações de código feitas desde a auditoria original.

Este documento é o índice e resumo executivo. O detalhe está nos seguintes ficheiros, todos criados nesta sessão:

| Ficheiro | Conteúdo |
|---|---|
| `TECHNICAL_DEBT.md` | Estado técnico, arquitetura, qualidade de código, modelo de base de dados, UX/UI, resultado de install/lint/typecheck/build/audit. |
| `SECURITY_AUDIT.md` | Autenticação, autorização, OWASP (IDOR/XSS/CSRF/SQLi), uploads, logging, recomendações. |
| `GDPR_CHECKLIST.md` | Dados tratados, bases legais, direitos dos titulares, privacy by design, retenção, checklist de conformidade. |
| `FUNCTIONAL_GAPS.md` | Funcionalidades existentes/parciais/em falta face aos requisitos legais e operacionais de condomínios em Portugal, por módulo, com prioridade. |
| `ROADMAP.md` | Fases 1–5, avaliação de maturidade por peça, recomendação, lista de próximos passos. |
| `MVP_PLAN.md` | Definição de MVP, plano de testes (unitários, integração, e2e, segurança, RGPD, negócio), lista de testes prioritários. |

---

## A. Resumo executivo

### Estado geral

A aplicação é um **protótipo bem construído de um pedaço pequeno do problema**: gestão administrativa básica de finanças, avisos, ocorrências, frações e condóminos para **um único condomínio**, com um fluxo de aprovação de acesso razoável. O código que existe é limpo, consistente, sem vulnerabilidades clássicas (SQL injection, XSS, CSRF não foram encontradas). Mas o produto descrito pelo utilizador — uma aplicação profissional, multi-condomínio, com assembleias, gestão financeira formal, conformidade RGPD e os 7 perfis de utilizador pedidos — está, na sua maior parte, **por construir**, não parcialmente construído. Não há multi-tenancy, não há assembleias/atas, não há RGPD (nenhum texto legal, nenhum direito do titular implementado), não há auditoria/log de alterações, não há testes, não há controlo de versões.

### Nota: **3,5 / 10**

Justificação: a nota reflete a distância entre o que existe e um produto profissional pronto para condomínios reais em Portugal — não a qualidade do código em si (que, isoladamente, mereceria uma nota bem mais alta). Metade da nota está "presa" em quatro ausências estruturais (multi-tenant, git, testes, auditoria) que custam cada vez mais quanto mais se adiarem.

### Principais riscos

1. **Arquitetural/crítico:** ausência total de isolamento multi-condomínio — a aplicação, tal como está, só é segura para um único condomínio. Reutilizá-la para mais do que um sem esta correção expõe dados financeiros e pessoais entre condomínios diferentes.
2. **Legal/produto:** ausência completa do módulo de Assembleias/Atas — o instrumento central da vida legal de um condomínio em Portugal não existe em nenhuma forma.
3. **RGPD:** nenhum texto legal, nenhum direito do titular implementado, dívidas por pessoa/fração armazenadas sem log de quem altera o quê, eliminação de dados financeiros sem rasto (risco duplo: RGPD e conformidade contabilística).
4. **Continuidade/engenharia:** sem controlo de versões (não é sequer um repositório git), sem testes, sem CI. Qualquer alteração futura corre sem rede de segurança nenhuma.
5. **Confiança do utilizador final:** sem recuperação de password nem verificação de email — a aplicação não é operável com utilizadores reais não técnicos no seu estado atual.

### Principais oportunidades

1. A stack escolhida (Next.js + Drizzle + better-auth + Tailwind) é sólida e atual — não há necessidade de mudar de tecnologia.
2. O padrão de código já estabelecido (página + server actions + componentes de ação, autorização explícita por função) é replicável para os módulos em falta sem reescrever o que já existe.
3. O fluxo de aprovação de acesso implementado nesta sessão já demonstra o tipo de controlo "privacy by default" que o resto da aplicação vai precisar — é um bom modelo a seguir para os módulos novos.
4. Nenhuma vulnerabilidade clássica de segurança foi encontrada no que já está construído — o esforço de correção pode focar-se em construir o que falta, não em corrigir o que existe.

### Recomendação

**Continuar sobre a base atual — não reconstruir de raiz —, mas tratar a Fase 1 (estabilização técnica: git, testes, migrações, multi-tenant, auditoria) como obrigatória e bloqueadora antes de qualquer nova funcionalidade de produto.** Construir Assembleias, gestão financeira formal ou qualquer outro módulo novo sobre o modelo de dados atual (sem `condominio`, sem `audit_log`) significa reescrever esse módulo mais tarde. Ver `ROADMAP.md` para o detalhe faseado.

---

## B. Auditoria técnica

Ver `TECHNICAL_DEBT.md`. Resumo dos achados mais graves:

| Problema | Gravidade | Impacto |
|---|---|---|
| Sem controlo de versões (não é repositório git) | Alta | Sem histórico, sem rollback, sem code review possível |
| Sem testes automatizados | Alta | Sem rede de segurança para nenhuma alteração futura, em particular em permissões |
| `pnpm lint` quebrado (eslint não instalado) | Média | Zero verificação estática de qualidade a correr |
| `typescript.ignoreBuildErrors: true` esconde 13 erros de tipo reais | Média | Erros de tipo futuros (incluindo em lógica de permissões) podem passar despercebidos no build |
~~Sem `drizzle-kit`/migrações versionadas~~ — resolvido 2026-07-06 | Alta | Ver `TECHNICAL_DEBT.md` T4 |
| `membro.userId` sem `UNIQUE` | Média | Corrida de duplicação de registo no primeiro login |
| Sem índices, sem FK declarada em `movimento.fracaoId` | Baixa | Sem impacto imediato; agrava-se com escala e com multi-tenant |

## C. Auditoria funcional

Ver `FUNCTIONAL_GAPS.md`, com detalhe por módulo (gestão do condomínio, assembleias, financeiro, ocorrências, comunicação, documentos, auditoria) e por perfil de utilizador. Resumo:

- **Implementado e razoável:** avisos, ocorrências (sem anexos), CRUD de frações e condóminos (sem multi-condomínio), aprovação de acesso.
- **Parcial/insuficiente:** finanças (falta orçamento, dívida por fração, recibos, exportação), documentos (falta upload real e controlo por documento).
- **Completamente em falta:** assembleias/atas, multi-condomínio, seguro obrigatório, fundo de reserva como entidade própria, fornecedores, notificações por email, upload de ficheiros, exportação PDF/Excel, os 5 perfis de utilizador em falta (Super Admin, Empresa de administração, Proprietário vs. Inquilino, Fornecedor, Auditor).

## D. Auditoria RGPD/privacidade

Ver `GDPR_CHECKLIST.md`. Resumo: base legal previsível (execução de contrato/obrigação legal) mas não documentada; zero direitos do titular implementados (acesso, retificação self-service, apagamento, portabilidade); zero textos legais (privacidade, termos); exposição de contactos pessoais entre condóminos além do necessário; eliminação física de dados financeiros sem rasto nem política de retenção; sem preparação para acordo de subcontratação com empresas de administração.

## E. Auditoria de segurança

Ver `SECURITY_AUDIT.md`. Resumo: **sem SQL injection, XSS ou CSRF encontrados** — boa notícia sobre o que existe. Mas: sem recuperação de password, sem verificação de email, sem MFA, sem rate limiting explícito, sem cabeçalhos de segurança, sem log de auditoria, e o défice estrutural mais grave — sem isolamento multi-condomínio, o que classifica como crítico assim que a aplicação for usada por mais do que um condomínio.

## F. Roadmap

Ver `ROADMAP.md` para o detalhe de cada fase:

- **Fase 1 — Estabilização técnica:** git, CI, lint/typecheck reais, migrações, modelo multi-tenant, modelo de papéis, audit log + soft-delete, email transacional.
- **Fase 2 — MVP funcional:** financeiro formal (dívida por fração, recibos, exportação), upload de ficheiros, proprietário/inquilino, seguro/fundo de reserva, autogestão de dados.
- **Fase 3 — RGPD, segurança e auditoria:** textos legais, direitos do titular, retenção, MFA, DPA.
- **Fase 4 — Funcionalidades avançadas:** Assembleias/Atas completo, reconciliação bancária, fornecedores/orçamentos de obra, mensagens internas.
- **Fase 5 — Preparação para produção/comercialização:** Super Admin/Empresa de administração operacionais, backups verificados, observabilidade, auditoria externa.

## G. Lista concreta de próximos passos (por ordem)

1. ✅ `git init` + primeiro commit do estado atual — feito 2026-07-06 (commit `0b9154e`, branch `main`).
2. ✅ Corrigir `pnpm lint` e os 14 erros de tipo de `@base-ui/react`; remover `ignoreBuildErrors` — feito 2026-07-06 (ver `TECHNICAL_DEBT.md` T1/T2).
3. ✅ Desenhar e implementar o schema multi-tenant (`condominio` + `condominioId` em todas as tabelas) — feito 2026-07-06 (ver `TECHNICAL_DEBT.md` D1–D4, `SECURITY_AUDIT.md` S9/S10/S12). Falta o fluxo de produto para um 2º condomínio.
4. Redesenhar o modelo de papéis (7 perfis, com âmbito por condomínio).
5. ✅ Introduzir `drizzle-kit` com migrações versionadas — feito 2026-07-06.
6. Implementar `audit_log` + soft-delete nas eliminações de dados financeiros.
7. Configurar provedor de email + reset de password + verificação de email.
8. Escrever Política de Privacidade/Termos e mostrar aviso de finalidade no registo.
9. Implementar upload de ficheiros com controlo de acesso.
10. Construir gestão financeira formal (orçamento, dívida por fração, recibos, exportação).
11. Construir módulo de Assembleias (projeto próprio dentro do roadmap, o maior módulo em falta).
12. Introduzir testes automatizados, começando pela autorização e pelo isolamento multi-tenant.

## H. Ficheiros criados por esta auditoria

- `AUDIT.md` (este ficheiro)
- `ROADMAP.md`
- `GDPR_CHECKLIST.md`
- `SECURITY_AUDIT.md`
- `FUNCTIONAL_GAPS.md`
- `TECHNICAL_DEBT.md`
- `MVP_PLAN.md`

---

## Conclusão

A aplicação está, hoje, no estágio de **protótipo técnico validado**, não de produto. O que foi construído até agora — autenticação, aprovação de acesso, CRUD básico de finanças/avisos/ocorrências/frações/condóminos — está bem feito e não precisa de ser deitado fora. Mas é, em área coberta, uma fração pequena do que a lei e o mercado português exigem de uma aplicação de gestão de condomínios: falta o módulo de Assembleias, falta a gestão financeira formal (dívidas, recibos, orçamentos), falta toda a camada de conformidade RGPD, falta a auditoria/rastreabilidade das ações, e falta a própria fundação que torna tudo isto seguro de construir em cima — multi-tenancy, testes, controlo de versões.

**Não recomendo continuar a adicionar funcionalidades de produto sobre a base atual sem primeiro fechar a Fase 1.** Cada módulo novo construído sobre um modelo de dados de condomínio único terá de ser refeito quando o multi-tenant for introduzido — e adiar essa decisão só aumenta o custo de a tomar mais tarde. Com a Fase 1 fechada, a base técnica é suficientemente sólida para justificar continuar a evoluir este mesmo código até um produto comercializável, em vez de reconstruir de raiz.
