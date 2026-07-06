# Auditoria de Segurança — GestCondo

Data: 2026-07-06. Âmbito: código-fonte completo em `app/`, `components/`, `lib/`. Sem acesso a infraestrutura de produção (hosting, DNS, WAF, backups) — essas camadas não são avaliadas aqui e têm de ser auditadas separadamente quando existirem.

Convenção de gravidade: **Crítica** (exploração direta, dados de outros ou perda de dados) · **Alta** (exploração plausível ou ausência de controlo essencial) · **Média** (fraqueza que agrava outro problema ou UX de segurança pobre) · **Baixa** (robustez/boas práticas).

## 1. Autenticação

| # | Achado | Gravidade | Detalhe | Recomendação |
|---|--------|-----------|---------|--------------|
| S1 | Sem verificação de email | Alta | `lib/auth.ts` não define `emailAndPassword.requireEmailVerification`; `user.emailVerified` fica sempre `false` e nunca é lido em `lib/session.ts`. Qualquer email, mesmo inexistente, entra no sistema. | Ativar verificação de email obrigatória antes de conceder aprovação de acesso (ver `requireMembroAprovado`). Requer um provedor de envio de email (ver S2). |
| S2 | Sem recuperação de password | Alta | `auth.ts` não configura `sendResetPassword` nem qualquer plugin de email. Não existe nenhum ecrã "esqueci-me da password". Um utilizador que perca a password fica bloqueado permanentemente — só um acesso direto à BD resolve. | Integrar um provedor de email transacional (Resend/Postmark/SES) e configurar `sendResetPassword` + `sendVerificationEmail` no better-auth antes de qualquer utilização real. |
| S3 | Sem MFA | Média | Só email+password. Para contas de administração de condomínio (acesso a dados financeiros e pessoais de todos os condóminos) isto é insuficiente para um produto profissional. | Adicionar 2FA (TOTP) pelo menos para o perfil admin, via plugin do better-auth. |
| S4 | Política de password fraca e só client-side | Média | `components/auth-form.tsx` impõe `minLength={8}` no `<input>`, mas o better-auth não tem `minPasswordLength`/`maxPasswordLength` nem verificação de força configurados em `auth.ts`. Validação client-side é contornável. | Configurar `emailAndPassword.minPasswordLength` (>=10) no servidor; considerar bloqueio de passwords triviais/reutilizadas (have-i-been-pwned check). |
| S5 | Rate limiting não configurado explicitamente | Média | O better-auth tem rate limiting por omissão, mas é em memória (não sobrevive a restart, não funciona em múltiplas instâncias). Não há configuração explícita em `auth.ts` nem qualquer camada adicional (WAF, middleware). | Configurar `rateLimit` explicitamente no better-auth com um storage partilhado (Redis/DB) antes de produção, e/ou colocar rate limiting no edge (Vercel/WAF) para `/api/auth/*`. |
| S6 | Segredo de sessão | Alta | Não existe `.env` no repositório (correto), mas também não há validação de arranque que force a existência de `BETTER_AUTH_SECRET` em produção — o better-auth já falha com erro claro se usar o secret por omissão (confirmado durante o build desta auditoria), o que é positivo, mas depende de configuração manual do operador. | Documentar (README/`.env.example`) as variáveis obrigatórias: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Adicionar `.env.example`. |
| S7 | Cookie `sameSite: 'none'` forçado em dev | Baixa | `lib/auth.ts` força `sameSite: 'none', secure: true` quando `NODE_ENV === 'development'` (necessário para o iframe de preview do v0). Está corretamente isolado por `NODE_ENV`, mas é um ponto a confirmar sempre que o processo de deploy for definido, para garantir que nunca corre em produção. | Confirmar em CI/CD que `NODE_ENV=production` está sempre definido no build de produção. |

## 2. Autorização e modelo de acessos

