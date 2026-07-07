# Auditoria RGPD e Privacidade — GestCondo

Data: 2026-07-06. Esta análise é uma auditoria técnica de conformidade, não um parecer jurídico. Antes de operar com condóminos reais, os pontos aqui identificados devem ser validados por um jurista especializado em RGPD/direito do condomínio em Portugal (a CNPD já se pronunciou especificamente sobre administração de condomínios e videovigilância/livros de presenças, entre outros temas relevantes).

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

**Não recolhido hoje, mas necessário para o produto-alvo** (a avaliar cuidadosamente quando implementado): NIF de proprietários (para recibos/declarações de dívida), morada de correspondência se diferente da fração, dados de inquilinos distintos dos proprietários, documentos de identificação, dados bancários/IBAN (para transferências/reconciliação), fotos anexadas a ocorrências (podem conter pessoas identificáveis).

## 2. Base legal e minimização

- **Não existe qualquer documentação de base legal** por tipo de tratamento. Para a generalidade dos dados de gestão de condomínio (quotas, frações, contactos do administrador), a base legal previsível é **execução de contrato/obrigação legal** (regime da propriedade horizontal, Código Civil arts. 1430º e seguintes), não consentimento — o que é bom (não depende de opt-in revogável), mas **tem de ser documentado formalmente**, nomeadamente num Registo de Atividades de Tratamento (art. 30º RGPD).
- **Sem separação entre dados obrigatórios e opcionais** nos formulários (`components/fracoes/nova-fracao-dialog.tsx`, `components/condominos/editar-membro-dialog.tsx`) — telefone e email de contacto não estão marcados como opcionais ao utilizador nem existe explicação da finalidade no momento da recolha (princípio da transparência, art. 13º).
- **Minimização de contactos — resolvido 2026-07-07**: `getFracoes()` só devolve `contactoEmail`/`contactoTelefone` reais a quem gere o condomínio ou audita; condómino/inquilino/fornecedor recebem esses campos como `null` (ver `SECURITY_AUDIT.md` S13).

## 3. Direitos dos titulares — estado atual

| Direito (RGPD) | Implementado? | Nota |
|---|---|---|
| Acesso (art. 15º) | ❌ Não | Um condómino não tem nenhum ecrã "os meus dados"; só o admin edita dados de terceiros via `atualizarMembro`. O próprio titular não consegue sequer consultar o que está guardado sobre si além do que vê nas páginas normais da app. |
| Retificação (art. 16º) | ⚠️ Parcial, só via admin | `atualizarMembro` só é chamável por admin (`requireAdmin()` em `app/actions/fracoes.ts`). O condómino não pode corrigir o seu próprio nome/telefone/fração sem pedir ao admin. |
| Apagamento (art. 17º) | ❌ Não | Não existe nenhuma função "eliminar a minha conta". `rejeitarMembro` remove a linha `membro`, mas não remove `user`/`account`/`session` no better-auth — os dados de login continuam a existir indefinidamente. |
| Oposição/limitação (arts. 18º/21º) | ❌ Não | Sem mecanismo. |
| Portabilidade (art. 20º) | ❌ Não | Sem exportação de dados em formato estruturado (JSON/CSV) para o próprio titular. |
| Registo de consentimentos | ❌ N/A por agora | Como a base legal principal não deve ser consentimento (ver secção 2), isto é secundário — mas se no futuro existir qualquer tratamento por consentimento (ex. newsletter, marketing, partilha com terceiros), tem de existir registo de quando/como foi dado e permitir revogação. |

## 4. Privacy by design / by default

- **Falha de "by default"**: novo condómino aprovado passa a ver, por omissão, todos os dados financeiros e contactos pessoais partilhados do condomínio (ver `SECURITY_AUDIT.md` S13) — não há qualquer restrição por omissão além de "está aprovado".
- **Falha de "by design"**: o esquema de dados (`lib/db/schema.ts`) não separa dados "necessários para todos verem" de dados "só necessários ao admin" ao nível do modelo — a separação, quando existe, é feita ad-hoc no código de cada página (ex. `isAdmin &&` no JSX), o que é frágil e fácil de esquecer numa página nova.
- **Positivo**: o fluxo de aprovação de membros implementado nesta sessão (`estado: pendente/aprovado`) já é, na prática, um controlo de privacy-by-default — ninguém vê dados só por se ter registado.

## 5. Retenção de dados

- **Atualizado 2026-07-06:** registos financeiros (`movimento`) deixaram de poder ser apagados fisicamente — `eliminarMovimento` faz agora soft-delete (`deletedAt`), preservando o registo para efeitos de retenção contabilística/fiscal enquanto deixa de aparecer na UI. **Ainda não existe** uma política de retenção formal (prazos configuráveis, expurgo automático ao fim do prazo legal) nem soft-delete nas restantes tabelas (`fracao`, `aviso`, `documento`, `ocorrencia`, `membro`), que continuam a usar `DELETE` físico.
- **Sessões do better-auth** (`session` table) não têm política de limpeza automática configurada além do `expiresIn`/`updateAge` (7 dias / 1 dia) — registos expirados não são necessariamente apagados da BD (depende de rotina de limpeza do better-auth, a confirmar).

## 6. Logs de auditoria

