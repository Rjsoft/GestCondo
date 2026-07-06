# Plano de MVP e Testes — GestCondo

Data: 2026-07-06. Complementa `ROADMAP.md` Fase 2 com detalhe de definição de "pronto" e complementa as restantes auditorias com o plano de testes pedido (secção 8 do pedido de auditoria).

## 1. Definição de MVP

Um MVP "utilizável por um condomínio real" tem de satisfazer, cumulativamente:

- **Um administrador de condomínio consegue**: registar frações e condóminos, aprovar acessos, lançar quotas/despesas, saber quanto cada fração deve, emitir um recibo, publicar avisos, gerir ocorrências até à resolução, e guardar/consultar documentos do prédio.
- **Um condómino consegue**: consultar o seu saldo/dívida, consultar avisos e documentos, reportar uma ocorrência, e corrigir os seus próprios dados de contacto — sem depender do admin para tudo.
- **Nenhum dos dois consegue**: ver dados de outro condomínio (se/quando existir mais do que um na mesma instância), nem apagar um registo financeiro sem deixar rasto.
- **A operadora da plataforma consegue**: recuperar a password de um utilizador sem aceder à base de dados manualmente, e provar (para efeitos legais/RGPD) quem fez uma alteração sensível.

Nenhum destes critérios está 100% satisfeito hoje — ver `FUNCTIONAL_GAPS.md` para o detalhe módulo a módulo. Os itens P0/P1 listados aí são, por definição, o âmbito deste MVP.

## 2. O que falta, concretamente, para fechar o MVP

Retirado de `FUNCTIONAL_GAPS.md`, agrupado por esforço estimado relativo (não são estimativas de tempo, apenas ordenação relativa):

**Esforço estrutural (fazer primeiro, condiciona o resto):**
- ✅ Modelo multi-tenant (`condominio` + `condominioId`) — feito 2026-07-06.
- ✅ Modelo de papéis alargado com âmbito por condomínio — feito 2026-07-06.
- ✅ `audit_log` + soft-delete (em `movimento`) — feito 2026-07-06.

**Esforço médio, alto valor:**
- Livro-razão de dívida por fração (a peça financeira que falta para responder "quanto deve o 2ºEsq?").
- Upload de ficheiros com controlo de acesso.
- ✅ Envio de email — reset de password + verificação de conta feito 2026-07-06 (falta `RESEND_API_KEY` real); notificações de avisos/ocorrências ainda por fazer.
- Autogestão de dados pelo condómino.

**Esforço alto, mas incontornável para o público-alvo:**
- Módulo de Assembleias/Atas completo.
- Exportação PDF/Excel de relatórios financeiros.

## 3. Testes — estado atual

**Não existe nenhum teste automatizado no projeto** (nenhum `*.test.*`/`*.spec.*`, nenhum framework configurado). Toda a verificação até hoje foi manual (via UI) ou, nesta auditoria, via build + leitura de código. Isto significa **zero rede de segurança** contra regressões, em particular nas áreas mais sensíveis: quem pode ver os dados de quem.

## 4. Plano de testes proposto

### 4.1 Unitários
- Funções puras de formatação (`lib/format.ts`: `formatEuro`, `formatData`, `formatDataHora`) — casos-limite (valores negativos, strings inválidas, `NaN`).
- Lógica de cálculo financeiro assim que existir (rateio por permilagem, cálculo de dívida) — é a lógica com maior custo de erro silencioso.
- Validações inline nas server actions (enums de `estado`/`perfil`, regex de URL).

### 4.2 Integração (server actions + BD de teste)
- Cada função `requireAdmin()`/`requireMembroAprovado()` recusa corretamente utilizadores não autenticados, não aprovados, e sem o perfil certo.
- CRUD de cada módulo (finanças, avisos, ocorrências, frações, condóminos) com casos de sucesso e de validação a falhar (campos obrigatórios em falta, enums inválidos).
- Fluxo de aprovação: novo registo → estado `pendente` → bloqueado pelo layout → admin aprova → acesso concedido.
- Assim que o multi-tenant existir: **teste obrigatório e não negociável** de que uma query com o `condominioId` de A nunca devolve linhas de B, para todas as tabelas.

