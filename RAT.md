# Registo de Atividades de Tratamento — GestCondo

Data: 2026-07-09, **atualizado 2026-07-22** (Fase B da auditoria jurídica/RGPD — `PROMPT_AUDITORIA_JURIDICA_RGPD.md`). Documento interno de governação (art. 30º RGPD), não uma peça jurídica nem um documento público — o equivalente para o titular do dado é a Política de Privacidade (`/privacidade`). Elaborado a partir do inventário de dados já feito em `GDPR_CHECKLIST.md` secção 1 e em `docs/audit/SYSTEM_DATA_MAP.md`. Deve ser revisto por um jurista e mantido atualizado sempre que uma nova finalidade de tratamento for introduzida.

**Atualização 2026-07-22:** o fluxo de onboarding multi-condomínio referido abaixo como condição para o Acordo de Subcontratação (DPA) **já existe em produção** — uma empresa administradora (`perfil: gestor`) já pode gerir mais do que um condomínio na mesma conta. O DPA deixou de ser uma necessidade futura hipotética — ver `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` e `docs/legal/LEGAL_DOCUMENTS_REGISTER.md`.

**Responsável pelo tratamento:** o operador da instância GestCondo, ou a empresa administradora/condomínio que a contrata, consoante o cenário (ver `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` para a distinção completa por cenário). **Subcontratados (processadores):** fornecedor de alojamento e base de dados (Neon/PostgreSQL), fornecedor de email transacional (Resend), fornecedor de armazenamento de ficheiros (Vercel Blob), e **Vercel Analytics** (métricas de utilização, ativo em produção desde antes desta auditoria mas **não documentado até agora** — ver `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`).

## 1. Gestão administrativa do condomínio (frações, condóminos, avisos, ocorrências)

| | |
|---|---|
| Finalidade | Administração do condomínio: gestão de frações, identificação de proprietários/inquilinos, comunicação de avisos, gestão de ocorrências/manutenção. |
| Base legal | Execução de contrato / cumprimento de obrigação legal (regime da propriedade horizontal, Código Civil arts. 1430º e seguintes) — não consentimento. |
| Categorias de dados | Nome, email, telefone, identificação da fração, perfil (proprietário/inquilino/fornecedor/etc.), conteúdo de avisos e ocorrências reportadas (pode incluir dados pessoais de terceiros mencionados em texto livre). |
| Titulares | Condóminos (proprietários e inquilinos), administradores, fornecedores com conta na aplicação. |
| Destinatários | Restantes membros aprovados do mesmo condomínio (âmbito varia por perfil — ver `lib/perfis.ts`); nunca membros de outro condomínio (isolamento por `condominioId`, ver `SECURITY_AUDIT.md` S9). |
| Prazo de conservação | Enquanto a conta permanecer ativa; ver `GDPR_CHECKLIST.md` secção 5 para prazos concretos. |
| Transferências para países terceiros | Nenhuma identificada — subprocessadores operam dentro da UE/EEE (a confirmar a região exata da instância Neon/Vercel/Resend contratada). |

## 2. Autenticação e gestão de contas

| | |
|---|---|
| Finalidade | Criar e autenticar contas de utilizador, recuperação de password, verificação de email. |
| Base legal | Execução de contrato (prestação do serviço) e interesse legítimo (segurança da conta). |
| Categorias de dados | Nome, email, password (hash, nunca em texto simples), IP e user agent da sessão (`session.ipAddress`/`userAgent`, geridos pelo better-auth). |
| Titulares | Todos os utilizadores registados. |
| Destinatários | Nenhum além do próprio sistema; emails de verificação/reset enviados via Resend (subprocessador). |
| Prazo de conservação | Sessões expiram em 7 dias (`lib/auth.ts`); conta e dados de autenticação mantidos enquanto a conta existir — eliminável pelo próprio titular via `/os-meus-dados` (ver secção 4). |

## 3. Gestão financeira (quotas, despesas, orçamento, seguro, fundo de reserva)

