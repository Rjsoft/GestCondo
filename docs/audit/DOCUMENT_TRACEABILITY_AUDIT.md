# Auditoria de Documentos, Prova e Rastreabilidade — GestCondo (Fase E)

Data: 2026-07-22. Consolida as secções 8 (Documentos e Prova) e 9 (Auditoria e Rastreabilidade) do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. Verificado por leitura direta do código atual (`lib/db/schema.ts`, `app/actions/*.ts`, páginas de documentos).

## 8. Documentos e prova

### 8.1 Checklist por atributo, aplicada aos documentos existentes

| Documento | Identificação | Numeração | Data/hora | Autor | Condomínio | Versão/estado | Integridade | Proteção contra alteração silenciosa |
|---|---|---|---|---|---|---|---|---|
| Recibo (`/financas/recibo/[id]`) | ✅ `movimento.id` | 🟡 Usa `movimento.id` como "Nº" — sequencial, mas partilhado com despesas (não é uma sequência exclusiva de recibos) | ✅ | ✅ (`movimento.userId`) | ✅ | ❌ Sem conceito de "versão"; gerado a partir do estado atual do movimento | ✅ Não editável depois de gerado (é sempre recalculado a partir do movimento) | ✅ Movimento tem soft-delete, nunca `DELETE` físico |
| Relatório de movimentos (`/financas/relatorio`) | ❌ Sem identificador próprio (é uma vista agregada, não um documento registado) | ❌ | ✅ ("Gerado em") | ❌ Sem autor explícito no documento | ✅ | N/A (não é um documento versionado, é sempre o estado atual) | N/A | N/A |
| Balanço orçamento vs. real (`/financas/balanco/[id]`) | 🟡 Usa `orcamento.id` | ❌ | ✅ | ❌ | ✅ | N/A (idem) | N/A | N/A |
| Convocatória de assembleia | 🟡 É o próprio registo `assembleia`, sem documento separado gerado; enviada por email (`lib/email.ts`) | ❌ **Sem número sequencial de assembleia** (ex. "1ª Assembleia Ordinária de 2026") — só existe `assembleia.id` interno | ✅ `dataPrimeiraConvocatoria` | ✅ `userId` | ✅ | ✅ `estado` (`convocada/realizada/aprovada/cancelada`) | ✅ | ✅ Bloqueada após `aprovada` |
| Ata (`/assembleias/ata/[id]`) | 🟡 Idem — sem número próprio de ata | ❌ Mesmo gap | ✅ | ✅ | ✅ | ✅ `estado` | ✅ Imutável após aprovação (`app/actions/assembleias.ts:24-25`) | ✅ Confirmado por código — qualquer escrita numa assembleia `aprovada`/`cancelada` é rejeitada |
| Procurações (dentro da ata) | ✅ `assembleia_presenca.tipo='procuracao'` | N/A | ✅ | N/A | ✅ | ✅ Imutável com a ata | ✅ | ✅ |
| Orçamento | ✅ `orcamento.id`, único por (condomínio, ano) | 🟡 O ano funciona como "número" de facto | ✅ `createdAt` | ✅ | ✅ | ❌ Sem histórico de versões — alterar um orçamento existente sobrescreve o valor anterior (`onConflictDoUpdate`) | ❌ **Sem histórico de alterações ao valor do orçamento** | ❌ Ver LEGAL-02 (Fase D) — pode ser alterado sem ligação a uma nova deliberação |
| Deliberações (`assembleia_ponto.resultado`) | ✅ | N/A (numerado por `ordem` dentro da assembleia) | ✅ (`createdAt` do ponto) | ✅ | ✅ | ✅ Imutável com a assembleia | ✅ | ✅ |
| Declarações/certidões de dívida | ❌ Funcionalidade inexistente (ver `LEGAL-01`, Fase D) | — | — | — | — | — | — | — |
| Comunicações (avisos) | ✅ `aviso.id` | ❌ | ✅ | ✅ | ✅ | ❌ Sem versão — editar um aviso sobrescreve o texto anterior sem histórico | ❌ | ❌ `DELETE` físico (não soft-delete) |
| Documentos carregados | ✅ `documento.id` | ❌ | ✅ | ✅ | ✅ | ❌ Substituir um documento perde a versão anterior (já em `FUNCTIONAL_GAPS.md`) | 🟡 Ficheiro em Vercel Blob, bucket público (ver `SECURITY_AUDIT.md`) | ❌ `DELETE` físico |

### 8.2 Regra "não apagar documentos financeiros/jurídicos" — verificação

A regra do prompt ("a aplicação não deve apagar documentos financeiros ou jurídicos emitidos; deve usar anulação/substituição/nova versão/estorno/aditamento/retificação") está **corretamente aplicada a `movimento`** (soft-delete, nunca `DELETE` físico — confirmado no schema e em `eliminarMovimento`). **Não está aplicada a**: `seguro` (documento com valor probatório de cumprimento de obrigação legal — seguro obrigatório do edifício), `aviso`, `documento`, `ocorrencia` — todos continuam com `DELETE` físico. Já identificado em `GDPR_CHECKLIST.md` secção 5 e reconfirmado nesta fase como **DOC-01**.

### 8.3 Achados novos desta fase (secção 8)

