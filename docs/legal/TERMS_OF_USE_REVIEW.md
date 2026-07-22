# Revisão dos Termos de Utilização — GestCondo

Data: 2026-07-22. Analisa `app/termos/page.tsx` (datada de 9 de julho de 2026, marcada como "rascunho técnico") contra a checklist da secção 6 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`. **Só a análise — sem alterações aplicadas à página.**

## 1. O que já está bem resolvido

Objeto (secção 1), contas/credenciais/perfis (secção 2), exatidão dos dados e o que a auditoria interna cobre (secção 3), limitação de responsabilidade razoável sem prometer disponibilidade absoluta (secção 4), cláusula de alterações (secção 5).

## 2. Gaps encontrados

| # | Gap | Exigido pela checklist | Severidade |
|---|---|---|---|
| TU-1 | Sem identificação da entidade (nome/NIF do operador da plataforma) | "identificação da entidade" | Alta |
| TU-2 | Sem cláusula de propriedade intelectual (quem detém direitos sobre o software, marca, etc.) | "propriedade intelectual" | Média |
| TU-3 | Sem cláusula sobre documentos carregados (quem é o titular dos ficheiros/dados carregados — atas, fotos, apólices) | "documentos carregados" | Média |
| TU-4 | Sem menção a pagamentos, faturação, renovação, cancelamento, suspensão do serviço | "pagamentos", "faturação", "renovação", "cancelamento", "suspensão" | Alta se o produto vier a ser pago — hoje o modelo de negócio (gratuito/piloto vs. pago) não está definido nos termos |
| TU-5 | Sem cláusula de lei aplicável nem foro competente | "lei aplicável", "foro" | Alta — cláusula standard e de baixo custo a adicionar |
| TU-6 | Sem menção a resolução alternativa de litígios (RAL) nem à plataforma europeia ODR — **obrigatório para relações de consumo em Portugal** (Lei n.º 15/2014 e Lei n.º 144/2015, a confirmar aplicabilidade exata ao cenário condomínio/plataforma) | "resolução alternativa de litígios", "consumidores" | Alta, se o utilizador final for tratado como consumidor em algum cenário |
| TU-7 | Não define claramente se o modelo é B2B, B2C ou misto — relevante porque `CONTROLLER_PROCESSOR_MATRIX.md` mostra 3 cenários de contratação distintos (empresa administradora = claramente B2B; condomínio direto = zona cinzenta, o condomínio não é uma "pessoa singular consumidora" na aceção clássica, mas o administrador que assina pode ser) | "verifica se o modelo é B2B/B2C/misto" | Média — decisão que precisa de confirmação jurídica |
| TU-8 | Sem cláusula sobre utilização proibida (ex. inserir dados de terceiros sem legitimidade, uso para fins ilícitos) | "utilização proibida" | Média |
| TU-9 | Sem cláusula sobre representação do condomínio (quem, legalmente, pode vincular o condomínio ao contratar/criar a conta — o administrador eleito? qualquer condómino?) | "representação do condomínio" | Alta — relevante porque `criarCondominio` hoje permite a qualquer utilizador autenticado criar um condomínio e tornar-se admin, sem verificação de que representa legitimamente esse condomínio |
| TU-10 | Sem cláusula sobre exportação/eliminação de dados no fim da relação contratual (o que acontece aos dados do condomínio se deixar de usar o GestCondo) | "exportação", "eliminação" | Média |
| TU-11 | Sem cláusula de força maior nem de notificações formais | "força maior", "notificações" | Baixa |
| TU-12 | Data da versão desatualizada | "data da versão" | Baixa |

## 3. Achado adicional relevante (não da checklist, mas descoberto ao rever TU-9)

**`criarCondominio` (`app/actions/condominio.ts`) não verifica que quem cria o condomínio tem legitimidade para o representar** — qualquer conta autenticada pode criar um condomínio e tornar-se automaticamente o seu `admin`. Isto é uma decisão de produto deliberada (onboarding sem fricção), mas os Termos de Utilização deveriam pelo menos declarar que **quem cria o condomínio garante que tem essa legitimidade** (declaração contratual, transfere o risco para quem afirma falsamente representar um condomínio) — hoje isto não está dito em lado nenhum, nem tecnicamente nem contratualmente.

## 4. Alterações propostas (para aprovação, não aplicadas)

1. Identificação da entidade — mesma dependência de decisão do utilizador que em `PRIVACY_POLICY_REVIEW.md` PP-1.
2. Cláusula curta de propriedade intelectual (software, marca "GestCondo" e conteúdo próprio da plataforma pertencem ao operador; conteúdo carregado pelos utilizadores/condomínios permanece propriedade destes, com licença de uso técnico ao operador para prestar o serviço).
3. Cláusula sobre pagamentos — **decisão de negócio a tomar antes de redigir** (o produto é hoje um piloto gratuito; se/quando houver um modelo pago, a cláusula tem de refletir o modelo real).
4. Cláusula de lei aplicável (lei portuguesa) e foro (comarca a definir, tipicamente a da sede/residência do operador).
5. Cláusula de RAL/ODR, com a entidade de RAL competente a identificar (depende do setor de atividade e sede do operador — **não posso preencher sem essa informação**).
6. Declaração de legitimidade de representação ao criar um condomínio (TU-9 / achado adicional).
7. Cláusula sobre exportação/eliminação de dados no fim da relação.
8. Atualizar data da versão.

## 5. Dúvidas que não posso resolver sozinho

- Identidade/NIF da entidade a publicar (TU-1, igual a PP-1).
- Se/quando existirá um modelo de pagamento, e qual (TU-4) — determina se as cláusulas de faturação/cancelamento são necessárias já ou só mais tarde.
- Entidade de RAL competente (TU-6) — depende de decisões societárias fora do âmbito técnico.
