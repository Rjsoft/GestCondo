# Auditoria Técnica — GestCondo

Data: 2026-07-06. **Atualização 2026-07-06 (Fase 1):** o repositório foi inicializado com git (primeiro commit `0b9154e`), o `pnpm lint` foi corrigido (T1) e os 13/14 erros de tipo pré-existentes de `@base-ui/react` foram corrigidos com `ignoreBuildErrors` removido (T2, ver abaixo) — os restantes achados desta secção continuam por endereçar.

## 1. Stack e arquitetura

- **Framework:** Next.js 16.2.6 (App Router, Turbopack), React 19.
- **Linguagem:** TypeScript 5.7, `strict: true` no `tsconfig.json`. `typescript.ignoreBuildErrors: true` existia no `next.config.mjs` e anulava esse rigor no build — **removido 2026-07-06** depois de corrigidos os erros de tipo subjacentes (ver T2 abaixo e `SECURITY_AUDIT.md` S15).
- **Base de dados:** PostgreSQL via `pg` + Drizzle ORM 0.45. **Sem `drizzle-kit` nem pasta de migrações no repositório** — não há forma de versionar alterações de schema fora do próprio ficheiro `lib/db/schema.ts`. O ambiente parece ter sido gerado/gerido pela plataforma v0 (`.gitignore` refere `__v0_runtime_loader.js`, `.v0-trash/`, `V0_RUNTIME_URL`), que tipicamente sincroniza o schema automaticamente — **isto tem de ser confirmado explicitamente**, porque se não for verdade, não existe hoje nenhum processo para aplicar a alteração de schema feita nesta sessão (`membro.estado`) a uma base de dados real.
- **Autenticação:** better-auth 1.6.23, email+password apenas.
- **UI:** Tailwind CSS v4 + `@base-ui/react` (primitivos, via um wrapper ao estilo shadcn) + `lucide-react`.
- **Sem backend separado**: tudo corre dentro do próprio Next.js via Server Actions (`app/actions/*.ts`) e uma única rota de API (`app/api/auth/[...all]/route.ts`, exclusiva do better-auth). Não há uma camada de "serviço"/domínio separada da camada de acesso a dados — as server actions falam diretamente com o Drizzle.
- **Controlo de versões:** ✅ resolvido 2026-07-06 — repositório git inicializado localmente (commit inicial `0b9154e`, branch `main`). Ainda sem remoto configurado, sem CI ligado a commits, e sem processo de code review — ver Fase 1 do `ROADMAP.md`.
- **CI/CD:** ✅ resolvido 2026-07-06 — `.github/workflows/ci.yml` (lint, typecheck, testes unitários, build) corre em cada push/PR para `main`. Só é executado quando o repositório for enviado para o GitHub (ainda não foi, por decisão do utilizador de desenvolver localmente nesta fase) — criar o ficheiro agora não publica nem corre nada localmente.
- **Sem `README.md`** nem `LICENSE`.

### É uma arquitetura adequada para evoluir para SaaS multi-condomínio?

O padrão (Next.js App Router + Server Actions + Drizzle + better-auth) é uma escolha razoável e atual, capaz de suportar um SaaS a sério — **o problema não é a stack, é o modelo de dados e a ausência de multi-tenancy** (ver `SECURITY_AUDIT.md` S9 e `FUNCTIONAL_GAPS.md`). Não há necessidade de mudar de framework; há necessidade de um redesenho de schema e de introduzir uma camada de autorização com âmbito de condomínio antes de crescer mais em funcionalidades.

## 2. Qualidade do código existente

Dentro do que está construído, a qualidade é boa para o estágio de maturidade do projeto:

- Padrão consistente entre módulos (página lista + diálogo de criação + componente de ações), fácil de replicar para novos módulos.
- Sem duplicação séria de lógica de negócio.
- Autorização feita de forma explícita e legível em cada server action (`requireAdmin()`, `requireMembroAprovado()`), não escondida em middleware opaco.
- Nomenclatura em português consistente em toda a aplicação (dados, UI, mensagens de erro) — bom para o público-alvo.
- Sem uso de `any` nem gambiarras de tipo encontradas fora dos erros de tipo pré-existentes descritos abaixo.

