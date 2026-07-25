# Revisão da Política de Privacidade — GestCondo

Data: 2026-07-22. Analisa `app/privacidade/page.tsx` contra a checklist da secção 5 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. **Atualização 2026-07-22 (mesmo dia, sessão seguinte): as alterações da secção 3 foram aplicadas à página**, com autorização expressa do utilizador, exceto PP-1. **Atualização 2026-07-25: PP-1 resolvido** — identidade do operador (RJCSI - Serviços Informáticos, Unipessoal, Lda., NIF 510666540) e contacto de privacidade (rjc-si@netcabo.pt) preenchidos na página, com autorização expressa do utilizador.

## 1. O que já está bem resolvido

- Base jurídica correta e explicada (execução de contrato/obrigação legal, não consentimento) — secção 3 do texto.
- Não promete segurança absoluta, não afirma eliminação imediata de tudo, linguagem tecnicamente exata.
- Lista de subcontratantes (parcial — ver gap abaixo).
- Ligação direta a `/os-meus-dados` para autogestão.

## 2. Gaps encontrados (severidade + referência à checklist da secção 5)

| # | Gap | Estado |
|---|---|---|
| PP-1 | Sem identificação concreta da entidade responsável (nome, NIF, morada) nem contacto de privacidade dedicado (email) | ✅ **Resolvido 2026-07-25** — RJCSI - Serviços Informáticos, Unipessoal, Lda., NIF 510666540, Rua Estêvão de Vasconcelos, 18 R/C-DTO, 2700-351 Amadora; contacto rjc-si@netcabo.pt |
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

## 4. Dúvida resolvida em 2026-07-25

O contacto de privacidade concreto e a identificação formal da entidade (PP-1) foram decididos pelo utilizador em 2026-07-25: RJCSI - Serviços Informáticos, Unipessoal, Lda. (NIF 510666540), contacto rjc-si@netcabo.pt. Perguntado diretamente em 2026-07-22, tinha respondido "decido depois" — o placeholder `[A preencher]` cumpriu o seu propósito de não deixar isto passar despercebido até à decisão.
