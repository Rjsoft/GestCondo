# Auditoria RGPD e Privacidade — GestCondo

Data: 2026-07-06, **atualizado 2026-07-22** (Fase B da auditoria jurídica/RGPD completa — ver `PROMPT_AUDITORIA_JURIDICA_RGPD.md` e `docs/audit/RGPD_AUDIT.md` para a versão consolidada). Esta análise é uma auditoria técnica de conformidade, não um parecer jurídico. Antes de operar com condóminos reais, os pontos aqui identificados devem ser validados por um jurista especializado em RGPD/direito do condomínio em Portugal. A CNPD já se pronunciou especificamente sobre videovigilância em condomínios (consentimento expresso de todos os condóminos, retenção máx. 30 dias) — não aplicável hoje, o GestCondo não suporta videovigilância (ver `docs/legal/DPIA_SCREENING.md`).

**Nota importante 2026-07-22**: o GestCondo já está em produção com um condomínio real desde antes desta auditoria. As secções abaixo mantêm-se como registo histórico da evolução da conformidade, mas os pontos ainda marcados `[ ]` (por fazer) que envolvem dados já reais devem ser tratados com prioridade mais alta do que se fosse ainda um protótipo.

## 1. Dados pessoais atualmente recolhidos

| Dado | Onde | Titular | Finalidade aparente | Observação |
|---|---|---|---|---|
| Nome | `user.name`, `membro.nome` | Todos os utilizadores | Identificação | Duplicado entre `user` (better-auth) e `membro` — pode divergir sem sincronização. |
| Email | `user.email`, `membro.email`, `fracao.contactoEmail` | Todos | Login, contacto | Email de login e email de contacto do proprietário são tratados como o mesmo dado sem distinção clara de finalidade. |
| Telefone | `membro.telefone`, `fracao.contactoTelefone` | Condóminos/proprietários | Contacto | Sem indicação de opcionalidade explícita ao utilizador nem separação clara "obrigatório vs. opcional". |
| Password (hash) | `account.password` | Todos | Autenticação | Gerido pelo better-auth (hash, não em texto simples) — correto. |
| IP e user agent | `session.ipAddress`, `session.userAgent` | Todos | Gestão de sessão (better-auth) | **É dado pessoal.** Sem política de retenção definida, sem menção em qualquer aviso de privacidade (que ainda não existe). |
| Dados financeiros associados a frações/pessoas | `movimento` | Proprietários | Gestão de quotas/despesas | Potencialmente dado financeiro sensível de um agregado familiar identificável através da fração. |
| Descrição de ocorrências | `ocorrencia.descricao`, `local` | Quem reporta (e possivelmente terceiros mencionados) | Gestão de manutenção | Texto livre — pode conter dados pessoais de terceiros (ex. "o vizinho do 2ºEsq deixa o cão fazer barulho") sem qualquer aviso ou controlo. |
| Fração/identificação de imóvel | `fracao.identificacao`, `membro.fracao` | Proprietário/inquilino | Identificação da unidade | Indiretamente é dado de propriedade/morada. |
| Métricas de utilização (páginas visitadas, referrer, país aproximado) | Vercel Analytics (`app/layout.tsx`, só em produção) | Todos os visitantes | Métricas agregadas de utilização | **Identificado 2026-07-22.** Segundo o fornecedor, sem cookies nem armazenamento de IP em claro — não confirmado formalmente pelo operador. Não mencionado até agora na Política de Privacidade nem no `RAT.md` (já corrigido no `RAT.md`; falta a Política de Privacidade, Fase C). |

**Não recolhido hoje, mas necessário para o produto-alvo** (a avaliar cuidadosamente quando implementado): NIF de proprietários (para recibos/declarações de dívida), morada de correspondência se diferente da fração, dados de inquilinos distintos dos proprietários, documentos de identificação, dados bancários/IBAN (para transferências/reconciliação), fotos anexadas a ocorrências (podem conter pessoas identificáveis).

