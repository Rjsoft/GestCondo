# Mapa do Sistema e dos Dados — GestCondo

Data: 2026-07-22. Primeira fase da auditoria jurídica/RGPD/conformidade (ver `PROMPT_AUDITORIA_JURIDICA_RGPD.md`). Levantamento feito por leitura direta do código-fonte atual (`app/`, `components/`, `lib/`, `lib/db/schema.ts`, migrações, configuração) — não a partir dos documentos de auditoria anteriores, que estão desatualizados 2–3 semanas face ao código (ver secção "Riscos preliminares").

Este documento é só um mapa factual. As avaliações de conformidade (RGPD, legislação de condomínios, segurança) ficam em `RGPD_AUDIT` (a integrar em `GDPR_CHECKLIST.md`), `LEGAL_COMPLIANCE_AUDIT.md` e `SECURITY_AUDIT.md`, produzidos nas fases seguintes.

## 1. Mapa dos módulos

| Módulo | Página(s) | Server actions | Estado |
|---|---|---|---|
| Autenticação e conta | `/sign-in`, `/sign-up`, `/esqueci-password`, `/redefinir-password`, `/onboarding` | `lib/auth.ts` (better-auth), `app/actions/condominio.ts` (`criarCondominio`, `entrarComCodigo`) | Maduro — email/password, verificação de email, reset, MFA/TOTP opcional, rate limiting. |
| Condomínio (multi-tenant) | `/condominio` | `app/actions/condominio.ts` | Maduro — onboarding por código de convite ou criação de novo condomínio (2026-07-22). |
| Frações e condóminos | `/fracoes`, `/condominos` | `app/actions/fracoes.ts` | Maduro. |
| Finanças | `/financas`, `/financas/recibo/[id]`, `/financas/relatorio`, `/financas/balanco/[id]` | `app/actions/financas.ts`, `orcamentos.ts`, `seguros.ts`, `extrato.ts` | Maduro — quotas, dívidas, orçamento, seguro (com capital seguro), balanço orçamento vs. real, fundo de reserva, conciliação bancária, recibos. |
| Assembleias | `/assembleias`, `/assembleias/ata/[id]` | `app/actions/assembleias.ts` | Núcleo P1 completo — convocatória, ordem de trabalhos, presenças/procurações, quórum, votação, ata imutável após aprovação. |
| Ocorrências | `/ocorrencias` | `app/actions/ocorrencias.ts` | Maduro — fotos via Vercel Blob. |
| Avisos | `/avisos` | `app/actions/avisos.ts` | Maduro — notificação por email para avisos importantes/urgentes. |
| Documentos | `/documentos` | `app/actions/documentos.ts` | Upload real via Vercel Blob desde 2026-07-09. |
| Auditoria (produto) | `/auditoria` | `app/actions/auditoria.ts` | `audit_log`, consulta por admin/gestor/auditor. |
| Autogestão de dados | `/os-meus-dados` | `app/actions/perfil.ts` | Acesso, retificação, exportação (parcial — ver riscos), eliminação de conta. |
| Textos legais | `/privacidade`, `/termos` | — (estáticos) | Existem, marcados como rascunho técnico a rever juridicamente. |

## 2. Mapa dos dados

Ver `lib/db/schema.ts` para o detalhe de tipos/colunas. Por entidade:

| Entidade | Dados pessoais/sensíveis relevantes |
|---|---|
| `user` / `account` / `session` / `twoFactor` (better-auth) | nome, email, password (hash), IP, user agent, segredo TOTP, códigos de recuperação. |
| `membro` | nome, email, telefone, perfil, estado, `fracaoId`, `condominioId`. |
| `condominio` | nome, morada, NIF, código de convite. |
| `fracao` | identificação, proprietário (texto livre), NIF, permilagem, contactoEmail, contactoTelefone, `isentaElevador`. |
| `movimento` | valor, tipo, categoria, `fracaoId` (liga a um proprietário identificável), meio de pagamento, referência MB, `deletedAt` (soft-delete). |
| `orcamento` | valor anual, valor anual do elevador. |
| `seguro` | seguradora, apólice, capital seguro, prémio, anexo (PDF, potencialmente com dados pessoais do segurado). |
| `extratoBancario` | data, descrição (pode conter nome do pagador), valor. |
| `assembleia` / `assembleia_ponto` / `assembleia_presenca` / `assembleia_voto` | representante presente/procurador (nome), sentido de voto por fração, texto livre da ata. |
| `ocorrencia` | descrição livre (pode conter dados pessoais de terceiros), local, foto (Vercel Blob). |
| `aviso` | título, conteúdo (texto livre). |
| `documento` | título, URL (link externo ou ficheiro no Vercel Blob). |
| `audit_log` | ator (nome/id), ação, entidade, timestamp, resumo textual opcional. |

## 3. Mapa dos intervenientes (categorias de titulares)

Administrador/gestor (`perfil: admin/gestor`), condómino proprietário, inquilino, fornecedor (perfil existe, sem fluxo de atribuição ainda), auditor (consulta), super admin (`user.superAdmin`), pessoas terceiras mencionadas em texto livre (ocorrências, notas, atas) sem conta própria.