| # | Achado | Gravidade | Detalhe | Recomendação |
|---|--------|-----------|---------|--------------|
| S8 | Apenas 2 perfis existem; o pedido do produto exige 7 | Crítica (para o objetivo do produto) | `Perfil = 'admin' \| 'condomino'` em `lib/session.ts`. Não há Super Admin, Empresa de administração, Proprietário vs Inquilino, Fornecedor externo, Auditor. Não é possível hoje modelar "o Sr. X é proprietário na fração A e inquilino é outra pessoa", nem uma empresa de administração a gerir vários condomínios. | Ver `FUNCTIONAL_GAPS.md` — redesenho do modelo de papéis é pré-requisito estrutural, não um ajuste incremental. |
| S9 | ~~Sem isolamento multi-condomínio (tenant isolation)~~ **Resolvido 2026-07-06** | Crítica (para o objetivo do produto) | Adicionada tabela `condominio` e coluna `condominioId` (FK `NOT NULL`) em todas as tabelas de dados do condomínio. Todas as queries de leitura, escrita, atualização e eliminação em `app/actions/*.ts` e no dashboard filtram agora por `condominioId` — incluindo as operações que recebem um `id` do cliente (`eliminarMovimento`, `atualizarEstadoOcorrencia`, etc.), que antes só filtravam por `id` e seriam um IDOR entre condomínios assim que existisse mais do que um. **Continua a faltar** (fora do âmbito desta correção): um fluxo de convite/criação de um segundo condomínio pela UI — hoje só existe um único condomínio por instalação, criado automaticamente no primeiro registo (`lib/session.ts:getMembroAtual`). O isolamento está pronto para quando esse fluxo existir; o fluxo em si ainda não existe. | Construir o fluxo de criação/convite de condomínio antes de operar mais do que um condomínio na mesma base de dados (ver `FUNCTIONAL_GAPS.md`). |
| S10 | ~~Corrida de duplicação de `membro`~~ **Maioritariamente resolvido 2026-07-06** | Média→Baixa | Adicionado índice único `(userId, condominioId)` em `membro` — duas inserções concorrentes para o mesmo utilizador/condomínio já não podem criar linhas duplicadas e inconsistentes; a segunda falha com violação de constraint na BD. **Nota residual:** `getMembroAtual()` não apanha essa violação para repetir o `SELECT` — na rara janela de corrida (dois pedidos em paralelo no primeiro acesso do mesmo utilizador), o segundo pedido veria um erro em vez de silenciosamente obter o membro já criado pelo primeiro. | Envolver o insert em `getMembroAtual()` num `try/catch` (ou `onConflictDoNothing` + reconsulta) para tratar esse caso de forma graciosa. |
| S11 | `requireAdmin()` não valida `estado` | Baixa | Documentado como aceite: promover um `membro` pendente a `perfil: 'admin'` não o aprova automaticamente; o gate na layout continua a bloqueá-lo (falha fechada, não é um buraco de segurança), mas é uma armadilha de UX/operação para o admin que o promover. | Ao promover a admin, definir `estado: 'aprovado'` na mesma operação (`atualizarPerfilMembro`). |
| S12 | ~~FK "suave" sem `.references()`~~ **Resolvido 2026-07-06** | Baixa | `movimento.fracaoId` agora referencia `fracao.id` com `onDelete: 'set null'`. |
| S13 | Exposição de contactos entre condóminos | Média (também RGPD, ver `GDPR_CHECKLIST.md`) | `getFracoes()` devolve `contactoEmail`/`contactoTelefone` de **todas** as frações a **qualquer** membro aprovado, não só ao admin. Não há necessidade funcional demonstrada para um condómino ver o telefone pessoal de outro. | Restringir campos de contacto pessoal a admin, ou tornar a partilha opt-in por condómino. |

## 3. Vulnerabilidades clássicas (OWASP)

| Classe | Estado | Nota |
|---|---|---|
| SQL Injection | ✅ Não encontrada | Todo o acesso a dados usa Drizzle ORM com parâmetros (`eq`, `and`, `.values()`). Não há SQL em texto livre em lado nenhum do código auditado. |
| XSS | ✅ Não encontrada | React escapa JSX por omissão; não existe `dangerouslySetInnerHTML` em todo o código. O único vetor plausível (`documento.url` renderizado como `href`) já valida `^https?://` em `criarDocumento` (app/actions/documentos.ts), fechando o vetor `javascript:`. |
| CSRF | ✅ Mitigado pela framework | Server Actions do Next.js validam a origem do pedido por omissão. `trustedOrigins` em `lib/auth.ts` está corretamente restrito a domínios Vercel/V0 — **tem de ser atualizado com o domínio de produção real quando este existir**, ou os logins em produção falham (ou, se configurado de forma demasiado permissiva "para resolver rápido", reabre risco de CSRF). |
| IDOR | ⚠️ Parcialmente coberto, sem rede de segurança automatizada | As ações que existem verificam propriedade corretamente (ex.: `eliminarOcorrencia` em `app/actions/ocorrencias.ts` restringe condóminos ao seu próprio `userId`). Mas **não há testes automatizados** a proteger este comportamento — uma alteração futura pode reintroduzir um IDOR sem que ninguém dê conta antes de produção. Ver `MVP_PLAN.md` secção de testes. |
| Uploads inseguros | N/A — ainda não implementado | Não existe nenhuma funcionalidade de upload de ficheiros hoje (`documento.url` é apenas um link de texto). É um requisito funcional planeado (atas, faturas, fotos de ocorrências) com risco de segurança próprio — ver recomendações abaixo antes de implementar. |
| Permissões excessivas | ⚠️ Ver S13 | Contactos pessoais partilhados além do necessário. |
| Exposição de ficheiros/segredos | ✅ Não encontrada | Sem `.env` no repositório; `.gitignore` cobre `.env*.local`. **Gap**: não cobre um simples `.env` sem sufixo — adicionar por precaução, mesmo sem repositório git ainda inicializado. |