## 2. Base legal e minimização

- **Não existe qualquer documentação de base legal** por tipo de tratamento. Para a generalidade dos dados de gestão de condomínio (quotas, frações, contactos do administrador), a base legal previsível é **execução de contrato/obrigação legal** (regime da propriedade horizontal, Código Civil arts. 1430º e seguintes), não consentimento — o que é bom (não depende de opt-in revogável), mas **tem de ser documentado formalmente**, nomeadamente num Registo de Atividades de Tratamento (art. 30º RGPD).
- **Sem separação entre dados obrigatórios e opcionais** nos formulários (`components/fracoes/nova-fracao-dialog.tsx`, `components/condominos/editar-membro-dialog.tsx`) — telefone e email de contacto não estão marcados como opcionais ao utilizador nem existe explicação da finalidade no momento da recolha (princípio da transparência, art. 13º).
- **Minimização de contactos — resolvido 2026-07-07**: `getFracoes()` só devolve `contactoEmail`/`contactoTelefone` reais a quem gere o condomínio ou audita; condómino/inquilino/fornecedor recebem esses campos como `null` (ver `SECURITY_AUDIT.md` S13).

## 3. Direitos dos titulares — estado atual

| Direito (RGPD) | Implementado? | Nota |
|---|---|---|
| Acesso (art. 15º) | ✅ Implementado 2026-07-09 | Ecrã `/os-meus-dados` (`app/actions/perfil.ts:getMeuPerfil`) — qualquer membro aprovado vê os seus próprios dados. |
| Retificação (art. 16º) | ✅ Implementado 2026-07-09 | `atualizarMeuPerfil` (`app/actions/perfil.ts`) permite ao próprio corrigir nome/telefone, sem passar pelo admin — nunca aceita um `id` do cliente, sempre a própria linha do chamador. Perfil/fração continuam só editáveis por admin (decisão deliberada). |
| Apagamento (art. 17º) | ✅ Implementado 2026-07-09 | `user.deleteUser` do better-auth (`lib/auth.ts`), com confirmação por email antes de eliminar. `afterDelete` remove a linha `membro` associada (mesmo padrão de `rejeitarMembro`); `user`/`account`/`session` são removidos pelo próprio better-auth (FK `onDelete: cascade`). |
| Oposição/limitação (arts. 18º/21º) | ❌ Não | Sem mecanismo automático — processado manualmente pelo admin do condomínio por agora. |
| Portabilidade (art. 20º) | ✅ Implementado 2026-07-09 | Botão "Exportar os meus dados" em `/os-meus-dados` (`exportarMeusDados`) gera um ficheiro JSON para download. |
| Registo de consentimentos | ❌ N/A por agora | Como a base legal principal não deve ser consentimento (ver secção 2), isto é secundário — mas se no futuro existir qualquer tratamento por consentimento (ex. newsletter, marketing, partilha com terceiros), tem de existir registo de quando/como foi dado e permitir revogação. |

## 4. Privacy by design / by default

- **Falha de "by default"**: novo condómino aprovado passa a ver, por omissão, todos os dados financeiros e contactos pessoais partilhados do condomínio (ver `SECURITY_AUDIT.md` S13) — não há qualquer restrição por omissão além de "está aprovado".
- **Falha de "by design"**: o esquema de dados (`lib/db/schema.ts`) não separa dados "necessários para todos verem" de dados "só necessários ao admin" ao nível do modelo — a separação, quando existe, é feita ad-hoc no código de cada página (ex. `isAdmin &&` no JSX), o que é frágil e fácil de esquecer numa página nova.
- **Positivo**: o fluxo de aprovação de membros implementado nesta sessão (`estado: pendente/aprovado`) já é, na prática, um controlo de privacy-by-default — ninguém vê dados só por se ter registado.

## 5. Retenção de dados

