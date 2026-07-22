# Revisão da Política de Privacidade — GestCondo

Data: 2026-07-22. Analisa `app/privacidade/page.tsx` contra a checklist da secção 5 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. **Atualização 2026-07-22 (mesmo dia, sessão seguinte): as alterações da secção 3 foram aplicadas à página**, com autorização expressa do utilizador, exceto PP-1 (identidade da entidade e contacto de privacidade), que continua por decidir e está marcado como `[A preencher]` diretamente no texto publicado.

## 1. O que já está bem resolvido

- Base jurídica correta e explicada (execução de contrato/obrigação legal, não consentimento) — secção 3 do texto.
- Não promete segurança absoluta, não afirma eliminação imediata de tudo, linguagem tecnicamente exata.
- Lista de subcontratantes (parcial — ver gap abaixo).
- Ligação direta a `/os-meus-dados` para autogestão.

## 2. Gaps encontrados (severidade + referência à checklist da secção 5)

| # | Gap | Estado |
|---|---|---|
| PP-1 | Sem identificação concreta da entidade responsável (nome, NIF, morada) nem contacto de privacidade dedicado (email) | ❌ **Aberto** — depende de decisão do utilizador; texto publicado com placeholder `[A preencher]` visível na secção 1 |
| PP-2 | Vercel Analytics não mencionado | ✅ Resolvido — secção 4 e 5 |
| PP-3 | Sem menção ao direito de reclamação à CNPD | ✅ Resolvido — secção 11 |
| PP-4 | Sem secção de segurança | ✅ Resolvido — secção 6 |
| PP-5 | Sem secção própria "alterações a esta política" | ✅ Resolvido — secção 12 |
| PP-6 | Sem menção a cookies/telemetria | ✅ Resolvido — secção 5 |
| PP-7 | Sem menção a transferências internacionais | ✅ Resolvido (parcialmente) — secção 7, com nota honesta de que a confirmação formal com os subprocessadores ainda está pendente (ver `DATA_SUBPROCESSORS_REGISTER.md`) |
| PP-8 | Não distinguia os diferentes cenários de responsabilidade (condomínio direto vs. empresa administradora) | ✅ Resolvido — secção 1 reformulada |
| PP-9 | Sem menção a decisões automatizadas | ✅ Resolvido — secção 8 |
| PP-10 | Data da versão desatualizada | ✅ Resolvido — atualizada para 22 de julho de 2026 |

## 3. Alterações aplicadas 2026-07-22

Todos os gaps acima foram fechados diretamente em `app/privacidade/page.tsx`, com autorização expressa do utilizador, exceto PP-1. A página cresceu de 6 para 12 secções (identificação, dados recolhidos, base jurídica, partilha, cookies/métricas, segurança, transferências internacionais, decisões automatizadas, conservação, direitos, reclamações, alterações).

## 4. Dúvida que não posso resolver sozinho

O contacto de privacidade concreto (PP-1) e a identificação formal da entidade (nome/NIF a publicar) continuam a depender de uma decisão do utilizador — não posso inventar um contacto de email nem assumir que é o seu próprio contacto pessoal sem confirmar. Perguntado diretamente em 2026-07-22, respondeu "decido depois" — o placeholder `[A preencher]` foi deixado no texto publicado precisamente para que isto não passe despercebido.
