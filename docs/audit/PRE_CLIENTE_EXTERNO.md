# O que tem de estar concluído antes do primeiro cliente externo

Data: 2026-07-22, **atualizada 2026-07-24** (Fase A.1 — exercícios e contas financeiras). Consolida, num só sítio, o que já estava disperso por `RGPD_AUDIT.md`, `TERMS_OF_USE_REVIEW.md`, `PRIVACY_POLICY_REVIEW.md`, `LEGAL_COMPLIANCE_AUDIT.md` e `ROADMAP.md`. "Cliente externo" = alguém que não sejas tu: um condómino real de fora, ou uma empresa de administração terceira.

Nada disto bloqueia o piloto atual (és só tu). Bloqueia entrar com o próximo.

**Três decisões diferentes, que este documento não confunde**:
1. **Continuação do desenvolvimento** — permitida sempre; desenvolvimento, testes e consolidação documental podem continuar sem que nenhum dos bloqueadores comerciais abaixo esteja concluído.
2. **Preparação técnica de produção** — possível, mas controlada; podem ser preparados plano de migração, snapshot, rollback, verificações de drift, validação de extensões e checklist operacional, sem acesso ou alteração real de produção até autorização explícita.
3. **Disponibilização a cliente externo** — bloqueada até os itens 1–7 abaixo estarem concluídos e validados; não realizar onboarding comercial, tratamento de dados de cliente real ou disponibilização contratual antes disso.

Preparação técnica **não equivale** a autorização para migração, deploy, onboarding comercial ou tratamento de dados de um cliente real.

## Obrigatório

| # | Item | Porquê é bloqueador | Depende de |
|---|---|---|---|
| 1 | Identidade legal do operador (nome, NIF, morada) e contacto de privacidade | Sem isto, a Política de Privacidade e os Termos ficam com `[A preencher]` visível — não publicável a sério | **Decisão tua** |
| 2 | Foro competente nos Termos | Depende do item 1 (sede/domicílio do operador) | **Decisão tua**, depois de 1 |
| 3 | Classificação B2B / B2C / misto nos Termos | Determina se se aplicam regras de proteção do consumidor (RAL/ODR já estão genéricas, mas a classificação em si falta) | Confirmação jurídica externa |
| 4 | DPA (Acordo de Tratamento de Dados) preenchido e assinado | Obrigatório por lei (art. 28º RGPD) sempre que uma empresa administradora terceira trata dados por tua conta. **Modelo já pronto** (`docs/legal/DPA_TEMPLATE.md`) — falta só preencher com os dados do cliente real e celebrar | Surgir o cliente + item 1 |
| 5 | Contrato SaaS (comercial) | Sem isto não há relação contratual formal com o cliente | Decisão de modelo de negócio (preço, condições) |
| 6 | DPA dos teus próprios subcontratantes (Neon, Resend, Vercel) | Accountability RGPD (art. 28º) — precisas de conseguir demonstrar que também tu tens isto em ordem com quem processa dados por tua conta | Contactar cada fornecedor (`docs/legal/DATA_SUBPROCESSORS_REGISTER.md`) |
| 7 | Registo formal de pedidos de oposição/limitação de dados (RGPD-06) | Hoje só há autosserviço (exportar/eliminar). Pedidos fora disso (oposição, limitação) não têm processo formal | Definir um processo mínimo (pode ser tão simples como um email dedicado + registo manual) |

Estes 7 itens são **bloqueadores para o primeiro cliente externo**, independentemente do estado de qualquer funcionalidade técnica (incluindo a Fase A.1) — nenhum deles é introduzido, resolvido ou dispensado pela Fase A.1.

## Fortemente recomendado, não estritamente bloqueador