- **Atualizado 2026-07-06:** registos financeiros (`movimento`) deixaram de poder ser apagados fisicamente — `eliminarMovimento` faz agora soft-delete (`deletedAt`), preservando o registo para efeitos de retenção contabilística/fiscal enquanto deixa de aparecer na UI. **Ainda não existe** uma política de retenção formal (prazos configuráveis, expurgo automático ao fim do prazo legal) nem soft-delete nas restantes tabelas (`fracao`, `aviso`, `documento`, `ocorrencia`, `membro`), que continuam a usar `DELETE` físico.
- **Sessões do better-auth** (`session` table) não têm política de limpeza automática configurada além do `expiresIn`/`updateAge` (7 dias / 1 dia) — registos expirados não são necessariamente apagados da BD (depende de rotina de limpeza do better-auth, a confirmar).
- **Prazos concretos propostos (2026-07-09, ainda não automatizados — a validar com um jurista/contabilista antes de aplicar como política final):**
  - Dados financeiros (`movimento`, `orcamento`, `seguro`): prazo legal de retenção contabilística/fiscal em Portugal (habitualmente 10 anos, a confirmar caso a caso) — soft-delete já garante que não se perde antes disso.
  - Atas de assembleia (`assembleia`, uma vez aprovada): sem prazo de eliminação — registo legal permanente da vida do condomínio.
  - Candidaturas de `membro` rejeitadas (`rejeitarMembro`): já eliminadas de imediato hoje (não há retenção alguma) — considerar se algum prazo curto de retenção é preferível para efeitos de prova, sem urgência identificada.
  - Conta de utilizador eliminada pelo próprio (`user.deleteUser`, `lib/auth.ts`): a linha `membro` é removida de imediato após confirmação por email; `user`/`account`/`session` são removidos pelo better-auth. Dados financeiros históricos já lançados mantêm-se (ver ponto acima), sem ligação visível a uma conta ativa.

## 6. Logs de auditoria

**Atualizado 2026-07-22**: cobertura operação-a-operação do `audit_log` (login, falhas de login, exportação, download, etc.) auditada em detalhe em `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md` secção 9 — 3 gaps novos identificados (AUDIT-01 a AUDIT-03), o mais relevante sendo login/recuperação de conta e exportação de dados pessoais não ficarem registados no `audit_log`.

**Atualizado 2026-07-06:** implementado um `audit_log` (ver `SECURITY_AUDIT.md` S17) — ator, ação, entidade, id, timestamp, mais um resumo em texto livre opcional (`detalhes`), sem duplicar dados pessoais de outras tabelas. Cobre as ações sensíveis: criar/eliminar movimentos, alternar pago, criar/eliminar avisos/documentos/frações, aprovar/rejeitar/editar/mudar perfil de condóminos, criar/atualizar/eliminar ocorrências. Consultável em `/auditoria` por admin/gestor/auditor. Isto resolve a ambivalência identificada anteriormente entre "menos logging = menos exposição" e a exigência de accountability do art. 5º/2 RGPD — o log guarda quem fez o quê, não dados pessoais duplicados.

## 7. Documentos e dados pessoais de terceiros

- A funcionalidade de Documentos (`app/(app)/documentos/page.tsx`) aceita apenas um link externo, não upload — logo, hoje, os documentos não estão fisicamente alojados pela aplicação. Isto muda quando o upload for implementado (ver `FUNCTIONAL_GAPS.md`): atas, faturas e contratos frequentemente contêm dados pessoais de condóminos (nomes, moradas, por vezes IBAN). Quando o upload existir, é necessário: controlo de acesso por documento (não só por categoria), armazenamento privado (não bucket público), e potencialmente redação/anonimização em documentos partilhados com terceiros externos (ex. seguradora).

## 8. Textos legais em falta

