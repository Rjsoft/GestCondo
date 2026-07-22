# O que tem de estar concluído antes do primeiro cliente externo

Data: 2026-07-22. Consolida, num só sítio, o que já estava disperso por `RGPD_AUDIT.md`, `TERMS_OF_USE_REVIEW.md`, `PRIVACY_POLICY_REVIEW.md`, `LEGAL_COMPLIANCE_AUDIT.md` e `ROADMAP.md`. "Cliente externo" = alguém que não sejas tu: um condómino real de fora, ou uma empresa de administração terceira.

Nada disto bloqueia o piloto atual (és só tu). Bloqueia entrar com o próximo.

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

## Fortemente recomendado, não estritamente bloqueador

| # | Item | Nota |
|---|---|---|
| 8 | Auditoria de segurança externa (pentest ligeiro) | Recomendado no `ROADMAP.md` antes do primeiro cliente pagante — vai além do que uma revisão de código consegue cobrir |
| 9 | Confirmar domínio próprio + `BETTER_AUTH_URL` | Já preparado no código (2026-07-22) — só falta decidir e configurar o domínio quando existir |
| 10 | Rever `docs/legal/PRIVACY_POLICY_REVIEW.md`/`TERMS_OF_USE_REVIEW.md` por um jurista | Os textos já estão tecnicamente completos (18/22 gaps fechados), mas continuam marcados "rascunho técnico" |

## Não bloqueia (mas fica registado para não esquecer)

- Política de cookies dedicada, política de segurança/backups formais — documentos de maturidade, redigir quando houver tempo.
- "Três orçamentos" para obras extraordinárias, numeração sequencial de atas — funcionalidades de produto, não bloqueiam legalmente.

## Como usar esta lista

Antes de assinar com o primeiro cliente externo, os itens 1–7 têm de estar todos ✅. O item 8 (pentest) é a única recomendação desta lista que envolve gastar dinheiro — vale a pena orçamentar com antecedência.