Dívida técnica concreta encontrada:

| # | Achado | Gravidade | Recomendação |
|---|---|---|---|
| T1 | ~~`pnpm lint` está completamente quebrado~~ **Resolvido 2026-07-06** | Média | `eslint` estava referenciado em `package.json` mas não instalado, sem ficheiro de configuração. Corrigido: adicionados `eslint@9` + `eslint-config-next@16.2.6`; `eslint.config.mjs` importa diretamente os arrays de configuração flat nativos `eslint-config-next/core-web-vitals` e `eslint-config-next/typescript`. **Nota:** a abordagem "padrão" (`FlatCompat` + `compat.extends('next/core-web-vitals', 'next/typescript')`, como o `create-next-app` gera por omissão) falha sob pnpm com `TypeError: Converting circular structure to JSON` — colisão entre a validação de schema legada do `@eslint/eslintrc` e a auto-referência interna de `eslint-plugin-react@7.37+` em `configs.flat`. Evitar reintroduzir `FlatCompat` neste projeto. `pnpm run lint` corre agora sem erros nem avisos (foram também corrigidas 3 variáveis não usadas encontradas: `eq`/`Badge` em `app/(app)/page.tsx` e a prop `email` não utilizada em `components/app-shell.tsx`). | Manter a configuração atual; rever ao atualizar `eslint-config-next`/`eslint-plugin-react` no futuro. |
| T2 | ~~14 erros de tipo reais, escondidos por `ignoreBuildErrors`~~ **Resolvido 2026-07-06** | Média | `npx tsc --noEmit` reportava 14 erros (a contagem de "13" da versão anterior deste documento estava uma unidade abaixo), todos por incompatibilidade entre a API `asChild`/`onValueChange` (Radix, herdada de exemplos genéricos) e a API real de `@base-ui/react` 1.5.0, que usa `render={<Componente />}` em vez de `asChild` e `onValueChange: (value: T \| null, eventDetails) => void` em vez de aceitar diretamente um `Dispatch<SetStateAction<T>>`. Corrigido em todos os 7 diálogos/menus (`asChild` → `render={<Button />}`, mantendo os filhos como children do trigger — o mesmo padrão já usado corretamente em `components/ui/dialog.tsx` `DialogClose`) e nos 7 selects (`onValueChange={setX}` → `onValueChange={(value) => value && setX(value)}`). `ignoreBuildErrors` removido de `next.config.mjs`; `next build` agora corre a validação de tipos (deixou de mostrar "Skipping validation of types"). | Nenhuma — manter o padrão `render={<Componente />}` em componentes novos que usem `DialogTrigger`/`DropdownMenuTrigger`/`Select`. |
| T3 | ~~Sem testes de nenhum tipo~~ **Maioritariamente resolvido 2026-07-06** | Alta | `vitest` (`pnpm test`, CI-safe, sem BD): 38 testes unitários cobrindo `lib/perfis.ts` (toda a matriz de permissões) e `lib/format.ts`. **Adicionado o mesmo dia, depois de ligar a uma BD real:** `vitest.db.config.ts` + `lib/db/tenant-isolation.dbtest.ts` (`pnpm test:db`, não faz parte do CI) — teste de integração real contra PostgreSQL, dentro de uma transação sempre revertida, confirmando o isolamento multi-tenant (`SECURITY_AUDIT.md` S9) e o padrão de proteção contra IDOR entre condomínios usado em `eliminarMovimento`. **Continua a faltar**: testes de autorização ponta-a-ponta via HTTP (fluxo de aprovação, os 6 perfis a interagir com as server actions reais) — os testes atuais tocam a BD diretamente, não simulam um pedido HTTP autenticado completo. | Alargar `lib/db/tenant-isolation.dbtest.ts` com mais entidades (`fracao`, `ocorrencia`, `membro`) e, quando fizer sentido, um teste e2e via HTTP (Playwright) para o fluxo de aprovação. |
| T4 | ~~Sem `drizzle-kit`/migrações versionadas~~ **Resolvido 2026-07-06** | Alta | Adicionado `drizzle-kit` (`drizzle.config.ts`, scripts `db:generate`/`db:migrate`/`db:push`/`db:studio` em `package.json`) e gerada a primeira migração, `drizzle/0000_multi_tenant_baseline.sql`, cobrindo o schema completo incluindo o redesenho multi-tenant (ver D1). **Atenção:** esta é uma migração *baseline* (`CREATE TABLE` para todas as tabelas) — só é segura para aplicar a uma base de dados vazia. Se já existir uma instância Postgres real com dados desta aplicação fora deste ambiente de desenvolvimento, **não correr `db:migrate` diretamente**; é preciso primeiro confirmar o estado dessa BD e, se já tiver as tabelas antigas (sem `condominioId`), escrever uma migração incremental de alteração (`ALTER TABLE ... ADD COLUMN "condominioId"`, criar um `condominio` por omissão, fazer *backfill* de todas as linhas existentes com esse id, só depois aplicar `NOT NULL`) em vez de usar este ficheiro. | Antes do primeiro `db:migrate` em qualquer BD que não esteja vazia, verificar se as tabelas já existem e adaptar em conformidade. |
| T5 | Duplicação de identidade entre `user` (better-auth) e `membro` (app) | Baixa/Média | `nome`/`email` existem em ambas as tabelas e podem divergir (ex. se o `user.name` for atualizado via um futuro ecrã de perfil, `membro.nome` fica desatualizado, e vice-versa). | Decidir uma fonte de verdade única para nome/email e derivar a outra, ou documentar explicitamente porque coexistem. |
| T6 | ~~Sem `.env.example`~~ **Resolvido 2026-07-06** | Baixa | `.env.example` adicionado, documentando `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`. |
| T7 | `.gitignore` não cobre `.env` simples | Baixa | Só ignora `.env*.local`. Sem risco imediato (não há git ainda), mas é uma armadilha pronta a acontecer assim que o repositório for inicializado. | Adicionar `.env` e `.env*` (exceto `.env.example`) ao `.gitignore` antes do primeiro `git init`. |