- [x] Política de Privacidade — `/privacidade`, implementado 2026-07-09 (rascunho técnico, marcado como tal na própria página — **precisa de revisão jurídica antes de utilizadores reais**). Revisão detalhada com 10 gaps encontrados em `docs/legal/PRIVACY_POLICY_REVIEW.md` (2026-07-22) — texto ainda não alterado, aguarda decisão.
- [x] Termos de Utilização — `/termos`, implementado 2026-07-09 (mesma nota de rascunho). Revisão detalhada com 12 gaps encontrados em `docs/legal/TERMS_OF_USE_REVIEW.md` (2026-07-22), incluindo um achado técnico novo (`criarCondominio` sem verificação de legitimidade de representação) — texto ainda não alterado, aguarda decisão.
- [x] Informação sobre Tratamento de Dados (aviso no momento do registo, art. 13º RGPD) — checkbox obrigatório em `components/auth-form.tsx` com link para ambos os textos, implementado 2026-07-09
- [x] Registo de Atividades de Tratamento (art. 30º RGPD) — `RAT.md`, implementado 2026-07-09
- [ ] Modelo de Acordo de Subcontratação (DPA) — **atualizado 2026-07-22: já não pode ficar adiado.** O onboarding multi-condomínio (que este documento apontava como condição para isto ser necessário) já existe em produção desde 2026-07-22 — uma empresa administradora já pode gerir vários condomínios na mesma conta. Ver análise completa por cenário em `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` e o registo de documentos necessários em `docs/legal/LEGAL_DOCUMENTS_REGISTER.md`.
- [ ] Divulgação do Vercel Analytics como subprocessador — **novo, identificado 2026-07-22.** Integração ativa em produção (`app/layout.tsx`), ausente da Política de Privacidade e deste registo até agora. Ver `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`.

## 9. Checklist de conformidade RGPD (para acompanhar progresso)

### Base e governação
- [x] Registo de Atividades de Tratamento (art. 30º) elaborado — `RAT.md`, 2026-07-09
- [x] Base legal documentada por tipo de dado/finalidade — `RAT.md`, 2026-07-09
- [ ] Avaliação de Impacto sobre a Proteção de Dados (DPIA) se o volume/sensibilidade justificar (dados financeiros de muitos titulares + potencial dados sensíveis em ocorrências)
- [ ] Nomeação de responsável de proteção de dados ou ponto de contacto, se aplicável face ao volume

### Transparência
- [x] Política de Privacidade publicada e acessível antes do registo — `/privacidade`, 2026-07-09 (rascunho técnico, requer revisão jurídica)
- [x] Termos de Utilização publicados — `/termos`, 2026-07-09 (idem)
- [x] Aviso de finalidade no momento do registo — checkbox obrigatório em `components/auth-form.tsx`, 2026-07-09
- [ ] Distinção clara entre campos obrigatórios e opcionais em todos os formulários (fora de âmbito desta sessão)

### Direitos dos titulares
- [x] Ecrã de autogestão "Os meus dados" (ver, corrigir) — `/os-meus-dados`, 2026-07-09
- [x] Função de exportação de dados pessoais (portabilidade) — `/os-meus-dados`, 2026-07-09
- [x] Função de eliminação de conta (com efeitos claros sobre dados que têm de ser retidos por obrigação legal, ex. registos financeiros) — `user.deleteUser` (`lib/auth.ts`), 2026-07-09, com confirmação por email
- [ ] Mecanismo de pedido de oposição/limitação, mesmo que processado manualmente numa fase inicial