| ID | Título | Severidade | Prioridade |
|---|---|---|---|
| DOC-01 | `seguro`/`aviso`/`documento`/`ocorrencia` usam `DELETE` físico, não soft-delete | Média | P2 (P1 para `seguro` especificamente, por ser prova de cumprimento de obrigação legal) |
| DOC-02 | Sem número sequencial próprio para assembleias/atas (ex. "Ata n.º 3/2026") — só existe o `id` interno | Baixa | P3 |
| DOC-03 | Sem histórico de alterações ao valor de um orçamento (`onConflictDoUpdate` sobrescreve) | Média | P2 |
| DOC-04 | Recibo usa `movimento.id` como número — sequencial mas partilhado com despesas, não uma numeração exclusiva de recibos | Baixa | P3 (aceitável para condomínios sem IVA, conforme já analisado em `FUNCTIONAL_GAPS.md`/memória de sessão sobre validade fiscal de recibos) |

## 9. Auditoria e rastreabilidade

### 9.1 Cobertura do `audit_log` — operação a operação

| Operação pedida pelo prompt | Auditada hoje? |
|---|---|
| Login | ❌ Não — gerido só pelo better-auth (tabela `session`), sem espelho no `audit_log` |
| Falhas de login | ❌ Não — só nos logs efémeros da plataforma (Vercel), sem retenção definida nem consulta pela aplicação |
| Recuperação de conta (reset de password) | ❌ Não |
| Alteração de permissões (perfil) | ✅ `atualizarPerfilMembro` |
| Criação de utilizadores | ✅ (aprovação/rejeição de `membro`) |
| Exportação | ❌ **Não** — nem `exportarMeusDados()` (portabilidade RGPD) nem a exportação CSV de movimentos (que é só client-side, sem round-trip ao servidor) ficam registadas |
| Consulta de dados sensíveis | ❌ Não (decisão deliberada — só escritas são auditadas, não leituras; ver nota abaixo) |
| Criação e alteração de titulares (frações/condóminos) | ✅ |
| Mudança de proprietário | ✅ (é uma alteração de `fracao`) |
| Alteração de permilagem | ✅ (idem) |
| Aprovação de orçamento | 🟡 Criação/atualização é auditada; não existe um conceito de "aprovação" formal distinto da criação (ver LEGAL-02) |
| Emissão de quotas | ✅ `gerarQuotasOrcamento` |
| Pagamento | ✅ `marcarComoPago`/`alternarPago` |
| Recibo | ❌ Gerar/imprimir um recibo não fica registado (é uma vista, não uma ação de escrita) |
| Estorno/anulação | 🟡 Não existe um "estorno" formal — eliminação (soft-delete) é o mecanismo equivalente, e essa é auditada |
| Alteração de IBAN | N/A — **não existe nenhum campo IBAN em todo o schema** (confirmado por pesquisa direta no código) |
| Upload | ✅ (criação de documento/ocorrência/seguro com anexo) |
| Download | ❌ Não — descarregar um documento já carregado não gera registo |
| Eliminação | ✅ |
| Assembleia (convocar, alterar) | ✅ |
| Votação | ✅ Confirmado — `registarVoto` (`app/actions/assembleias.ts:302-308`) chama `registarAuditoria` com o sentido de voto e a fração |
| Ata (aprovar) | ✅ `'Ata aprovada — assembleia encerrada e imutável'` |
| Alterações jurídicas | N/A — sem funcionalidade de gestão de documentos jurídicos formais ainda |
| Acessos de suporte | N/A — não existe a funcionalidade (confirmado na Fase B, `CONTROLLER_PROCESSOR_MATRIX.md` Cenário 5) |

### 9.2 Nota sobre "consulta de dados sensíveis"

A decisão de **não auditar leituras**, só escritas, é uma decisão de desenho razoável (auditar cada consulta geraria um volume enorme de registos de baixo valor) — mas o prompt pede explicitamente para verificar isto, por isso fica documentado como decisão consciente, não como omissão.

### 9.3 Definição de retenção, consulta e proteção do `audit_log`

| Aspeto | Estado |
|---|---|
| Informação registada | Ator (id, nome), ação, entidade, id da entidade, timestamp, resumo textual opcional — nunca duplica dados pessoais sensíveis de outras tabelas |
| Prazo de retenção | ❌ **Sem prazo definido nem expurgo automático** (já identificado em `GDPR_CHECKLIST.md` e em `docs/legal/DATA_RETENTION_MATRIX.md`) |
| Quem pode consultar | ✅ admin, gestor, auditor (`requireConsultaGestao`), por condomínio (`condominioId`) |
| Proteção contra alteração | ✅ Nunca é alterado nem apagado pela aplicação — não existe nenhuma função `atualizarAuditLog`/`eliminarAuditLog` |
| Anonimização | N/A — não aplicável enquanto não houver expurgo |
| Alertas | ❌ Sem alertas automáticos (ex. muitas eliminações seguidas, muitas falhas de login) |
| Relatórios de auditoria | ✅ Página `/auditoria`, sem exportação própria (herda a limitação geral de "exportação não auditada", ver 9.1) |

### 9.4 Achados novos desta fase (secção 9)

| ID | Título | Severidade | Prioridade |
|---|---|---|---|
| AUDIT-01 | Login, falhas de login e recuperação de conta não ficam no `audit_log` — só nos logs efémeros da plataforma | Média | P2 |
| AUDIT-02 | Exportação de dados (portabilidade RGPD, CSV de movimentos) não é auditada | Média | P2 (liga-se a RGPD-02, Fase B) |
| AUDIT-03 | Download de documentos não é auditado | Baixa | P3 |

## Próxima fase

Fase F (secção 10 do prompt): contratos e documentos jurídicos necessários para exploração comercial — `docs/legal/LEGAL_DOCUMENTS_REGISTER.md`, incluindo o DPA (já identificado como urgente na Fase B).
