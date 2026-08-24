# Procedimento de release (código para produção)

Data: 2026-08-24. Cobre o caminho do **código** até produção. O caminho da **base de dados** (migrações) está em `docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md`, e a recuperação de **dados** em `docs/PLANO_RECUPERACAO_DESASTRE.md` — os três complementam-se e não se repetem.

Escrito para fechar o gap "Processo seguro de releases" (`FUNCTIONAL_GAPS.md` secção 10, classificado P0/P1 operacional), o último P0/P1 técnico em aberto. Até esta data existia procedimento para migrar a base de dados, mas **não existia nenhum controlo sobre o que chega a `main`** — e é o que chega a `main` que a Vercel publica automaticamente em produção.

## O problema que este procedimento resolve

Antes de 2026-08-24, um `git push origin main` publicava o código em produção **antes de o CI sequer terminar**. Se o código não compilasse, tivesse testes vermelhos ou dependesse de uma migração ainda não aplicada, a única defesa era o gate de build (`scripts/check-pending-migrations.mjs`), que só apanha o caso das migrações — não apanha um bug, um teste vermelho ou um erro de tipos.

Três incidentes reais de produção nasceram desta ausência de gate (`TECHNICAL_DEBT.md` D8), e um quarto problema — silencioso — mostrou o mesmo buraco de outro ângulo: entre 2026-08-18 (commit `776c4c1`) e 2026-08-24, **o CI esteve vermelho na `main` sem que isso impedisse nada**; o `packageManager` acrescentado ao `package.json` passou a colidir com o `version: 9` do `pnpm/action-setup`, e ninguém foi avisado porque o CI não bloqueava nada.

## Regra 1 — nada entra em `main` sem pull request e CI verde

A branch `main` tem uma regra (GitHub ruleset "Proteção da main") que exige:

| Exigência | Porquê |
|---|---|
| Pull request antes do merge | Cria o momento em que o CI corre **antes** de o código chegar a produção |
| Check `ci` verde | Lint, tipos, 229 testes unitários e build têm de passar |
| Sem force-push | O histórico de `main` deixa de poder ser reescrito |
| Sem eliminação da branch | Proteção elementar contra engano |
| Sem exceções (bypass) | Decisão explícita de 2026-08-24: a regra vale também para o dono do repositório |

**Aprovações exigidas: zero.** Trabalhas sozinho — exigir a aprovação de outra pessoa tornaria impossível publicar seja o que for. O ganho real não é a revisão por terceiros, é o **CI verde obrigatório antes do deploy**.

### Fluxo normal, comando a comando

```bash
git checkout -b feat/nome-curto           # nunca trabalhar diretamente em main
# ... alterações ...
pnpm test && pnpm exec tsc --noEmit       # falhar cedo, localmente, antes do CI
git commit -am "feat(modulo): descrição"
git push -u origin feat/nome-curto
gh pr create --fill                       # abre o PR
gh pr checks --watch                      # espera pelo CI (não fazer merge antes)
gh pr merge --squash --delete-branch       # só com o CI verde
```

O merge em `main` é o que dispara o deploy de produção. Até esse momento, nada do que fizeste afeta o site.

### E se for mesmo uma urgência?

A regra não tem exceção, e isso é deliberado. Numa urgência real o caminho continua a ser o mesmo — um PR com uma correção pequena passa o CI em poucos minutos. Se alguma vez for preciso contornar (produção em baixo, CI avariado por causa alheia), o caminho honesto é **desativar a regra no GitHub, publicar, e voltar a ativá-la de imediato** — fica registado, ao contrário de um bypass permanente que ninguém vê a ser usado.

## Regra 2 — migração de schema entra antes do código, nunca depois

Esta é a regra que os três incidentes do D8 quebraram. O deploy é automático a partir de `main`, portanto **o intervalo entre "código em produção" e "migração aplicada" é o intervalo em que a aplicação está avariada**.

Ordem obrigatória quando o PR inclui uma migração nova:

1. Aplicar a migração à base de dados de **produção** primeiro, seguindo `docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md` (autorização, snapshot, `db:check-drift`).
2. Confirmar `pnpm db:check-drift` sem divergências.
3. Só então fazer merge do PR.

Como as migrações do projeto são aditivas (`CREATE TABLE`/`ADD COLUMN`, nunca destrutivas), aplicar a migração antes do código é seguro: a versão anterior da aplicação ignora tabelas e colunas que não conhece. O contrário — código novo sobre schema antigo — é o que derruba o módulo inteiro.

Se por algum motivo o merge acontecer primeiro, o gate `scripts/check-pending-migrations.mjs` faz o build da Vercel falhar e a versão anterior continua a servir tráfego (foi o que aconteceu, como desenhado, na migração `0059` em 2026-08-17). Isso é a rede de segurança, não o plano.

## Regra 3 — confirmar o que ficou realmente publicado

Não basta ver "READY" no deploy que tu disparaste. Por causa do D9 (`TECHNICAL_DEBT.md`), **um deploy antigo ainda em fila pode chegar depois e sobrepor-se ao mais recente** — aconteceu a 2026-08-17, com um bug já corrigido a regressar em produção durante alguns minutos, sem nenhum erro reportado em lado nenhum.

Depois de cada merge, confirmar que o commit publicado é mesmo o teu:

```bash
git rev-parse --short HEAD    # o commit que esperas ver em produção
```

E comparar com o commit indicado em **Overview → Production Deployment** no painel da Vercel. Se não coincidir, há um deploy em fila por chegar — esperar e confirmar de novo antes de dar a alteração como publicada.

**Não usar o `latestDeployment` da API para isto** (corrigido 2026-08-24, depois do teste de rollback): esse campo é o **último build**, não o que está a servir tráfego. Durante o teste, `latestDeployment` continuou a apontar para `d8cb664` enquanto produção servia `9184d24`. Pior: o campo `alias` da API lista `gestcondo.vercel.app` em **todos** os deployments de produção que alguma vez o tiveram, e não só no ativo. Os dois indicadores óbvios da API estão errados para esta pergunta — a fonte fiável é o painel (Overview, ou o badge azul na lista de Deployments).

**Nunca fazer um deploy manual (`vercel --prod`) enquanto houver deploys automáticos em fila** — foi exatamente essa combinação que causou a regressão silenciosa de 2026-08-17.

## Rollback de código

Distinguir sempre o que está avariado, porque a resposta é diferente:

| Sintoma | Resposta correta | Onde está documentado |
|---|---|---|
| Bug no código novo, schema íntegro | **Rollback de deployment** (abaixo) | Este documento |
| Migração em falta (módulo inteiro em baixo) | Aplicar a migração — o rollback não resolve, o código antigo também já foi substituído | `PROCEDIMENTO_MIGRACAO_PRODUCAO.md` |
| Dados corrompidos ou apagados | Multi-step restore a partir de snapshot | `PLANO_RECUPERACAO_DESASTRE.md` |

### Rollback de deployment, passo a passo

1. Vercel → projeto `condominium-management-app` → separador **Deployments**.
2. Localizar o último deployment com estado `READY` **anterior** ao que introduziu o problema (confirmar pelo commit, não só pela hora).
3. Menu `...` desse deployment → **Instant Rollback** (a Vercel pede confirmação e indica o alias de produção afetado).
4. Confirmar em `gestcondo.vercel.app` que a versão anterior está a servir e que o sintoma desapareceu.
5. Confirmar o `githubCommitSha` do `latestDeployment` (Regra 3) — tem de ser o do deployment para onde reverteste.
6. Corrigir o problema em branch + PR (Regra 1). O rollback é uma paragem de emergência, não uma correção.

**O que o rollback de código não desfaz**: migrações já aplicadas (continuam aplicadas — e é por isso que serem aditivas importa), ficheiros já carregados no Blob, emails já enviados e dados já escritos pelos utilizadores na versão com o problema.

### Teste real do rollback (2026-08-24)

**Executado a sério em produção**, com autorização explícita — não é um procedimento teórico.

