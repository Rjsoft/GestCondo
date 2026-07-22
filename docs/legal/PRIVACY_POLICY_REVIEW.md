# Revisão da Política de Privacidade — GestCondo

Data: 2026-07-22. Analisa `app/privacidade/page.tsx` (datada de 9 de julho de 2026, já marcada no próprio texto como "rascunho técnico") contra a checklist da secção 5 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. **Esta é só a análise — as alterações propostas na secção 3 ainda não foram aplicadas à página**, por decisão desta auditoria (regra 4/1: não alterar textos legais sem análise prévia).

## 1. O que já está bem resolvido

- Base jurídica correta e explicada (execução de contrato/obrigação legal, não consentimento) — secção 3 do texto.
- Não promete segurança absoluta, não afirma eliminação imediata de tudo, linguagem tecnicamente exata.
- Lista de subcontratantes (parcial — ver gap abaixo).
- Ligação direta a `/os-meus-dados` para autogestão.

## 2. Gaps encontrados (severidade + referência à checklist da secção 5)

| # | Gap | Exigido pela checklist | Severidade |
|---|---|---|---|
| PP-1 | Sem identificação concreta da entidade responsável (nome, NIF, morada) nem contacto de privacidade dedicado (email) | "identidade e contactos da entidade", "contactos de privacidade" | Alta — art. 13º/1/a RGPD |
| PP-2 | Vercel Analytics não mencionado (achado RGPD-01, já confirmado nesta auditoria) | "categorias de dados", "destinatários", "subcontratantes" | Média |
| PP-3 | Sem menção ao direito de reclamação à CNPD | "reclamações à CNPD" | Alta — art. 13º/2/d RGPD, obrigatório |
| PP-4 | Sem secção de segurança (medidas técnicas/organizativas, mesmo que genéricas) | "segurança" | Média |
| PP-5 | Sem secção própria "alterações a esta política" (existe nos Termos, não na Política) | "alterações da política" | Baixa |
| PP-6 | Sem menção a cookies/telemetria explicitamente (mesmo que a resposta seja "não usamos cookies de rastreio; usamos métricas agregadas via Vercel Analytics") | "cookies" | Média (liga-se a PP-2) |
| PP-7 | Sem menção a transferências internacionais (mesmo que a resposta seja "não identificadas, a confirmar") | "transferências internacionais" | Baixa — ver `DATA_SUBPROCESSORS_REGISTER.md`, ainda não confirmado com certeza |
| PP-8 | Não distingue os diferentes cenários de responsabilidade (condomínio direto vs. empresa administradora) — trata "a administração do condomínio (ou a empresa de administração)" como equivalentes, mas `CONTROLLER_PROCESSOR_MATRIX.md` mostra que os cenários têm nuances (ex. Cenário 4, onde a própria plataforma é responsável pelo Vercel Analytics) | "diferenças entre utilização pela administradora e pelo condomínio" | Média |
| PP-9 | Sem menção a decisões automatizadas (mesmo que só para dizer que não existem) | "decisões automatizadas" | Baixa |
| PP-10 | Data da versão desatualizada (9 de julho, antes do onboarding multi-condomínio e do capital seguro/balanço) | "data da versão" | Baixa — cosmético, mas sinaliza que o documento não acompanhou o código |

## 3. Alterações propostas (para aprovação, não aplicadas)

1. Adicionar ao topo/rodapé: identificação da entidade operadora + um email de contacto de privacidade dedicado (ex. `privacidade@gestcondo...`) — **decisão que depende do utilizador**, não posso inferir um contacto real.
2. Nova secção "Reclamações": direito de apresentar reclamação à CNPD (`www.cnpd.pt`), sem prejuízo de outras vias.
3. Atualizar secção 4 ("Com quem partilhamos dados") para incluir o Vercel Analytics, com a explicação de que não usa cookies e não identifica individualmente o visitante.
4. Nova secção "Segurança": medidas em vigor hoje (autenticação, MFA opcional, isolamento por condomínio, cifra em trânsito) — sem prometer segurança absoluta.
5. Nova secção "Alterações a esta política" (mesma redação-tipo já usada nos Termos, secção 5).
6. Nova secção "Cookies e métricas": esclarecer que a aplicação não usa cookies de publicidade/rastreamento; a sessão de autenticação usa um cookie técnico necessário (isento de consentimento, art. 5º/3 da Diretiva ePrivacy).
7. Atualizar secção 1 para refletir os cenários reais (condomínio direto vs. empresa administradora) de forma mais clara, com uma frase curta remetendo ao princípio geral, sem reproduzir a matriz completa (isso fica em `CONTROLLER_PROCESSOR_MATRIX.md`, documento interno).
8. Atualizar a data de "última atualização".

## 4. Dúvida que não posso resolver sozinho

O contacto de privacidade concreto (PP-1) e a identificação formal da entidade (nome/NIF a publicar) dependem de uma decisão sua — não posso inventar um contacto de email nem assumir que é o seu próprio contacto pessoal sem confirmar.
