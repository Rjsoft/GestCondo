# Matriz Responsável / Subcontratante — GestCondo

Data: 2026-07-22. Produzido na Fase B da auditoria (`PROMPT_AUDITORIA_JURIDICA_RGPD.md` secção 4.3). Base: RGPD arts. 4º(7)/4º(8)/26º/28º. Esta matriz não assume que a plataforma é sempre subcontratante — analisa cada cenário de uso separadamente, porque o papel muda consoante quem contrata e para quê.

## Cenário 1 — Plataforma SaaS contratada por uma empresa administradora

Uma empresa de administração de condomínios (perfil `gestor`) contrata o GestCondo para gerir os condomínios dos seus clientes.

| | |
|---|---|
| Responsável pelo tratamento | A empresa administradora (decide finalidades e meios em nome dos condomínios que representa). |
| Subcontratante | O operador da instância GestCondo. |
| Corresponsabilidade | Não, desde que o operador só trate dados conforme instruções documentadas da administradora. |
| Subcontratantes posteriores | Neon, Resend, Vercel Blob, Vercel Analytics (ver `DATA_SUBPROCESSORS_REGISTER.md`) — precisam de autorização geral ou específica da administradora (art. 28º/2). |
| Contratos necessários | Acordo de Tratamento de Dados (DPA) entre operador e administradora — **em falta, ver `LEGAL_DOCUMENTS_REGISTER.md`**. |
| Instruções documentadas | Ainda não formalizadas — hoje a relação funcional (o que a app faz) substitui instruções escritas explícitas. |
| Obrigações de cada parte | Administradora: informar os condóminos, responder a pedidos de titulares que exijam decisão de mérito. Operador: segurança técnica, disponibilidade, notificar violações de dados (art. 28º/3/f). |

**Este é o cenário que o onboarding multi-condomínio (2026-07-22) tornou real** — antes só existia hipoteticamente.

## Cenário 2 — Plataforma contratada diretamente por um condomínio

Um condomínio (via o seu administrador eleito, perfil `admin`) usa o GestCondo diretamente, sem empresa de administração intermediária.

| | |
|---|---|
| Responsável pelo tratamento | O condomínio, enquanto entidade coletiva (representado pelo administrador eleito e pela assembleia). |
| Subcontratante | O operador da instância GestCondo. |
| Corresponsabilidade | Não. |
| Subcontratantes posteriores | Os mesmos do Cenário 1. |
| Contratos necessários | DPA (mesma necessidade, adaptado a um condomínio individual, tipicamente sem personalidade jurídica plena mas com capacidade judiciária — Código Civil art. 1437º). |
| Obrigações de cada parte | Idênticas ao Cenário 1, com a nuance de que o "responsável" aqui é um condomínio, não uma empresa com estrutura jurídica formal — a informação aos titulares (política de privacidade) tem de ser clara sobre quem, na prática, a representa. |

Este é o cenário do piloto real atualmente em produção (condomínio do Rui).

## Cenário 3 — Administradora que utiliza a plataforma em nome do condomínio

Variante do Cenário 1 onde é relevante distinguir: a administradora pode ser, ela própria, mandatária do condomínio (mandato de administração), não titular originário da obrigação de tratar os dados.

| | |
|---|---|
| Responsável pelo tratamento | O condomínio continua a ser o responsável "de origem"; a administradora atua como sua representante/mandatária, mas para efeitos de RGPD costuma ser tratada como responsável (ou corresponsável) porque decide meios técnicos/operacionais concretos. |
| Subcontratante | O operador da instância GestCondo. |
| Corresponsabilidade | **Possível** entre condomínio e administradora, dependendo do contrato de administração entre ambos — fora do âmbito do GestCondo, mas relevante porque a política de privacidade deve deixar claro que a app não arbitra essa relação. |
| Contratos necessários | DPA operador↔administradora; o contrato de administração condomínio↔administradora é externo à aplicação. |

## Cenário 4 — Plataforma que define autonomamente determinadas finalidades

Aplica-se a finalidades que o GestCondo decide por si (não a pedido de um condomínio/administradora específico) — ex.: métricas de utilização agregadas (Vercel Analytics), segurança da plataforma (rate limiting, deteção de abuso), melhoria do produto.

| | |
|---|---|
| Responsável pelo tratamento | O operador da plataforma GestCondo, só para estas finalidades específicas. |
| Base jurídica | Interesse legítimo (segurança, funcionamento do serviço) — nunca deve reutilizar dados operacionais dos condomínios (financeiros, atas, ocorrências) para estas finalidades sem base jurídica própria. |
| Risco identificado | O Vercel Analytics já está ativo (`app/layout.tsx`) e é exatamente este cenário — o operador é responsável por essa finalidade específica, distinta da administração do condomínio, e tem de a divulgar como tal (ver `RGPD_AUDIT.md`). |

## Cenário 5 — Serviços de suporte com acesso a dados

Hoje **não existe** uma equipa de suporte separada com acesso a dados de clientes distinto do próprio operador/administrador — a aplicação não tem um papel "staff de suporte" com acesso privilegiado a dados de qualquer condomínio. O `user.superAdmin` dá poderes de gestão apenas em condomínios a que a pessoa também pertença como `membro` (não é um acesso de suporte cross-tenant sem fricção).

| | |
|---|---|
| Estado atual | Sem cenário de acesso de suporte a auditar — não existe a funcionalidade. |
| Risco se vier a existir | Qualquer futuro acesso de suporte cross-tenant tem de ser temporário, justificado e auditado (ver `PROMPT_AUDITORIA_JURIDICA_RGPD.md` secção 4.5) — não codificar sem esse controlo. |

## Cenário 6 — Fornecedores tecnológicos externos

| Fornecedor | Papel RGPD | Função |
|---|---|---|
| Neon (PostgreSQL) | Subcontratante | Alojamento de toda a base de dados. |
| Resend | Subcontratante | Envio de email transacional. |
| Vercel Blob | Subcontratante | Armazenamento de ficheiros. |
| Vercel Analytics | Subcontratante (ou responsável autónomo, ver Cenário 4) | Métricas de utilização agregadas. |
| Have I Been Pwned (via better-auth) | Fora do âmbito de subcontratação clássica | Recebe só um prefixo de hash SHA-1 da password (k-anonimato) — não deveria constituir, por si, um tratamento de dados pessoais identificáveis, mas fica registado por transparência. |

Ver `DATA_SUBPROCESSORS_REGISTER.md` para o detalhe completo (localização, salvaguardas, transferências).

## Conclusão

Não se pode assumir uma resposta única "a plataforma é sempre subcontratante" — no Cenário 4 (Vercel Analytics, segurança da plataforma) o operador é responsável autónomo. A prioridade prática imediata é o **DPA para os Cenários 1 e 2** (agora ativos), e a **divulgação do Cenário 4** na Política de Privacidade.