## 4. Cabeçalhos e configuração de plataforma

| # | Achado | Gravidade | Recomendação |
|---|--------|-----------|--------------|
| S14 | Sem cabeçalhos de segurança | Média | `next.config.mjs` não define `headers()`. Faltam CSP, `X-Frame-Options`/`frame-ancestors`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`. | Adicionar `headers()` no `next.config.mjs` antes de produção. |
| S15 | ~~`typescript.ignoreBuildErrors: true`~~ **Resolvido 2026-07-06** | Média | O build de produção ignorava erros de tipo, escondendo 14 erros reais de incompatibilidade de API com `@base-ui/react` (ver `TECHNICAL_DEBT.md` T2). Corrigidos todos os erros e removida a flag — `next build` agora corre a validação de tipos e falharia se um erro de tipo futuro (incluindo um bug de segurança, ex. comparação de tipo errada numa verificação de permissão) fosse introduzido. | Nunca reativar `ignoreBuildErrors`. |
| S16 | Sem `eslint` funcional | Baixa/Média | `pnpm lint` falha com `'eslint' is not recognized...` — o pacote nem está instalado, apesar de estar referenciado em `package.json`. Nenhuma regra de lint de segurança (ex. `eslint-plugin-security`, regras do `eslint-config-next`) está a correr. | Ver `TECHNICAL_DEBT.md`. |

## 5. Logging e auditabilidade

| # | Achado | Gravidade | Recomendação |
|---|--------|-----------|--------------|
| S17 | Nenhum registo de auditoria aplicacional | Alta (também requisito legal, ver secção 4 do pedido original) | Não existe nenhuma tabela/mecanismo que registe "quem criou/alterou/apagou o quê e quando" além dos `createdAt` nas tabelas (sem `updatedAt` na maioria, sem autor da alteração, sem histórico). Todas as eliminações (`eliminarMovimento`, `eliminarAviso`, `eliminarDocumento`, `eliminarFracao`, `eliminarOcorrencia`, `rejeitarMembro`) são `DELETE` físico e definitivo, sem qualquer rasto. | Implementar uma tabela `audit_log` (ator, ação, entidade, id, timestamp, diff opcional) escrita nas ações sensíveis, e mudar eliminações de dados financeiros/deliberativos para soft-delete. Prioritário antes de qualquer uso real (ver `MVP_PLAN.md`). |
| S18 | Sem logging estruturado nem correlação de pedidos | Baixa | Não há nenhuma camada de logging (nem `console.error` nas server actions em caso de erro — os erros só chegam ao `toast` no browser). Dificulta diagnóstico de incidentes e deteção de abuso. | Adicionar logging estruturado no servidor (sem incluir dados pessoais em texto livre) com um id de correlação por pedido. |

## 6. Resumo de recomendações prioritárias de segurança

1. ~~**Bloqueador de produto (crítico):** implementar isolamento multi-condomínio (S9)~~ — **Resolvido 2026-07-06** ao nível do modelo de dados e das queries. Falta ainda o fluxo de produto para efetivamente criar/gerir um segundo condomínio (ver S9 e `FUNCTIONAL_GAPS.md`).
2. **Bloqueador de confiança (alto):** recuperação de password + verificação de email (S1, S2) — sem isto a aplicação não é utilizável com utilizadores reais não técnicos.
3. **Auditoria/accountability (alto):** `audit_log` + soft-delete em dados financeiros e (no futuro) atas/deliberações (S17).
4. **Modelo de papéis (crítico para o objetivo do produto):** redesenhar para os 7 perfis pedidos (S8).
5. Cabeçalhos de segurança, remoção de `ignoreBuildErrors`, lint funcional (S14–S16).
6. MFA para admin, rate limiting explícito, política de password no servidor (S3–S5).
7. Restringir exposição de contactos pessoais (S13).

Nenhuma das vulnerabilidades OWASP clássicas testadas (SQLi, XSS, CSRF) foi encontrada no código atual — o que existe está bem construído dentro do seu âmbito reduzido. O risco de segurança desta aplicação está concentrado em **ausência de controlos** (auditoria, recuperação de conta, isolamento multi-tenant, MFA) mais do que em código vulnerável.