| # | Item | Nota |
|---|---|---|
| 8 | Auditoria de segurança externa (pentest ligeiro) | Recomendado no `ROADMAP.md` antes do primeiro cliente pagante — vai além do que uma revisão de código consegue cobrir |
| 9 | Confirmar domínio próprio + `BETTER_AUTH_URL` | Já preparado no código (2026-07-22) — só falta decidir e configurar o domínio quando existir |
| 10 | Rever `docs/legal/PRIVACY_POLICY_REVIEW.md`/`TERMS_OF_USE_REVIEW.md` por um jurista | Os textos já estão tecnicamente completos (18/22 gaps fechados), mas continuam marcados "rascunho técnico" |

## Fase A.1 — Exercícios e contas financeiras

**Estado**: implementada, testada e validada em desenvolvimento em 2026-07-24, **pendente de promoção e validação em produção**. A fase não introduziu novos bloqueadores gerais aos sete itens legais, contratuais e operacionais acima, nem novo subcontratante (os dados continuam só na Neon, já coberta pelo item 6). Contudo, a funcionalidade não pode ser disponibilizada em produção antes da autorização explícita e dos passos técnicos abaixo — e a ausência da Fase A.1 em produção não impede o funcionamento técnico das restantes funcionalidades já existentes, mas o onboarding comercial de um cliente externo continua bloqueado pelos itens 1–7, independentemente do estado desta fase.

### Pré-condições para promover a Fase A.1 a produção (bloqueadores da migração, não do desenvolvimento)

1. Autorização explícita do Rui.
2. Snapshot verificável da base de produção.
3. Registo dos totais financeiros relevantes antes da intervenção.
4. `db:check-drift` antes da migração.
5. Confirmação do estado de `drizzle.__drizzle_migrations` em produção.
6. Revisão final do SQL de `drizzle/0024_slim_human_fly.sql`.
7. Confirmação de disponibilidade e permissões para `btree_gist` na base de produção — **não confirmado nesta sessão**.
8. Plano de recuperação ou rollback realmente executável (ver nota abaixo — não basta a migração ser aditiva).
9. Aplicação controlada da migração.
10. `db:check-drift` depois da migração.
11. Comparação dos totais financeiros antes e depois.
12. Validação manual da Fase A.1 com dados reais.
13. Confirmação de que não existem regressões nas funcionalidades já existentes.
14. Atualização documental (`ROADMAP.md`, `FUNCTIONAL_GAPS.md`, `docs/product/MBD_GEST_GAP_ANALYSIS.md`) só depois da validação, não antes.

**Nota sobre reversibilidade**: a migração é predominantemente aditiva e não contém remoção deliberada de dados, mas **não existe reversibilidade garantida** enquanto não estiver documentado e testado um procedimento de rollback ou recuperação — a criação de tabelas, constraints, chaves estrangeiras e da extensão `btree_gist` exige um plano explícito de recuperação, não apenas a afirmação de que "é aditiva". Estado: pendente. Bloqueia migração em produção: sim. Bloqueia desenvolvimento: não.

### Acessibilidade e teste com NVDA

O teste real com leitor de ecrã permanece pendente (`docs/audit/ACCESSIBILITY_AUDIT.md`, secção 5). Não impede a continuação do desenvolvimento nem, isoladamente, a preparação técnica da migração, mas deve ser concluído antes de declarar a aplicação plenamente validada em acessibilidade ou pronta para disponibilização generalizada a clientes externos. A aplicabilidade jurídica concreta dos requisitos de acessibilidade depende do serviço, mercado, contrato e enquadramento aplicável, devendo ser confirmada antes da comercialização.

Classificação: bloqueia desenvolvimento — não. Bloqueia migração técnica isolada — não. Bloqueia declaração de acessibilidade concluída — sim. Recomendado antes do primeiro cliente externo — sim. Validação jurídica do âmbito — pendente.

### Retenção de dados

O prazo de 10 anos usado em `docs/legal/DATA_RETENTION_MATRIX.md` permanece uma **referência provisória e condicionada**. A aplicabilidade a cada categoria, o evento inicial da contagem e o tratamento de contas eventualmente tituladas por pessoas singulares devem ser validados jurídica e contabilisticamente antes de a política ser apresentada a clientes como definitiva.