- **De**: `d8cb664` (deployment `dpl_3sf6bu…`) → **para**: `9184d24` (`dpl_inum2…`).
- **Duração**: a versão anterior serviu produção durante cerca de **4 minutos**, entre o rollback e a reposição.
- **Verificado enquanto revertido**: `gestcondo.vercel.app` abriu com a sessão iniciada, o Painel mostrou os valores reais (saldo 35 320,37 €, 17 frações) e `/financas` carregou a lista de movimentos completa (20 movimentos, total 40 215,95 €) — sem erros.
- **Reposição**: Deployments → menu do `d8cb664` → **Promote** → "Promoted Deployment successfully". Overview voltou ao estado normal ("To update your Production Deployment, push to the `main` branch"), sem barra de rollback, Error Rate 0%.
- **Nenhum dado foi alterado** durante o teste.

#### Quatro coisas que só o teste revelou

1. **No plano Hobby só se pode reverter para o deployment imediatamente anterior.** O diálogo diz "Upgrade to Pro to roll back to an earlier deployment". Se o problema tiver duas versões de idade, o Instant Rollback não chega — nesse caso é `git revert` + PR (Regra 1), que passa pelo CI e demora minutos, não segundos.
2. **Depois de um rollback, a Vercel deixa de promover deploys automaticamente** até o rollback ser desfeito ("production deployments will not be automatically promoted until the rollback is removed"). É a armadilha mais perigosa deste mecanismo: reverte-se, publica-se a correção, e a correção **não vai ao ar**. Desfazer com **Promote** sobre o deployment novo.
3. **A verificação da Regra 3 estava errada** — ver a correção na própria Regra 3 acima. `latestDeployment` continuou a apontar para `d8cb664` durante todo o tempo em que produção servia `9184d24`, e o campo `alias` da API listava `gestcondo.vercel.app` nos **dois** deployments. Nenhum dos dois serve para saber o que está a servir.
4. **O diálogo pode ficar preso a mostrar "Assigning production domains…"** com o rollback **já aplicado**. Não repetir a operação com base nesse spinner — confirmar antes na lista de Deployments (o badge azul marca o que está ativo). Nesta sessão, uma primeira tentativa de rollback foi dada como perdida por engano precisamente por causa de um ecrã ambíguo; a confirmação correta é sempre a lista, nunca o diálogo.

## Verificação depois de cada release

1. `gestcondo.vercel.app` abre e a sessão inicia.
2. As páginas do que foi alterado carregam sem erro, com dados reais.
3. `/financas` carrega (é o módulo que os incidentes anteriores derrubaram, e o que depende de mais schema).
4. Confirmar o `githubCommitSha` publicado (Regra 3).
5. Atualizar a documentação afetada na mesma sessão (`ROADMAP.md`, `FUNCTIONAL_GAPS.md`, `TECHNICAL_DEBT.md`, `/ajuda` se a alteração for visível ao utilizador final).

## O que continua por fazer

- **Ambiente de staging com dados próprios**: cada PR gera um deploy de preview. **Confirmado 2026-08-24** (painel da Vercel → Environment Variables): existem **duas entradas `DATABASE_URL` distintas**, uma com âmbito *Preview* e outra *Production* — os previews **não** escrevem na base de dados de produção. O valor está marcado "Sensitive" e não é legível no painel, pelo que *qual* base de dados o Preview usa não fica provado aqui; que **não é a de produção**, fica. **Ressalva importante**: as variáveis `BLOB_PRIVADO_*` (armazenamento de ficheiros) estão definidas como "Production and Preview" — o mesmo store — por isso um upload feito num preview **vai parar ao armazenamento real**. Não carregar ficheiros a partir de um preview.
- **Alerta proativo de erro em produção**: continua a exigir plano pago (`FUNCTIONAL_GAPS.md` secção 10), deliberadamente adiado.
- **Migrações desenhadas para deploy em duas fases** (código compatível com o schema antigo *e* com o novo): hoje resolvido pela ordem da Regra 2, o que é suficiente com um utilizador real e um único condomínio em produção. Com clientes externos e janelas de indisponibilidade a sério, passa a fazer falta.
