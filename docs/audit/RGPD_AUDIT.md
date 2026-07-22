# Auditoria RGPD Consolidada — GestCondo (Fase B)

Data: 2026-07-22. Consolida as subsecções 4.1 a 4.8 do `PROMPT_AUDITORIA_JURIDICA_RGPD.md`, com base em `docs/audit/SYSTEM_DATA_MAP.md`, `RAT.md` (atualizado), `GDPR_CHECKLIST.md` (atualizado) e os documentos novos em `docs/legal/`. **Auditoria técnica, não parecer jurídico.**

## Documentos desta fase

| Documento | Conteúdo |
|---|---|
| `RAT.md` (atualizado) | Registo de atividades de tratamento — agora inclui Vercel Analytics e a nota sobre o DPA. |
| `GDPR_CHECKLIST.md` (atualizado) | Checklist RGPD — secções 8, 9, 10 atualizadas. |
| `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` | Papéis (responsável/subcontratante) por 6 cenários de uso. |
| `docs/legal/DATA_SUBPROCESSORS_REGISTER.md` | Detalhe de cada subcontratante — Neon, Resend, Vercel Blob, Vercel Analytics, Have I Been Pwned. |
| `docs/legal/DATA_RETENTION_MATRIX.md` | Prazos de conservação por categoria de dado. |
| `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md` | Procedimento formal de exercício de direitos. |
| `docs/legal/DATA_BREACH_PROCEDURE.md` | Procedimento de resposta a violações de dados. |
| `docs/legal/DPIA_SCREENING.md` | Conclusão: DPIA não necessária hoje. |

## 4.1 Princípios — avaliação

| Princípio | Estado |
|---|---|
| Licitude | Base legal previsível e documentada (execução de contrato/obrigação legal) — não depende de consentimento revogável para o tratamento principal. |
| Lealdade/transparência | Parcialmente cumprido — Vercel Analytics não divulgado (achado RGPD-01). |
| Limitação das finalidades | Cumprido para as finalidades já mapeadas; Vercel Analytics é uma finalidade autónoma da plataforma, não do condomínio (ver `CONTROLLER_PROCESSOR_MATRIX.md` Cenário 4). |
| Minimização | Já corrigido em 2026-07-07 para contactos (ver `SECURITY_AUDIT.md` S13); exportação de dados pessoais é hoje incompleta no sentido oposto (menos do que devia devolver, não mais). |
| Exatidão | Sem histórico de titularidade em `fracao.proprietario` — alterações sobrescrevem sem rasto (gap já em `FUNCTIONAL_GAPS.md`). |
| Limitação da conservação | Só `movimento` tem soft-delete; sem expurgo automático em nenhuma tabela (achado RGPD-04/RGPD-05). |
| Integridade/confidencialidade | Bucket de ficheiros público (achado já conhecido, ver `SECURITY_AUDIT.md`); isolamento multi-tenant verificado por teste real. |
| Responsabilidade demonstrada (accountability) | `audit_log` cobre ações sensíveis; falta DPA com subcontratantes e com clientes administradoras (achado RGPD-03). |

## 4.2 / 4.3 — Base jurídica e papéis

Ver `RAT.md` (base jurídica por finalidade) e `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` (papéis por cenário). Nenhuma finalidade principal usa consentimento como base — correto, dado o contexto (execução de contrato/obrigação legal do regime de propriedade horizontal).

## 4.4 — Direitos dos titulares

Ver `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`. Quatro direitos com autosserviço maduro (acesso, retificação, portabilidade, apagamento); dois sem qualquer mecanismo (oposição, limitação), processados manualmente sem registo formal.

## 4.5 — Segurança

Já auditada em detalhe em `SECURITY_AUDIT.md` (S1–S18). Nada de novo nesta fase além do que já lá consta — a atualização desse documento fica para quando revisitarmos a secção 4.5/9 do prompt especificamente (Fase E, "Documentos e rastreabilidade").

## 4.6 — Violações de dados

Sem procedimento antes desta auditoria. Ver `docs/legal/DATA_BREACH_PROCEDURE.md` (novo).

## 4.7 — Conservação

Ver `docs/legal/DATA_RETENTION_MATRIX.md` (novo). Nenhum prazo está hoje automatizado; a maioria não está sequer confirmada por um profissional (jurista/contabilista).

## 4.8 — DPIA

Ver `docs/legal/DPIA_SCREENING.md` (novo). Conclusão: não necessária hoje.

## Achados desta fase (formato secção 12 do prompt)

