# Procedimento de migração em produção

Data: 2026-07-24. Escrito depois de aplicar a migração `0024` (Fase A.1) em produção sem janela acordada, sem snapshot e sem plano de rollback testado — três lacunas reais dessa execução (`docs/CHECKLIST_TESTE_MANUAL.md`, casos P02/P03/P09). Este documento fecha essas lacunas para a próxima migração.

**Atualização 2026-07-25 — rede de segurança automática, não substituta deste procedimento**: desde a migração `0027`, cada build da Vercel corre `scripts/check-pending-migrations.mjs` (via script `vercel-build`) antes de `next build`. Se a base de dados do ambiente a implantar tiver menos migrações aplicadas do que o repositório, o build falha e a Vercel mantém a versão anterior a servir tráfego. Isto existe porque o deploy é automático a cada push para `main` — ver incidente de 2026-07-25 em `TECHNICAL_DEBT.md` D8, o terceiro desta classe. **Continua a ser obrigatório seguir os passos abaixo e aplicar a migração antes ou imediatamente depois do push** — o gate só evita que um esquecimento vire uma avaria em produção, não aplica nada sozinho nem dispensa autorização explícita para migrar produção.

**Testado nesta sessão**: passos 3 e 4 abaixo (snapshot e verificação dos modos de restauro) foram executados a sério contra a base de dados de produção real, com autorização explícita do Rui — não é um procedimento teórico. Os restantes passos já eram seguidos nas migrações anteriores (ver `TECHNICAL_DEBT.md` D8).

## Achado estrutural: `development` não é independente de `production`

A Neon mostra os dois branches como bases de dados distintas (connection strings diferentes, isolamento de uso), mas **`development` é tecnicamente filho de `production`** (`Branches` → coluna "Parent"), não uma raiz separada. Consequência prática: **só é possível criar snapshots manuais no branch raiz** (`production`) — a opção "Create snapshot" aparece desativada em `development`. Não há forma de testar a criação de um snapshot sem o fazer em produção.

## Procedimento, passo a passo

### 1. Antes de qualquer coisa
- Autorização explícita do Rui, registada por escrito (não implícita por um "sim" a outra pergunta).
- Rever o SQL da migração uma última vez — confirmar que não há `DROP`/`ALTER` destrutivo inesperado.

### 2. Janela de intervenção
- Combinar previamente uma janela de baixo impacto (não é preciso ser fora de horas — o piloto tem hoje um único utilizador real — mas a decisão tem de ser explícita, não assumida por omissão).

### 3. Snapshot manual (novo passo obrigatório)
1. Neon Console → projeto GestCondo → branch **`production`** (confirmar no seletor lateral antes de continuar — `development` não suporta esta ação).
2. `Backup & Restore` → secção "Or restore from a snapshot" → `Create`.
3. Confirmar na lista que o snapshot aparece com timestamp de agora e "Expires on: never".

**Limite do plano Free**: só existe espaço para **1 snapshot manual de cada vez** — criar um novo obriga a que o anterior deixe de ficar disponível (confirmado pela mensagem "Upgrade for more snapshots" / "You've reached the manual snapshot limit"). Não é preciso apagar nada à mão; criar um novo snapshot antes de cada migração é suficiente.

### 4. Se for preciso reverter — dois modos, escolher o certo

Confirmado no próprio texto da interface da Neon (`Restore` → menu do snapshot):

| Modo | O que faz | Quando usar |
|---|---|---|
| **One-step restore** | Substitui os dados do branch atual pelo snapshot. Mesmo nome de branch, mesma connection string — só o ID interno do branch muda. | Só depois de ter a certeza absoluta de que é isto que se quer — é destrutivo sobre o estado atual. |
| **Multi-step restore** | Cria um **branch novo** a partir do snapshot, para inspecionar antes de decidir trocar. | **Preferir sempre este primeiro** — permite confirmar que os dados restaurados são os esperados antes de qualquer coisa afetar produção a sério. |

### 5. Plano de rollback real para este tipo de migrações

As migrações deste projeto até hoje são **puramente aditivas** (`CREATE TABLE`/`ADD COLUMN`, nunca `DROP`/destrutivo — ver revisão do SQL de cada migração). Isto muda qual é a resposta correta a um problema:

- **Se o problema for no código novo** (bug, página a rebentar) e o schema estiver bem: **reverter o deploy** (rollback de deployment na Vercel, ou `git revert` + push), não o schema. Tabelas/colunas novas vazias ou não usadas são inofensivas.
- **Se o problema for nos dados** (migração corrompeu algo, o que não deveria acontecer numa migração aditiva mas pode acontecer por erro humano fora do ficheiro de migração): usar o **multi-step restore** a partir do snapshot criado no passo 3, inspecionar o branch novo, e só depois decidir.
- **Nunca usar one-step restore como primeira reação** — a devolução a um branch novo primeiro é o que separa "reverter com confiança" de "arriscar apagar trabalho feito depois do snapshot".

### 6. Depois da migração
- `pnpm db:check-drift` (com `PROD_DATABASE_URL`) — confirmar drift a zero.
- Comparar totais financeiros antes/depois (devem ser idênticos em migrações aditivas).
- Smoke test das páginas principais.
- Atualizar a checklist de validação e os documentos relevantes (`ROADMAP.md`, `FUNCTIONAL_GAPS.md`, etc.) na mesma sessão.

## O que ainda não está testado

O **multi-step restore em si** (criar de facto um branch novo a partir de um snapshot e confirmar que os dados lá aparecem corretos) não foi executado nesta sessão — criaria um branch extra a limpar depois, sem necessidade real neste momento. Fica documentado o mecanismo, confirmado pela própria interface da Neon, mas o **resultado do restauro** só será verificado a sério da primeira vez que for genuinamente preciso, ou numa sessão dedicada a testá-lo deliberadamente.