**Atualizado 2026-07-06:** implementado um `audit_log` (ver `SECURITY_AUDIT.md` S17) — ator, ação, entidade, id, timestamp, mais um resumo em texto livre opcional (`detalhes`), sem duplicar dados pessoais de outras tabelas. Cobre as ações sensíveis: criar/eliminar movimentos, alternar pago, criar/eliminar avisos/documentos/frações, aprovar/rejeitar/editar/mudar perfil de condóminos, criar/atualizar/eliminar ocorrências. Consultável em `/auditoria` por admin/gestor/auditor. Isto resolve a ambivalência identificada anteriormente entre "menos logging = menos exposição" e a exigência de accountability do art. 5º/2 RGPD — o log guarda quem fez o quê, não dados pessoais duplicados.

## 7. Documentos e dados pessoais de terceiros

- A funcionalidade de Documentos (`app/(app)/documentos/page.tsx`) aceita apenas um link externo, não upload — logo, hoje, os documentos não estão fisicamente alojados pela aplicação. Isto muda quando o upload for implementado (ver `FUNCTIONAL_GAPS.md`): atas, faturas e contratos frequentemente contêm dados pessoais de condóminos (nomes, moradas, por vezes IBAN). Quando o upload existir, é necessário: controlo de acesso por documento (não só por categoria), armazenamento privado (não bucket público), e potencialmente redação/anonimização em documentos partilhados com terceiros externos (ex. seguradora).

## 8. Textos legais em falta

Não existe nenhum destes ecrãs/documentos na aplicação:

- [ ] Política de Privacidade
- [ ] Termos de Utilização
- [ ] Informação sobre Tratamento de Dados (aviso no momento do registo, art. 13º RGPD)
- [ ] Registo de Atividades de Tratamento (art. 30º RGPD) — documento interno, não necessariamente uma página na app
- [ ] Modelo de Acordo de Subcontratação (DPA) — **necessário assim que uma empresa de administração de condomínios (terceira entidade responsável por vários condomínios de clientes diferentes) usar a plataforma**, porque nesse cenário a empresa de administração é responsável pelo tratamento e o operador da plataforma (quem gere o SaaS) é subcontratado.

## 9. Checklist de conformidade RGPD (para acompanhar progresso)

### Base e governação
- [ ] Registo de Atividades de Tratamento (art. 30º) elaborado
- [ ] Base legal documentada por tipo de dado/finalidade
- [ ] Avaliação de Impacto sobre a Proteção de Dados (DPIA) se o volume/sensibilidade justificar (dados financeiros de muitos titulares + potencial dados sensíveis em ocorrências)
- [ ] Nomeação de responsável de proteção de dados ou ponto de contacto, se aplicável face ao volume

### Transparência
- [ ] Política de Privacidade publicada e acessível antes do registo
- [ ] Termos de Utilização publicados
- [ ] Aviso de finalidade no momento da recolha de cada dado (formulários)
- [ ] Distinção clara entre campos obrigatórios e opcionais

### Direitos dos titulares
- [ ] Ecrã de autogestão "Os meus dados" (ver, corrigir)
- [ ] Função de exportação de dados pessoais (portabilidade)
- [ ] Função de eliminação de conta (com efeitos claros sobre dados que têm de ser retidos por obrigação legal, ex. registos financeiros)
- [ ] Mecanismo de pedido de oposição/limitação, mesmo que processado manualmente numa fase inicial

### Segurança e minimização (cruzar com `SECURITY_AUDIT.md`)
- [x] Controlo de acesso a contactos pessoais restrito ao necessário — 2026-07-07 (só admin/gestor/auditor veem contactos reais; inquilino/fornecedor já não veem dados financeiros/patrimoniais desde 2026-07-06)
- [x] Isolamento multi-condomínio implementado — 2026-07-06 (schema + todas as queries; falta o fluxo de onboarding para um 2º condomínio, ver `FUNCTIONAL_GAPS.md`)
- [ ] Cifra em trânsito (HTTPS obrigatório em produção) e em repouso (a confirmar com o provedor de BD)
- [x] Log de auditoria de acessos/alterações a dados pessoais e financeiros — 2026-07-06 (`audit_log`, página `/auditoria`)

### Retenção e ciclo de vida
- [ ] Política de retenção definida por tipo de dado (ex. registos financeiros: prazo legal; candidaturas rejeitadas de condóminos: prazo curto)
- [x] Soft-delete + expurgo programado em vez de `DELETE` imediato — 2026-07-06, mas só para `movimento` (o caso legalmente mais crítico); `fracao`/`aviso`/`documento`/`ocorrencia`/`membro` continuam com `DELETE` físico
- [ ] Rotina de limpeza de sessões expiradas confirmada

### Terceiros
- [ ] Modelo de Acordo de Subcontratação (DPA) para empresas de administração clientes
- [ ] Lista de subprocessadores (hosting, BD, email transacional) documentada e comunicada

## 10. Prioridade

As três ações RGPD com maior relação impacto/esforço para já:

1. Redigir e publicar Política de Privacidade + Termos, e mostrar o aviso de finalidade no registo (baixo esforço técnico, obrigatório desde o primeiro utilizador real).
2. ✅ Substituir `DELETE` físico por soft-delete em `movimento` — feito 2026-07-06. Falta ainda para (no futuro) atas/deliberações, quando esse módulo existir.
3. Ecrã de autogestão de dados pessoais para o condómino (ver os seus próprios dados, pedir correção) — hoje o poder está 100% concentrado no admin, o que também não é desejável do ponto de vista de exatidão dos dados.