## 3. Instalação, build e verificação (executado nesta sessão)

| Comando | Resultado |
|---|---|
| `pnpm install` (via `npx pnpm@9`, porque `pnpm` não estava disponível globalmente e o `corepack enable` falhou por permissões no ambiente) | ✅ Sucesso, 430 pacotes resolvidos. |
| `tsc --noEmit` | ✅ Corrigido 2026-07-06 (T2) — 0 erros. |
| `next build` (com `DATABASE_URL`/`BETTER_AUTH_SECRET` fictícios só para permitir o build) | ✅ Sucesso. Todas as rotas compilam e ficam corretamente marcadas como dinâmicas (`ƒ`). |
| `next dev` + pedidos HTTP de fumo | ✅ `/sign-in` e `/sign-up` devolvem 200; `/` (sem sessão) devolve 307 para `/sign-in`, confirmando que o gate de autenticação funciona sem precisar de ligação real à BD para visitantes anónimos. |
| `pnpm run lint` | ✅ Corrigido 2026-07-06 (T1) — 0 erros, 0 avisos. |
| `pnpm audit` | ⚠️ 2 vulnerabilidades **moderadas**, ambas do mesmo CVE em `postcss@8.5.6` (via `shadcn`/`@tailwindcss/postcss`), corrigido em `>=8.5.10`. Sem vulnerabilidades altas/críticas. É uma dependência de build (não corre em produção no browser/servidor de forma exposta), pelo que o risco prático é baixo, mas a correção é trivial (bump de versão). |
| Testes automatizados | N/A — não existem. |
| Verificação de ficheiros sensíveis expostos | ✅ Nenhum `.env`, chave ou token encontrado no repositório. |