Classificação: bloqueia desenvolvimento — não. Bloqueia migração técnica isolada — não. Bloqueia política definitiva e compromisso contratual de retenção — sim. Bloqueia primeiro cliente externo se a documentação contratual depender desse prazo — sim.

### Limitações T1–T4 (`docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md`, secção 9.1b)

- **T1** (edição de conta não indica campos alterados, incl. IBAN): rastreabilidade parcial, P2, recomendação importante. Não bloqueia migração. Deve ser resolvida antes de declarar rastreabilidade financeira completa.
- **T2** (operações em massa só com total agregado): rastreabilidade agregada, P2, recomendação importante. Não bloqueia migração. Avaliar tabela ou identificador próprio de operação em massa numa iteração futura.
- **T3** (conta financeira ausente do texto de conciliação): P3, melhoria não bloqueante. Não bloqueia produção por si só.
- **T4** (reclassificação individual de movimento inexistente): limitação funcional, não é falha de auditoria, fora do âmbito da Fase A.1. Decisão futura com base nas necessidades reais dos utilizadores.

### Transferência formal entre contas e Fase A.2

A ausência de transferência formal entre contas é uma limitação funcional conhecida. O encerramento com saldo diferente de zero está corretamente bloqueado, evitando perda de rasto financeiro. A transferência formal pode ficar para uma fase seguinte, mas deve permanecer no roadmap financeiro — melhoria não bloqueante da Fase A.1, que poderá tornar-se necessária antes de um cliente com várias contas utilizar o módulo.

Fornecedores, documentos financeiros estruturados, pagamentos parciais e rubricas (Fase A.2) continuam fora do âmbito da Fase A.1. A ausência destas funcionalidades não deve ser ocultada num processo comercial — a sua condição de bloqueador depende do âmbito contratado com cada cliente.

## Não bloqueia (mas fica registado para não esquecer)

- Política de cookies dedicada, política de segurança/backups formais — documentos de maturidade, redigir quando houver tempo.
- "Três orçamentos" para obras extraordinárias, numeração sequencial de atas — funcionalidades de produto, não bloqueiam legalmente.
- T1–T4 da Fase A.1 (ver secção acima) — não bloqueiam continuação do desenvolvimento.
- Transferência formal entre contas (Fase A.1) e Fase A.2 completa — não bloqueiam continuação do desenvolvimento.
- Melhorias adicionais de auditoria e revisão estética não crítica — não bloqueiam continuação do desenvolvimento.

## Lista final de bloqueadores

**Bloqueadores para cliente externo** (têm de estar ✅ antes do onboarding comercial):
- Itens obrigatórios 1–7 (identidade legal, foro, classificação B2B/B2C, DPA, contrato SaaS, DPA dos subcontratantes, processo de oposição/limitação).
- Documentação e contratos aplicáveis a esse cliente específico.
- Validações jurídicas necessárias ao tratamento contratado.
- Definição operacional de suporte e direitos dos titulares.
- Acessibilidade mínima validada segundo o âmbito do serviço e o princípio transversal do produto.

**Bloqueadores para promover a Fase A.1 a produção** (têm de estar ✅ antes de aplicar a migração 0024):
- Autorização explícita; snapshot; drift prévio; confirmação de `btree_gist`; revisão final do SQL; plano de recuperação testado; migração controlada; drift posterior; validação de dados e totais; validação funcional em produção.

**Não bloqueiam continuação do desenvolvimento**:
- T1–T4; transferência formal entre contas; Fase A.2; melhorias adicionais de auditoria; revisão estética não crítica.

## Como usar esta lista

Antes de assinar com o primeiro cliente externo, os itens 1–7 têm de estar todos ✅ — **independentemente do estado da Fase A.1 ou de qualquer outra funcionalidade técnica**. O item 8 (pentest) é a única recomendação desta lista que envolve gastar dinheiro — vale a pena orçamentar com antecedência. Antes de promover a Fase A.1 a produção, as 14 pré-condições da secção própria têm de estar cumpridas, com autorização explícita separada da autorização de cliente externo.
