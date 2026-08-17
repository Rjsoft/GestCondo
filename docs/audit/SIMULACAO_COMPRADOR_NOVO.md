# Simulação real de um comprador novo — registo até ao primeiro aviso

Data: 2026-08-17. Diferente de `USABILITY_SIMULATION.md` (30 personas analisadas por leitura de código, sem clicar em nada): esta é uma execução **real**, clique a clique, contra o ambiente de desenvolvimento (`http://localhost:3000`, BD Neon `development`), com duas contas fictícias criadas de propósito — nunca a conta real do utilizador nem produção. Confirma se o guia público `/instrucoes` ("Como começar: criar o seu condomínio do zero") corresponde ao comportamento real da aplicação.

**Personas usadas** (fictícias, emails `@example.com`, eliminadas/substituídas ao longo do teste — ver nota final):
- **Maria Silva** — compradora nova, cria e administra o condomínio "Edifício Jasmim, Nº 25".
- **João Sousa** — condómino convidado, associado à fração "1ºEsq".

## Resultado

**O guia oficial (`/instrucoes`) está correto** — os 7 passos que descreve foram todos executados e correspondem exatamente ao comportamento real, incluindo os dois passos que ainda não tinham sido verificados clique a clique numa sessão anterior: o passo 5 (convite → aprovação → associação a fração) e o passo 7 (publicar aviso). Não foi encontrada nenhuma divergência entre o texto do guia e a aplicação.

## Guia passo a passo verificado

### 1. Criar a conta
`/sign-up` → nome, email, palavra-passe (mín. 10 caracteres), aceitar Política de Privacidade/Termos → "Criar conta". Envia email de confirmação (`requireEmailVerification: true`, `lib/auth.ts`) — sem clicar no link, a conta fica bloqueada em "Falta só um passo".

### 2. Escolher o caminho de onboarding
Depois de confirmar o email e entrar, ecrã "Falta só mais um passo": três opções — código de convite, criar condomínio novo, ou importar ficheiro de exportação. Como compradora nova: **"Quero criar um condomínio novo"**.

### 3. Criar o condomínio
Um único campo obrigatório — nome. Fica administradora automaticamente. Redireciona direto para o Painel, tudo a zero.

### 4. Completar os dados do condomínio
`/condominio` → morada, NIF preenchidos e guardados ("Dados do condomínio atualizados"). Dados formais do edifício (matricial, conservatória, licença, projeto, área) deixados em branco — são opcionais, realista para o primeiro dia. Critério de rateio já vem por omissão em "Por permilagem (regra geral)".

**Achado técnico (não corrigido)**: ao guardar, o overlay de erros do Next.js (só em desenvolvimento) mostrou um aviso real do React/Base UI — `components/condominio/editar-condominio-form.tsx:66`, "A component is changing the default value state of an uncontrolled FieldControl after being initialized". Não afeta produção nem utilizadores finais, mas é um aviso genuíno de qualidade de código.

### 5. Registar as frações — 9 frações, 6 apartamentos + 3 lojas
`/fracoes` → "Nova fração" × 9, permilagens a somar exatamente 1000‰:

| Identificação | Proprietário | Permilagem |
|---|---|---|
| 1ºDto / 1ºEsq / 3ºDto / 3ºEsq | Ana Costa / Pedro Santos / Beatriz Almeida / Miguel Rocha | 120‰ cada |
| 2ºDto / 2ºEsq | Sofia Martins / Ricardo Nunes | 125‰ cada |
| A — Loja A / B — Loja B / C — Loja C | Café Central, Lda. / Farmácia Jasmim, Lda. / Talho do Bairro, Lda. | 90‰ cada |

Confirmado no Painel: "Permilagem total: 1000.0‰", sem aviso de excesso.

**Isenção de elevador**: as 3 lojas do R/C foram marcadas como isentas — não está no formulário de edição da fração, mas sim como ação rápida no menu "..." de cada linha ("Isentar de elevador"). Funciona bem, mas a descoberta inicial (formulário de edição não tem o campo) pode confundir um administrador à procura dele lá.

### 6. Convidar os condóminos
`/condominio` → código de convite gerado automaticamente (`NT2G6WG7`, sem ação nenhuma). O João regista-se (`/sign-up`), confirma o email, e no ecrã de onboarding escolhe **"Tenho um código de convite"** em vez de criar um condomínio novo → introduz o código → ecrã "Conta a aguardar aprovação" — funciona exatamente como descrito.

A Maria, em `/condominos`, vê o pedido em "Pedidos de acesso pendentes" → "Aprovar" → o João passa a listado com perfil "Condómino" por omissão, sem fração associada. Clicar no ícone de lápis junto ao nome abre "Editar condómino", com um campo "Fração" (dropdown com as 9 frações) → selecionada "1ºEsq" → "Condómino atualizado".

### 7. Criar o orçamento anual e gerar as quotas
`/financas` → Orçamentos → "Novo orçamento": ano 2026, valor anual 14.400,00 €, valor do elevador 1.800,00 €, 10% fundo de reserva (sugestão pré-preenchida, mantida), notas.

**Bug real encontrado e corrigido nesta sessão** (`lib/rateio.ts`): o valor do elevador estava a ser **somado** ao valor anual total em vez de **descontado** — os condóminos seriam cobrados 16.200 € (14.400 + 1.800), 1.800 € a mais do que a assembleia aprovaria. Corrigido: o elevador passa a ser uma fatia dentro do valor anual, tal como o texto da própria aplicação já dizia ("o resto do orçamento continua a ser rateado por permilagem entre todas"). Verificado com dados reais: Receitas 12.959,88 € + Fundo de reserva 1.440,12 € = 14.400,00 €, exato. Ver `lib/rateio.test.ts` para os testes de regressão.

**Funcionalidade nova nesta sessão**: edição inline do valor de uma rubrica orçamental já criada (antes só era possível eliminar e recriar) — `atualizarOrcamentoRubrica`, `app/actions/orcamentos.ts` + `components/financas/gerir-rubricas-dialog.tsx`. Também: copiar rubricas do orçamento anterior (sessão anterior a esta).

"Gerar quotas mensais" → pré-visualização confirmada → "Confirmar e gerar" → 216 quotas (9 frações × 12 meses × 2 movimentos, quota corrente + fundo de reserva).

### 8. Publicar o primeiro aviso
`/avisos` → "Novo aviso" → título, conteúdo, prioridade "Normal" → "Publicar aviso". Confirmado como o João (sessão separada, condómino): vê o aviso no Painel e o resumo financeiro correto (saldo/receitas iguais ao que a Maria vê).

## Nota de limpeza

Todos os dados desta simulação (condomínio "Edifício Jasmim, Nº 25", as duas contas, as 9 frações, o orçamento, os 216 movimentos, o aviso) ficam na BD de desenvolvimento — não foram eliminados no fim desta sessão. Seguem a mesma prática já registada em memória ("manter contas de teste em dev") — apagar só quando pedido.