**Limitação desta auditoria:** não existe uma instância PostgreSQL disponível neste ambiente, pelo que não foi possível exercitar de ponta a ponta os fluxos que dependem de BD real (registo, aprovação, CRUD de cada módulo) através da UI num browser. A verificação foi feita por build + smoke test HTTP + leitura exaustiva do código-fonte de todas as server actions e páginas.

## 4. Base de dados e modelo de dados

Ver também `SECURITY_AUDIT.md` (S9–S13) e `FUNCTIONAL_GAPS.md` para as implicações funcionais. Achados especificamente de modelação/integridade:

| # | Achado | Gravidade | Recomendação |
|---|---|---|---|
| D1 | ~~Sem entidade `condominio`; sem multi-tenancy~~ **Resolvido 2026-07-06** | Crítica | Ver `SECURITY_AUDIT.md` S9 — nova tabela `condominio` + `condominioId` (FK `NOT NULL`, `onDelete: cascade`) em `membro`, `fracao`, `movimento`, `aviso`, `ocorrencia`, `documento`. Todas as queries em `app/actions/*.ts` e no dashboard (`app/(app)/page.tsx`) filtram agora por `condominioId`, incluindo as operações de `update`/`delete` que recebem um `id` do cliente (antes filtravam só por `id`, o que seria um IDOR entre condomínios assim que existisse mais do que um). **Falta ainda:** não existe nenhum fluxo de convite/criação de um segundo condomínio pela UI — ver nota em `lib/db/schema.ts`/`lib/session.ts` e `FUNCTIONAL_GAPS.md`. |
| D2 | ~~`membro.userId` sem `UNIQUE`~~ **Resolvido 2026-07-06** | Média | Substituído por um índice único composto `(userId, condominioId)` — correto para o novo modelo, onde um utilizador pode legitimamente ter uma linha `membro` por condomínio. |
| D3 | ~~`movimento.fracaoId` sem FK declarada~~ **Resolvido 2026-07-06** | Baixa | Agora `.references(() => fracao.id, { onDelete: 'set null' })`. |
| D4 | ~~Sem índices além da chave primária~~ **Resolvido 2026-07-06** | Baixa/Média | Adicionado índice em `condominioId` em todas as tabelas de tenant, mais o índice único de `membro` referido em D2. |
| D5 | ~~Sem soft-delete em nenhuma tabela~~ **Resolvido 2026-07-22** | Alta | `deletedAt` implementado em `movimento` (2026-07-06), depois `seguro`, `aviso`, `documento`, `ocorrencia` (2026-07-22 — achado DOC-01). Só `fracao` e `membro` continuam a usar `DELETE` físico, agora pelo menos rastreado no `audit_log`. |
| D6 | Sem `updatedAt` na maioria das tabelas | Baixa | Só `ocorrencia` tem `updatedAt`. `movimento`, `aviso`, `documento`, `fracao`, `membro` não registam quando foram alterados pela última vez (distinto de quando foram criados). | Adicionar `updatedAt` de forma consistente, idealmente como parte da introdução do log de auditoria. |
| D7 | ~~Backups/recuperação~~ **Confirmado 2026-07-22** | Média | Neon (Free): "Restore from history" dá PITR (point-in-time recovery) com janela de **6 horas** (o máximo permitido no plano Free — já configurado no limite; upgrade paga dá até 30 dias). Sem snapshots agendados automáticos no Free (requer upgrade), mas é possível criar um snapshot manual em qualquer momento (`Backup & Restore` → `Create snapshot`) sem custo. Restauro confirmado como disponível na UI (branch `production`, "Restore from history"), não testado um restauro real (seria disruptivo sem necessidade). | Considerar criar um snapshot manual antes de qualquer migração/alteração maior de schema, dado que a janela de PITR automática é curta (6h). Reavaliar upgrade de plano se o volume de dados reais crescer. |
| D8 | ~~Sem passo automático de migração no deploy de produção~~ **Mitigado 2026-07-22** | Alta | Causou um incidente real em 2026-07-21: a migração `0012` ficou aplicada só à BD de desenvolvimento e nunca à de produção, derrubando `/financas` em produção durante horas (erro 500, tabela em falta). **Continua sem automação no deploy** (nenhum passo de CI/CD corre `drizzle-kit migrate` contra produção), mas agora existe `pnpm db:check-drift` (`scripts/check-migration-drift.mjs`) — compara a tabela de controlo `drizzle.__drizzle_migrations` entre dev e produção e avisa se alguma migração ficou por aplicar. **Usado nesta sessão e encontrou uma drift real**: as migrações `0019`/`0020`, aplicadas em produção por SQL manual (via SQL Editor da Neon) em vez de `drizzle-kit migrate`, nunca tinham sido registadas na tabela de controlo — corrigido manualmente. O `DATABASE_URL` de produção continua marcado "Sensitive" na Vercel (`vercel env pull` não o obtém), por isso o script exige que a connection string de produção seja passada à mão em cada execução (nunca fica guardada). | Correr `pnpm db:check-drift` (com `PROD_DATABASE_URL` da produção) depois de qualquer migração aplicada manualmente, ou periodicamente. Automatizar num passo de CI/CD ficaria mais robusto, mas exigiria guardar a connection string de produção como secret do GitHub — decisão a tomar separadamente (implica confiar esse segredo ao CI). |