## 4. Fluxos de dados e integrações externas

| Integração | Finalidade | Dados enviados | Localização (a confirmar) |
|---|---|---|---|
| Neon (PostgreSQL) | Base de dados principal | Todos os dados da aplicação | Branch `production`, região a confirmar (`eu-west-2` observado na connection string usada nesta sessão). |
| Resend | Email transacional (verificação, reset, eliminação de conta, convocatórias, avisos) | Nome, email, conteúdo do email | A confirmar região de processamento. |
| Vercel Blob | Armazenamento de ficheiros (documentos, fotos de ocorrências, apólices) | Ficheiros carregados, potencialmente com dados pessoais de terceiros | Bucket **público** (nota operacional conhecida — ver `FUNCTIONAL_GAPS.md` secção 6). |
| Vercel Analytics (`@vercel/analytics`) | Métricas de utilização, só em produção | Página visitada, referrer, país aproximado (via IP, não armazenado em claro segundo a Vercel) | **Não mencionado na Política de Privacidade nem no `RAT.md`** — gap identificado nesta auditoria. |
| Have I Been Pwned (via plugin `haveIBeenPwned` do better-auth) | Verificar password comprometida no registo/alteração | Só um prefixo de hash SHA-1 da password (k-anonimato) — nunca a password em claro nem dado identificável | API pública externa (Cloudflare), fora da UE possivelmente — a confirmar. |

Sem outras integrações externas identificadas (sem SMS, sem push notifications, sem CRM, sem analytics de terceiros além do Vercel Analytics).

## 5. Pontos de recolha

Registo (`/sign-up`), onboarding de condomínio, criação de fração/condómino (admin), lançamento de movimento/seguro/orçamento, criação de ocorrência/aviso/documento, convocatória e registo de presenças/voto em assembleia, importação de extrato bancário (CSV, upload manual).

## 6. Locais de armazenamento

Base de dados Neon (todos os dados estruturados), Vercel Blob (ficheiros), sessão do browser (cookie do better-auth), consola de logs do servidor Vercel (sem persistência própria configurada — ver riscos).

## 7. Locais de exportação

* CSV de movimentos financeiros (`ExportarCsvButton`, `/financas`).
* Relatório PDF de movimentos (`/financas/relatorio`, via impressão do browser).
* Balanço orçamento vs. real (`/financas/balanco/[id]`, idem).
* Recibo (`/financas/recibo/[id]`, idem).
* Exportação de dados pessoais próprios em JSON (`/os-meus-dados`, `exportarMeusDados`).
* Ata de assembleia (`/assembleias/ata/[id]`, impressão).

## 8. Riscos preliminares

1. **Documentos de conformidade desatualizados**: `RAT.md`, `GDPR_CHECKLIST.md`, `SECURITY_AUDIT.md`, `AUDIT.md` datam de 2026-07-06/09 e não refletem o onboarding multi-condomínio (2026-07-22), o capital seguro/balanço (2026-07-22), nem confirmam se `.env.example`/eslint (já resolvidos) foram atualizados nos próprios documentos.
2. **DPA em falta, agora ativamente necessário**: o onboarding multi-condomínio já permite a um `gestor` (empresa de administração) gerir mais do que um condomínio — o cenário que o `GDPR_CHECKLIST.md` §8 identificava como gatilho para um Acordo de Subcontratação já existe.
3. **Vercel Analytics não divulgado**: integração ativa em produção, ausente da Política de Privacidade e do registo de subprocessadores.
4. **Exportação de dados pessoais (portabilidade) incompleta**: `exportarMeusDados()` só devolve a linha `membro`, não os movimentos financeiros, ocorrências reportadas ou votos associados ao titular — a avaliar se isto satisfaz o art. 20º RGPD (portabilidade) ou só parcialmente o art. 15º (acesso).
5. **Sem confirmação de que `RESEND_API_KEY` está configurada em produção** — se não estiver, verificação de email/reset não chegam a utilizadores reais (o condomínio piloto real já está em produção).
6. **Bucket do Vercel Blob é público** (ficheiros acessíveis por URL direto a quem a conheça, sem controlo de acesso por ficheiro) — já documentado em `FUNCTIONAL_GAPS.md`, mas relevante para a avaliação de segurança RGPD (art. 32º) desta auditoria.
7. **Sem rotina confirmada de expurgo de sessões expiradas** nem de logs de auditoria (sem prazo de retenção definido para `audit_log`).
8. **Texto livre com dados de terceiros sem aviso**: campos como `ocorrencia.descricao` e o texto da ata de assembleia podem conter dados pessoais de pessoas sem conta na aplicação (ex. "o vizinho do 2ºEsq..."), sem qualquer aviso ao utilizador no momento de escrever.

## 9. Próxima fase

Fase B (RGPD completo, secção 4 do prompt): atualizar `RAT.md` e `GDPR_CHECKLIST.md` com os pontos acima, e criar os registos/matrizes que ainda não existem em `docs/legal/` (Controller/Processor Matrix, Data Subprocessors Register, Data Subject Rights Procedure, Data Breach Procedure, DPIA Screening) — consolidados depois em `docs/audit/RGPD_AUDIT.md`.