| ID | Título | Severidade | Prioridade | Base legal | Recomendação | Ficheiro |
|---|---|---|---|---|---|---|
| RGPD-01 | Vercel Analytics ativo em produção, não divulgado | Média | P1 | Art. 13º/1 RGPD (transparência) | Atualizar `/privacidade` com esta integração (Fase C) | `app/layout.tsx`, `app/privacidade/page.tsx` |
| RGPD-02 | Exportação de dados pessoais (`exportarMeusDados`) incompleta — só devolve `membro` | Média | P2 | Arts. 15º/20º RGPD | Avaliar se deve incluir movimentos/ocorrências/votos do titular | `app/actions/perfil.ts` |
| RGPD-03 | ~~DPA em falta~~ **Modelo criado 2026-07-22** (`docs/legal/DPA_TEMPLATE.md`) — sem cliente administradora real ainda, por isso reclassificado P2 | Alta→Baixa | P2 (reavaliar para P0 com o primeiro cliente real) | Art. 28º RGPD | Preencher e rever com advogado assim que houver um cliente administradora real | — |
| RGPD-04 | Só `movimento` usa soft-delete; `fracao`/`aviso`/`documento`/`ocorrencia`/`seguro` usam `DELETE` físico | Média | P2 | Art. 5º/1/e RGPD | Avaliar necessidade de soft-delete adicional, especialmente `seguro` (documento com valor probatório) | `lib/db/schema.ts` |
| RGPD-05 | Sem expurgo automático de sessões expiradas nem de `audit_log` | Baixa | P2 | Art. 5º/1/e RGPD | Confirmar rotina do better-auth; definir prazo para `audit_log` | `lib/auth.ts`, `lib/db/schema.ts` |
| RGPD-06 | Pedidos de direitos não-autosserviço (oposição, limitação) sem registo formal nem controlo de prazo | Média | P2 | Art. 12º/3 RGPD | Registo mínimo (mesmo que externo à app) até existir um formulário dedicado | — |
| RGPD-07 | **Resolvido 2026-07-22.** Cadeia completa de correções: (1) `RESEND_API_KEY` estava em falta — configurada; (2) primeira chave introduzida tinha um valor inválido (401) — substituída por uma segunda chave, válida; (3) sem domínio verificado, o remetente de teste só enviava para o email do próprio dono da conta Resend (403) — resolvido usando o domínio já verificado `cobaialab.pt` (partilhado com outro projeto do utilizador, "Cobaia Lab" — o plano gratuito do Resend só permite 1 domínio; upgrade para Pro, 20 USD/mês, ficou descartado por agora). `EMAIL_FROM` definido como `GestCondo <naoresponder@cobaialab.pt>`. **Verificado end-to-end em produção**: pedido de reset de password para `rui.coelho@netcabo.pt` confirmado como "Delivered" no painel do Resend. **Nota de contexto (confirmada pelo utilizador)**: apesar de a base de dados de produção já conter dados reais dos condóminos (importados do PDF de assembleia), **o utilizador é hoje o único com conta/acesso à aplicação** — nenhum outro condómino real tinha ainda tentado registar-se ou repor password, pelo que este bug não afetou terceiros na prática, só o próprio utilizador. Continua correto classificá-lo como crítico, por ser um bloqueador ativo antes de qualquer outro condómino se juntar. | Resolvida | — | Arts. 5º/1/f, 32º RGPD | Nenhuma ação adicional imediata. Nota de branding: os emails mostram "cobaialab.pt" como remetente, não algo com "gestcondo" — considerar migrar para um domínio próprio do GestCondo mais tarde, por transparência/confiança dos condóminos (não é uma exigência do RGPD, é uma recomendação de produto). | `.env.example`, `lib/email.ts` |
| RGPD-08 | Prazo de retenção fiscal (10 anos, referência habitual) não confirmado por contabilista | Baixa | P3 | Legislação fiscal/contabilística (fora do RGPD) | Validar prazo exato antes de o tratar como política definitiva | `docs/legal/DATA_RETENTION_MATRIX.md` |
| RGPD-09 | DPA/anexo RGPD dos próprios subcontratantes (Neon/Resend/Vercel) não localizado | Média | P2 | Art. 28º RGPD (accountability sobre subcontratantes) | Localizar ou solicitar aos fornecedores | `docs/legal/DATA_SUBPROCESSORS_REGISTER.md` |
| RGPD-10 | Texto livre (`ocorrencia.descricao`, atas) pode conter dados pessoais de terceiros sem aviso | Baixa | P3 | Art. 5º/1/c (minimização) | Considerar um aviso contextual ao escrever texto livre | `components/ocorrencias/*`, atas |

**RGPD-07 foi resolvido nesta sessão** — email transacional confirmado a funcionar em produção (verificação de conta, reset de password, convocatórias de assembleia, avisos importantes chegam agora de facto aos destinatários). Percurso: chave em falta → chave inválida → falta de domínio verificado → resolvido com o domínio `cobaialab.pt`, já verificado noutro projeto do utilizador. Nota de branding pendente (ver tabela), não bloqueante.

## Próxima fase

Fase C (secções 5–6 do prompt): rever `/privacidade` e `/termos` — já existem, mas estavam marcados como "rascunho técnico" desde 2026-07-09 e precisam de incorporar o achado RGPD-01 (Vercel Analytics) e confirmar se já cobrem os cenários do `CONTROLLER_PROCESSOR_MATRIX.md`.
