# Auditoria de Acessibilidade — GestCondo

Data: 2026-07-22. Âmbito: revisão de código (`app/`, `components/`) mais uma verificação pontual em runtime (árvore de acessibilidade real do Chrome numa página pública, `/sign-in`). Motivada por pedido explícito do utilizador: a aplicação deve ser utilizável com o NVDA ou leitor de ecrã semelhante.

**Isto não é um teste real com o NVDA.** É uma revisão de código mais uma verificação pontual — a única forma de ter a certeza é testar com o leitor de ecrã real (ver secção 5).

Convenção de gravidade: **Alta** (bloqueia ou dificulta muito o uso com leitor de ecrã) · **Média** (fricção real mas contornável) · **Baixa** (boas práticas, robustez) · **Não verificado** (não foi possível confirmar sem ferramenta dedicada).

## 1. O que já está bem resolvido (confirmado)

| Item | Estado | Evidência |
|---|---|---|
| Idioma da página | ✅ | `<html lang="pt-PT">` em `app/layout.tsx` — o NVDA usa a voz/pronúncia portuguesa correta em vez de tentar adivinhar |
| Labels em campos de formulário | ✅ | Padrão `<Label htmlFor="x">` + `<Input id="x">` confirmado em `auth-form.tsx` (login/registo/2FA) e é a convenção documentada no `CLAUDE.md` do projeto para todos os módulos. Verificado também em runtime na `/sign-in`: o `label[for="email"]` está corretamente associado ao `input#email` no DOM |
| Botões só com ícone | ✅ | 13 ficheiros usam `size="icon"` sem texto visível; todos os 13 têm `aria-label` ou um `<span className="sr-only">` a descrever a ação (ex. "Ações", "Editar fornecedor") |
| Imagens | ✅ | As únicas 2 imagens carregadas pelo utilizador (`<img>` do QR code 2FA, `<Image>` de foto de ocorrência) têm `alt` descritivo |
| Indicadores de estado (badges) | ✅ | `components/badges.tsx` — todos os badges de estado/prioridade combinam cor **e** texto (ex. "Urgente", "Resolvida"); nenhum depende só da cor, que é irrelevante para o NVDA mas relevante para baixa visão |
| Foco visível ao navegar por teclado | ✅ | `outline-none` nos componentes base (`button.tsx`, `input.tsx`) é sempre substituído por `focus-visible:ring-3` — não há supressão do indicador de foco sem alternativa |
| Sem `tabIndex` positivo | ✅ | Nenhuma ocorrência no código — não há elementos a saltar a ordem natural de tabulação |
| Sem `<div onClick>` como falso botão | ✅ | Nenhuma ocorrência — elementos clicáveis são sempre `<button>` ou `<a>` |
| Erros de formulário anunciados | ✅ | Erros de autenticação usam `<p role="alert">` (`auth-form.tsx`); erros de outras ações usam `toast.error()` da biblioteca `sonner`, que mantém uma região `aria-live` própria por omissão |
| Estrutura de títulos (`h1`) | ✅ | Todas as 25 páginas têm exatamente um `<h1>` visível — nas páginas de gestão via `PageHeader`, nas de autenticação/onboarding via `<h1>` direto no componente partilhado |

## 2. Achados (a corrigir)

| # | Achado | Gravidade | Detalhe | Recomendação |
|---|---|---|---|---|
| A1 | ~~Sem link de "saltar para o conteúdo"~~ **Resolvido 2026-07-22** | Média | `components/app-shell.tsx` — link `sr-only focus:not-sr-only` como primeiro elemento focável, aponta para `<main id="main-content" tabIndex={-1}>`. Testado: visível ao receber foco por teclado, e ativá-lo move o foco (`document.activeElement`) para o `<main>` | — |
| A2 | ~~Contraste de cor não verificado~~ **Verificado e corrigido 2026-07-22** | Média (era) | Calculado o rácio de contraste real (conversão OKLCH → sRGB linear → luminância relativa → WCAG, fórmula validada contra um valor de referência conhecido) para os 10 pares texto/fundo mais usados em `app/globals.css`. **9/10 passam confortavelmente** (rácios entre 4.57:1 e 18.96:1, mínimo exigido 4.5:1). **1 falha real, confirmada**: `sidebar-primary-foreground` sobre `sidebar-primary` (o item ativo da navegação lateral) tinha só **3.77:1**, abaixo do mínimo — o texto "Finanças" (ou qualquer página ativa) tinha contraste insuficiente contra o fundo azul de destaque. Corrigido: `--sidebar-primary` escurecido de `oklch(0.6 0.14 240)` para `oklch(0.52 0.14 240)`, novo rácio **5.16:1**. Modo escuro já passava (6.54:1) e não foi alterado. Nota: `destructive` sobre `background` passa com margem apertada (4.57:1) — vale a pena ter em atenção se a cor for alguma vez ajustada. | — |
| A3 | Diálogos (`@base-ui/react` Dialog) — foco e `aria-labelledby` não verificados de forma independente | Não verificado | O projeto usa `@base-ui/react`, que documenta suporte a devolução de foco e associação automática do título ao diálogo, mas isto nunca foi testado neste projeto especificamente (nem com o NVDA nem com a árvore de acessibilidade) | Testar com o NVDA real: abrir um diálogo (ex. "Novo fornecedor"), confirmar que o título é anunciado e que o foco fica dentro do diálogo até fechar |
| A4 | Sem teste real com leitor de ecrã | Alta (para o objetivo declarado) | Tudo o que está acima é revisão de código e uma verificação pontual da árvore de acessibilidade — nenhum dos fluxos foi percorrido com o NVDA a correr de facto | Ver secção 5 |

## 3. Falso alarme descartado nesta sessão

Ao inspecionar `/sign-in` com a árvore de acessibilidade do Chrome, o campo de email apareceu identificado como "nome@exemplo.pt" (o `placeholder`) em vez de "Email". Antes de reportar isto como um bug, confirmei diretamente no DOM (`label[for="email"]` → `input#email`) que a associação está correta — o "nome" mostrado pela ferramenta de inspeção é só uma abreviação de exibição, não o nome acessível real computado pelo browser. **Conclusão: não é um problema real**, mas fica registado o método de verificação para não repetir o erro.

## 4. Como isto se relaciona com o resto da app

- Nenhum módulo foi tratado como "pronto" do ponto de vista de acessibilidade — isto é uma auditoria transversal nova, não uma revisão módulo a módulo.
- Relaciona-se com a preocupação já registada sobre utilizadores não tecnicamente literados (`FUNCTIONAL_GAPS.md`, memória de sessão) — acessibilidade a leitor de ecrã é uma extensão direta dessa preocupação, não um requisito à parte.

## 5. Próximo passo recomendado

1. ~~**Correção imediata e barata**: A1 (skip link)~~ — **feito 2026-07-22.**
2. ~~**Verificação de contraste**: A2~~ — **feito 2026-07-22**, calculado matematicamente (sem depender de Lighthouse/axe) e corrigido o único par que falhava.
3. **Teste real com o NVDA**: A3, A4 — percorrer os fluxos principais (login, criar um movimento, abrir um diálogo, navegar pela tabela de finanças) com o NVDA a correr, idealmente feito pelo utilizador ou por alguém que o utilize no dia a dia — é o único teste que conta como prova real de que a app "funciona com o NVDA". Continua por fazer, e é o único achado que resta desta auditoria.