### Segurança e minimização (cruzar com `SECURITY_AUDIT.md`)
- [x] Controlo de acesso a contactos pessoais restrito ao necessário — 2026-07-07 (só admin/gestor/auditor veem contactos reais; inquilino/fornecedor já não veem dados financeiros/patrimoniais desde 2026-07-06)
- [x] Isolamento multi-condomínio implementado — 2026-07-06 (schema + todas as queries; falta o fluxo de onboarding para um 2º condomínio, ver `FUNCTIONAL_GAPS.md`)
- [ ] Cifra em trânsito (HTTPS obrigatório em produção) e em repouso (a confirmar com o provedor de BD)
- [x] Log de auditoria de acessos/alterações a dados pessoais e financeiros — 2026-07-06 (`audit_log`, página `/auditoria`)
- [x] Rate limiting explícito no better-auth — 2026-07-09 (`lib/auth.ts`, `storage: 'memory'` — não sobrevive a múltiplas instâncias serverless, ver `SECURITY_AUDIT.md` S5)

### Retenção e ciclo de vida
- [x] Política de retenção definida por tipo de dado — proposta em secção 5 (2026-07-09), ainda não validada por jurista/contabilista nem automatizada (expurgo automático continua por fazer)
- [x] Soft-delete + expurgo programado em vez de `DELETE` imediato — 2026-07-06, mas só para `movimento` (o caso legalmente mais crítico); `fracao`/`aviso`/`documento`/`ocorrencia` continuam com `DELETE` físico; `membro` também, exceto no caso da autoeliminação de conta (2026-07-09), que já regista auditoria antes de remover
- [ ] Rotina de limpeza de sessões expiradas confirmada

### Terceiros
- [ ] Modelo de Acordo de Subcontratação (DPA) para empresas de administração clientes — **atualizado 2026-07-22: o onboarding multi-condomínio já existe, isto já não pode ficar adiado.** Ver `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md`.
- [x] Lista de subprocessadores documentada — `RAT.md` e `/privacidade`, 2026-07-09; **atualizada 2026-07-22** com o Vercel Analytics (`docs/legal/DATA_SUBPROCESSORS_REGISTER.md`) — a Política de Privacidade em `/privacidade` ainda não foi atualizada com esta adição (ver Fase C da auditoria).

### Novo desde 2026-07-22 (Fase B da auditoria — ver `docs/audit/RGPD_AUDIT.md`)
- [x] Matriz responsável/subcontratante por cenário de uso — `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md`
- [x] Registo de subcontratantes com detalhe (localização, salvaguardas) — `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`
- [x] Matriz de retenção formal por categoria de dado — `docs/legal/DATA_RETENTION_MATRIX.md`
- [x] Procedimento de exercício de direitos formalizado — `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`
- [x] Procedimento de resposta a violações de dados — `docs/legal/DATA_BREACH_PROCEDURE.md`
- [x] Avaliação de necessidade de DPIA — `docs/legal/DPIA_SCREENING.md` (conclusão: não necessária hoje)
- [ ] DPIA_TEMPLATE.md — não criado, por não ser necessário face à conclusão acima

## 10. Prioridade

**Atualizado 2026-07-22:** com o DPA agora ativamente necessário (onboarding multi-condomínio em produção) e o gap do Vercel Analytics identificado, a prioridade imediata passou a ser: (1) negociar/redigir o DPA, (2) atualizar `/privacidade` com o Vercel Analytics, (3) decidir sobre a exportação de dados incompleta (`docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`). MFA já está feito (`SECURITY_AUDIT.md` S3, 2026-07-21); auditoria de segurança externa continua recomendada antes do primeiro cliente pagante fora do piloto.

**Histórico (2026-07-09):** as três ações de maior relação impacto/esforço identificadas em 2026-07-06 estão feitas.

1. ✅ Redigir e publicar Política de Privacidade + Termos, e mostrar o aviso de finalidade no registo — **feito 2026-07-09**.
2. ✅ Substituir `DELETE` físico por soft-delete em `movimento` — feito 2026-07-06. Falta ainda para (no futuro) atas/deliberações, quando esse módulo existir.
3. ✅ Ecrã de autogestão de dados pessoais para o condómino (ver os seus próprios dados, pedir correção) — **feito 2026-07-09** (`/os-meus-dados`), com exportação e eliminação de conta incluídas.
