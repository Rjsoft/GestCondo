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
- **Sem CI/CD**: não existe `.github/workflows` nem qualquer outro pipeline.
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
| T3 | Sem testes de nenhum tipo | Alta | Nenhum framework de testes (`vitest`/`jest`/`playwright`) está configurado; nenhum ficheiro `*.test.*`/`*.spec.*` existe. | Ver `MVP_PLAN.md`, secção de testes. |
| T4 | Sem `drizzle-kit`/migrações versionadas | Alta | Alterações ao schema (como a adicionada nesta sessão) não têm nenhum mecanismo reprodutível de aplicação à BD dentro do repositório. | Introduzir `drizzle-kit` com pasta `drizzle/migrations` versionada, mesmo que a plataforma de deploy também sincronize automaticamente — para ter um histórico auditável de alterações de schema. |
| T5 | Duplicação de identidade entre `user` (better-auth) e `membro` (app) | Baixa/Média | `nome`/`email` existem em ambas as tabelas e podem divergir (ex. se o `user.name` for atualizado via um futuro ecrã de perfil, `membro.nome` fica desatualizado, e vice-versa). | Decidir uma fonte de verdade única para nome/email e derivar a outra, ou documentar explicitamente porque coexistem. |
| T6 | Sem `.env.example` | Baixa | Nenhuma documentação de que variáveis de ambiente são necessárias (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) — descobertas apenas por leitura do código durante esta auditoria. | Adicionar `.env.example`. |
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
| D1 | Sem entidade `condominio`; sem multi-tenancy | Crítica | Ver `SECURITY_AUDIT.md` S9. |
| D2 | `membro.userId` sem `UNIQUE` | Média | Ver `SECURITY_AUDIT.md` S10 — risco de duplicação por corrida em concorrência. |
| D3 | `movimento.fracaoId` sem FK declarada | Baixa | Ver `SECURITY_AUDIT.md` S12. |
| D4 | Sem índices além da chave primária | Baixa/Média | Nenhuma coluna usada em `WHERE` (`membro.userId`, `movimento.fracaoId`, `ocorrencia.userId`) tem índice explícito. Sem impacto perceptível ao volume de dados de um único condomínio, mas relevante assim que existir mais do que um condomínio na mesma tabela. | Adicionar índices quando o modelo multi-tenant for introduzido (tipicamente `(condominioId, ...)` compostos). |
| D5 | Sem soft-delete em nenhuma tabela | Alta | Ver `SECURITY_AUDIT.md` S17 — combinação de risco de auditoria/RGPD/conformidade contabilística. |
| D6 | Sem `updatedAt` na maioria das tabelas | Baixa | Só `ocorrencia` tem `updatedAt`. `movimento`, `aviso`, `documento`, `fracao`, `membro` não registam quando foram alterados pela última vez (distinto de quando foram criados). | Adicionar `updatedAt` de forma consistente, idealmente como parte da introdução do log de auditoria. |
| D7 | Backups/recuperação | Não verificável | Depende inteiramente do provedor de hospedagem da base de dados (não documentado no repositório). | Documentar e confirmar explicitamente a política de backup (frequência, retenção, teste de restauro) do provedor escolhido antes de qualquer uso com dados reais. |

## 5. UX/UI

Avaliação qualitativa (não foi possível testar num browser real por falta de BD; baseada em leitura de todos os componentes/páginas e nas convenções do design system `components/ui/*`):

**Pontos positivos:**
- Interface consistente, em português, com bom uso de estados vazios ("Ainda não existem avisos.", etc.) em todas as listagens.
- Uso de `aria-label` em botões só com ícone (ex. `MovimentoActions`, `AvisoActions`) — bom sinal de atenção básica a acessibilidade.
- Layout responsivo via Tailwind (`sm:`, `lg:` breakpoints), sidebar colapsável em mobile.
- Mensagens de erro traduzidas para português mesmo nos erros vindos do better-auth (`traduzErro` em `auth-form.tsx`).

**Lacunas:**
- Sem paginação, pesquisa nem filtros em nenhuma tabela/lista (finanças, ocorrências, condóminos, frações) — usável com poucos registos, torna-se impraticável com um condomínio real ao fim de 1–2 anos de lançamentos financeiros.
- Sem ordenação configurável pelas colunas das tabelas.
- Sem confirmação antes de ações destrutivas (`eliminarMovimento`, `eliminarAviso`, etc. disparam de imediato ao clicar, sem diálogo de confirmação) — risco de eliminação acidental, agravado pela ausência de soft-delete (D5).
- Sem indicação visual de carregamento na navegação inicial entre páginas (só os botões de submissão de formulário têm estado `pending`).
- Não verificado (requer teste manual num browser): contraste de cores das badges customizadas (`bg-amber-100 text-amber-800` etc.) e navegação completa por teclado nos componentes `@base-ui/react` — recomenda-se um passe de acessibilidade com um leitor de ecrã e o teclado antes de lançar.
- O admin não tem nenhuma visão agregada de "pedidos pendentes" fora da página de Condóminos (ex. um badge no menu lateral), o que é fácil de passar despercebido em condomínios com admins pouco assíduos na aplicação.

## 6. Conclusão desta secção

O código que existe é limpo, consistente e de fácil manutenção — não há indício de que seja necessário reescrever o que já está feito. O risco técnico principal não está na qualidade do código, mas em quatro ausências estruturais que se tornam mais caras de corrigir quanto mais tarde forem endereçadas: **controlo de versões, testes automatizados, migrações de schema versionadas, e o modelo de dados multi-tenant**. Ver `ROADMAP.md` para a sequência recomendada de correção.