| | |
|---|---|
| Finalidade | Gestão de quotas e despesas do condomínio, dívida por fração, orçamento anual, seguro obrigatório, fundo comum de reserva. **Desde 2026-07-24 (Fase A.1, desenvolvimento apenas)**: exercícios financeiros e contas bancárias/caixa do condomínio como entidades próprias (`exercicio_financeiro`, `conta_financeira`, `saldo_inicial_conta`). |
| Base legal | Cumprimento de obrigação legal (Código Civil arts. 1430º+, DL n.º 268/94 para o fundo de reserva) e execução de contrato. |
| Categorias de dados | Dados de identificação da fração e do condómino, quotas, receitas, despesas, movimentos, saldos, exercícios financeiros, contas financeiras e respetiva informação bancária. O IBAN está normalmente associado ao condomínio enquanto pessoa coletiva, mas pode constituir dado pessoal quando pertence ou permite identificar uma pessoa singular, designadamente numa conta pessoal utilizada excecionalmente para a gestão do condomínio. |
| Titulares | Proprietários/condóminos; relativamente ao IBAN, normalmente o condomínio enquanto pessoa coletiva. Em situações excecionais, nomeadamente quando seja utilizada uma conta pessoal de um administrador residente, o IBAN pode constituir dado pessoal de uma pessoa singular. Ver `GDPR_CHECKLIST.md`, secção 1. |
| Destinatários | Administradores, gestores, auditores e o próprio condómino titular da fração (`PERFIS_ACESSO_FINANCEIRO`) — nunca inquilinos/fornecedores. IBAN/nota interna da conta só visíveis a quem tem `temConsultaGestao()` (admin/gestor/auditor) — os restantes perfis com acesso financeiro veem a conta mas não o IBAN. |
| Prazo de conservação | Retenção legal contabilística e fiscal — nos movimentos, a aplicação utiliza eliminação lógica através de `movimento.deletedAt`, sem eliminação física pela aplicação. `exercicio_financeiro`, `conta_financeira` e `saldo_inicial_conta` não dispõem, nesta fase, de operação funcional de eliminação. Este é o estado técnico atual e não constitui, por si só, uma política formal de retenção. Os prazos e critérios de conservação permanecem sujeitos à validação jurídica e contabilística indicada em `docs/legal/DATA_RETENTION_MATRIX.md`. |

## 4. Assembleias (convocatórias, presenças, votação, atas)

| | |
|---|---|
| Finalidade | Convocar e documentar assembleias de condóminos: ordem de trabalhos, presenças/procurações, votação e deliberações, ata. |
| Base legal | Cumprimento de obrigação legal (Código Civil arts. 1430º–1438º-A — a ata é o registo legal das deliberações). |
| Categorias de dados | Nome do representante presente/procurador, permilagem votante por fração, sentido de voto por fração, texto livre da ata. |
| Titulares | Proprietários (via a sua fração) e representantes/procuradores. |
| Destinatários | Todos os membros aprovados do condomínio (a ata é, por natureza, um documento a comunicar a todos os condóminos). |
| Prazo de conservação | Sem prazo de eliminação definido — atas são registo legal permanente da vida do condomínio; uma vez aprovada, a ata é imutável (`assembleia.estado = 'aprovada'` bloqueia alterações, ver `app/actions/assembleias.ts`). |

## 5. Documentos, fotos de ocorrências e apólices (upload de ficheiros)

| | |
|---|---|
| Finalidade | Partilha de documentos do condomínio (atas antigas, regulamento), fotos de ocorrências reportadas, anexo da apólice de seguro. |
| Base legal | Execução de contrato / cumprimento de obrigação legal. |
| Categorias de dados | Ficheiros que podem conter dados pessoais de condóminos ou terceiros (ex. uma foto de uma avaria pode captar pessoas identificáveis). |
| Titulares | Quem faz upload e, potencialmente, terceiros captados no conteúdo do ficheiro. |
| Destinatários | Vercel Blob (armazenamento em store **privado** desde 2026-07-22, servido só por rota autenticada que valida sessão e `condominioId` — ver `FUNCTIONAL_GAPS.md` secção 6); dentro da app, apenas quem já tem acesso à página onde o ficheiro é referenciado. |
| Prazo de conservação | Enquanto o registo (documento/ocorrência/seguro) que referencia o ficheiro existir; o ficheiro é apagado do Blob quando esse registo é eliminado (`lib/storage.ts:apagarFicheiro`). |

## 6. Auditoria interna

| | |
|---|---|
| Finalidade | Rasto de responsabilização (accountability, art. 5º/2 RGPD) — quem fez o quê, quando. |
| Base legal | Interesse legítimo / cumprimento de obrigação legal de responsabilização. |
| Categorias de dados | Ator (nome, id de utilizador), ação, entidade afetada, timestamp, resumo textual opcional — nunca duplica dados pessoais sensíveis das outras tabelas. |
| Titulares | Todos os utilizadores que realizam ações registadas. |
| Destinatários | Administradores, gestores e auditores (`requireConsultaGestao`). |
| Prazo de conservação | Sem expurgo automático definido — a avaliar face ao volume real (ver `GDPR_CHECKLIST.md` secção 5). |

## Direitos dos titulares — como são exercidos

Ver `/privacidade` e `/os-meus-dados` (autogestão: ver, corrigir nome/telefone, exportar dados próprios, eliminar conta). Pedidos que não possam ser resolvidos por autogestão (ex. oposição, correção de dados geridos só por admin) são processados manualmente pelo administrador do condomínio até existir um fluxo dedicado. Procedimento formal e limitações identificadas (ex. a exportação não inclui ainda movimentos financeiros/ocorrências do titular) em `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`.

## Documentos relacionados (Fase B da auditoria, 2026-07-22)

`docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` (papéis por cenário de uso), `docs/legal/DATA_SUBPROCESSORS_REGISTER.md` (detalhe de cada subcontratante), `docs/legal/DATA_RETENTION_MATRIX.md` (prazos de conservação formalizados), `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`, `docs/legal/DATA_BREACH_PROCEDURE.md`, `docs/legal/DPIA_SCREENING.md`.
