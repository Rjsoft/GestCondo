# GestCondo — instruções do projeto

Aplicação de gestão de condomínios multi-tenant para o mercado português (administrações, condóminos, proprietários, inquilinos, fornecedores). Comunicação e UI inteiramente em português de Portugal.

## Mapa da documentação (ler antes de assumir o estado do projeto)

Não repitas nada disto de memória — os ficheiros abaixo são a fonte de verdade e são atualizados a cada sessão relevante:

- `ROADMAP.md` — estado de maturidade por peça, fases, próximos passos. **Ler sempre primeiro.**
- `FUNCTIONAL_GAPS.md` — auditoria funcional detalhada por módulo, com prioridades P0–P3.
- `TECHNICAL_DEBT.md` — dívida técnica e de arquitetura (D1–D8+).
- `SECURITY_AUDIT.md` — achados de segurança (S1–S17+).
- `GDPR_CHECKLIST.md`, `RAT.md` — conformidade RGPD.
- `MVP_PLAN.md` — detalhe da Fase 2 (MVP funcional).
- `docs/audit/ACCESSIBILITY_AUDIT.md` — acessibilidade a leitores de ecrã (NVDA), achados A1–A4. Requisito explícito do utilizador para toda a app, não só um módulo.

Quando terminares uma tarefa que resolve ou contradiz algo descrito nestes ficheiros, atualiza-os na mesma sessão — já aconteceu ficarem desatualizados e contradizerem o código real.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript `strict`.
- UI: Tailwind v4 + `@base-ui/react` (não é Radix — usa `render={<Componente />}` em vez de `asChild`, e `onValueChange: (value, eventDetails) => void`).
- Base de dados: PostgreSQL (Neon) via Drizzle ORM + `drizzle-kit` para migrações.
- Autenticação: better-auth (email/password).
- Sem backend separado — tudo em Server Actions (`app/actions/*.ts`).
- Testes: `vitest` (`pnpm test`, sem BD) e `vitest.db.config.ts` (`pnpm test:db`, contra Neon real, dentro de transação sempre revertida).
- Deploy: Vercel, produção em `gestcondo.vercel.app`, repositório `Rjsoft/GestCondo`.

## Comandos

```
pnpm test        # unitários, rápidos, sem BD — correr sempre antes de terminar
pnpm test:db     # integração real contra Neon dev — só quando relevante (isolamento multi-tenant, saldos)
pnpm run lint
pnpm exec tsc --noEmit
pnpm run build
pnpm db:generate # gera migração a partir de lib/db/schema.ts
pnpm db:migrate  # aplica migrações pendentes — ver gotcha de produção abaixo
```

Neste ambiente Windows, `pnpm` pode não estar no PATH do shell da sessão — usar `.\node_modules\.bin\<ferramenta>.cmd` ou `npx` como alternativa.

## Convenções de código

- Nomenclatura em português em todo o lado: BD, server actions, UI, mensagens de erro.
- Padrão por módulo: página lista (`app/(app)/<modulo>/page.tsx`) + diálogo de criação (`components/<modulo>/novo-<x>-dialog.tsx`) + componente de ações (`components/<modulo>/<x>-actions.tsx`).
- Autorização explícita em cada server action (`requireAdmin()`, `requireMembroAprovado()`, etc. em `lib/session.ts`) — nunca em middleware opaco.
- Todas as queries de dados de condomínio filtram por `condominioId` — é o mecanismo de isolamento multi-tenant, nunca omitir.
- Eliminações de dados financeiros (`movimento`) são soft-delete (`deletedAt`) por obrigação legal de retenção — nunca `DELETE` físico nessa tabela.
- Ações destrutivas usam `components/ui/confirm-dialog.tsx` antes de chamar a server action — não disparar eliminação direta no `onClick`.
- Listagens que podem crescer sem limite (avisos, documentos, ocorrências, auditoria) usam paginação real via `searchParams` (`?page=`, `?q=`) + `components/ui/pagination-controls.tsx` + `components/ui/search-input.tsx`. Listagens tipicamente pequenas por condomínio (frações, condóminos) só têm pesquisa, filtrada em memória, sem paginação — não vale a pena o custo de uma query extra de `count()`.
- Toda a alteração de dados regista em `audit_log` via `registarAuditoria()` (`lib/audit.ts`).

## Gotchas conhecidos

- **Duas bases de dados Neon distintas** (branches `development` e `production`), sem nenhum passo automático de migração no deploy — ver `TECHNICAL_DEBT.md` D8. Depois de gerar uma migração nova, é preciso lembrar de a aplicar manualmente às duas, incluindo produção. Já causou um incidente real (`/financas` a devolver 500 em produção, tabela em falta).
- O `DATABASE_URL` de produção está marcado **"Sensitive"** na Vercel — `vercel env pull` devolve `[SENSITIVE]`, nunca o valor real. Para obter a connection string de produção, ir diretamente ao Neon (branch `production`, connection string **sem pooling** — a ligação com `-pooler` falha silenciosamente no `drizzle-kit migrate`).
- Nunca alterar produção (dados, migrações, deploy) sem autorização explícita do utilizador, mesmo quando tecnicamente acessível.