## 5. UX/UI

Avaliação qualitativa (não foi possível testar num browser real por falta de BD; baseada em leitura de todos os componentes/páginas e nas convenções do design system `components/ui/*`):

**Pontos positivos:**
- Interface consistente, em português, com bom uso de estados vazios ("Ainda não existem avisos.", etc.) em todas as listagens.
- Uso de `aria-label` em botões só com ícone (ex. `MovimentoActions`, `AvisoActions`) — bom sinal de atenção básica a acessibilidade.
- Layout responsivo via Tailwind (`sm:`, `lg:` breakpoints), sidebar colapsável em mobile.
- Mensagens de erro traduzidas para português mesmo nos erros vindos do better-auth (`traduzErro` em `auth-form.tsx`).

**Lacunas:**
- ~~Sem paginação, pesquisa nem filtros em nenhuma tabela/lista~~ **Maioritariamente resolvido 2026-07-21** — paginação real + pesquisa em avisos, documentos, ocorrências e auditoria; pesquisa (sem paginação) em frações e condóminos. **Falta ainda**: a listagem de movimentos financeiros em `/financas` (o caso mais citado nesta linha, por crescer mais depressa) e ordenação configurável pelas colunas em qualquer tabela.
- ~~Sem confirmação antes de ações destrutivas~~ **Resolvido 2026-07-21** — `components/ui/confirm-dialog.tsx`, usado nas 7 ações de eliminação da aplicação (`eliminarMovimento`, `eliminarAviso`, etc.).
- Sem indicação visual de carregamento na navegação inicial entre páginas (só os botões de submissão de formulário têm estado `pending`).
- Não verificado (requer teste manual num browser): contraste de cores das badges customizadas (`bg-amber-100 text-amber-800` etc.) e navegação completa por teclado nos componentes `@base-ui/react` — recomenda-se um passe de acessibilidade com um leitor de ecrã e o teclado antes de lançar.
- O admin não tem nenhuma visão agregada de "pedidos pendentes" fora da página de Condóminos (ex. um badge no menu lateral), o que é fácil de passar despercebido em condomínios com admins pouco assíduos na aplicação.

## 6. Conclusão desta secção

O código que existe é limpo, consistente e de fácil manutenção — não há indício de que seja necessário reescrever o que já está feito. O risco técnico principal não está na qualidade do código, mas em quatro ausências estruturais que se tornam mais caras de corrigir quanto mais tarde forem endereçadas: **controlo de versões, testes automatizados, migrações de schema versionadas, e o modelo de dados multi-tenant**. Ver `ROADMAP.md` para a sequência recomendada de correção.
