# Registo de Atividades de Tratamento — GestCondo

Data: 2026-07-09. Documento interno de governação (art. 30º RGPD), não uma peça jurídica nem um documento público — o equivalente para o titular do dado é a Política de Privacidade (`/privacidade`). Elaborado a partir do inventário de dados já feito em `GDPR_CHECKLIST.md` secção 1. Deve ser revisto por um jurista e mantido atualizado sempre que uma nova finalidade de tratamento for introduzida (ex. quando o fluxo de onboarding multi-condomínio ou o módulo de fornecedores existirem).

**Responsável pelo tratamento:** o operador da instância GestCondo (o administrador/empresa gestora que opera a aplicação para o(s) seu(s) condomínio(s)). **Subcontratados (processadores):** fornecedor de alojamento e base de dados (Neon/PostgreSQL), fornecedor de email transacional (Resend), fornecedor de armazenamento de ficheiros (Vercel Blob).

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
| Finalidade | Gestão de quotas e despesas do condomínio, dívida por fração, orçamento anual, seguro obrigatório, fundo comum de reserva. |
| Base legal | Cumprimento de obrigação legal (Código Civil arts. 1430º+, DL n.º 268/94 para o fundo de reserva) e execução de contrato. |
| Categorias de dados | Valores monetários associados a uma fração/proprietário, estado de pagamento, dados da apólice de seguro. |
| Titulares | Proprietários/condóminos. |
| Destinatários | Administradores, gestores, auditores e o próprio condómino titular da fração (`PERFIS_ACESSO_FINANCEIRO`) — nunca inquilinos/fornecedores. |
| Prazo de conservação | Retenção legal contabilística/fiscal — eliminação lógica apenas (soft-delete, `movimento.deletedAt`), nunca `DELETE` físico, precisamente por esta obrigação. |

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
| Destinatários | Vercel Blob (armazenamento, bucket público — ver nota de controlo de acesso em `FUNCTIONAL_GAPS.md` secção 6); dentro da app, apenas quem já tem acesso à página onde o ficheiro é referenciado. |
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

Ver `/privacidade` e `/os-meus-dados` (autogestão: ver, corrigir nome/telefone, exportar dados próprios, eliminar conta). Pedidos que não possam ser resolvidos por autogestão (ex. oposição, correção de dados geridos só por admin) são processados manualmente pelo administrador do condomínio até existir um fluxo dedicado.