### 4.3 End-to-end (fluxos críticos, via browser real)
- Registo → pendente → aprovação pelo admin → login → dashboard.
- Criar movimento financeiro → aparece nos totais do dashboard e da página de finanças.
- Reportar ocorrência como condómino → admin muda estado → condómino vê o estado atualizado.
- Admin elimina um condómino/fração/movimento → item desaparece da UI (e, após soft-delete existir, continua a existir na BD marcado como eliminado).
- Sign-out e proteção de rotas: aceder diretamente a `/financas`, `/condominos`, etc. sem sessão redireciona para `/sign-in`.

### 4.4 Segurança/permissões (o mais prioritário a introduzir)
- IDOR: condómino A tenta eliminar/alterar uma ocorrência de condómino B via chamada direta à server action (não só pela UI) → tem de falhar.
- Escalonamento de privilégio: condómino tenta chamar `requireAdmin()`-gated actions diretamente → tem de falhar.
- Isolamento multi-tenant (quando existir): utilizador do condomínio A tenta aceder a um recurso do condomínio B por id direto (ex. `eliminarMovimento(idDeOutroCondominio)`) → tem de falhar.
- Utilizador pendente: confirmar que nenhuma server action de leitura/escrita de dados partilhados responde a um utilizador com `estado: pendente` (cobre regressões em `requireMembroAprovado`).

### 4.5 RGPD
- Conta eliminada por um titular deixa de aparecer em listagens partilhadas, mas os registos com obrigação legal de retenção (financeiros) permanecem corretamente anonimizados/pseudonimizados conforme a política definida.
- Exportação de dados pessoais devolve exatamente os dados desse titular, nada de outros.
- Aviso de finalidade/consentimento aparece antes da recolha de dados no registo.

### 4.6 Fluxos críticos de condomínio (domínio de negócio)
- Soma das permilagens de um condomínio não excede o valor total configurado (validação de negócio, não só de tipo).
- Cálculo de quórum de assembleia (quando existir) com casos-limite: 1ª convocatória sem quórum → 2ª convocatória.
- Rateio de despesa por permilagem soma exatamente o valor total da despesa (sem perdas de cêntimos por arredondamento mal tratado).

## 5. Lista de testes prioritários a implementar primeiro

Por ordem, assumindo que se começa do zero:

1. Testes de autorização das server actions existentes (`requireAdmin`, `requireMembroAprovado`) — protege o que já está construído, esforço baixo, valor imediato.
2. Teste end-to-end do fluxo de aprovação de acesso (é o controlo de acesso mais recentemente introduzido e o mais fácil de quebrar silenciosamente numa refactor futura).
3. Testes de IDOR nas ações de eliminação (`eliminarOcorrencia`, e as restantes assim que ganharem a mesma distinção admin/dono).
4. Teste de isolamento multi-tenant — a escrever **ao mesmo tempo** que o schema multi-tenant for implementado, não depois.
5. Testes de validação de formulário/enum nas server actions (rápidos de escrever, já há lógica pronta a testar: `ESTADOS`, `PERFIS`, regex de URL).

## 6. Ferramentas sugeridas

- **Vitest** para unitários/integração (rápido, boa integração com TypeScript/ESM, usado amplamente com Next.js/Drizzle).
- **Playwright** para end-to-end (cobre também navegação por teclado/acessibilidade básica nos mesmos testes).
- Uma base de dados PostgreSQL de teste isolada (ex. via Docker/Testcontainers) para os testes de integração correrem contra o schema real do Drizzle, não mocks — dado que a lógica de autorização vive nas próprias queries (`where(eq(...))`), testar com mocks daria falsa confiança.
