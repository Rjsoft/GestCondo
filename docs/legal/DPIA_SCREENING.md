# Avaliação de Necessidade de DPIA — GestCondo

Data: 2026-07-22. Base: RGPD art. 35º, critérios do Grupo de Trabalho do art. 29º (WP248, adotados pelo CEPD) e orientações da CNPD. Este documento só faz o *screening* (é ou não necessária uma DPIA) — não é, em si, uma DPIA.

## Critérios avaliados

| Critério | Aplica-se ao GestCondo hoje? | Nota |
|---|---|---|
| Monitorização sistemática de pessoas em grande escala | Não | Sem funcionalidade de monitorização de comportamento. |
| Videovigilância | Não | Funcionalidade inexistente — a CNPD já se pronunciou sobre este tema para condomínios (consentimento expresso de todos os condóminos, retenção máx. 30 dias salvo investigação criminal) [1], relevante **só se/quando** o GestCondo vier a suportar gestão de câmaras. |
| Perfis comportamentais | Não | Sem qualquer scoring, segmentação ou perfilização de utilizadores. |
| Decisões automatizadas com efeito jurídico/significativo | Não | Juros de mora são calculados automaticamente mas só executados por ação explícita do administrador (`lancarJurosMora`), nunca aplicados sem intervenção humana; sem decisão totalmente automatizada no sentido do art. 22º. |
| Tratamento em larga escala | **Parcialmente — a monitorizar** | Hoje, um número pequeno de condomínios/titulares (piloto real com ~16 frações). Se o produto escalar para muitos condomínios geridos pela mesma administradora, o volume agregado de dados financeiros e pessoais pode justificar reavaliação. |
| Dados financeiros | **Sim** | Quotas, dívidas, pagamentos por fração — dado sensível na aceção comum (não é "categoria especial" do art. 9º, mas é dado financeiro de risco elevado se exposto). |
| Dados relativos a litígios | **Sim, potencialmente** | Ocorrências e atas de assembleia podem registar disputas entre condóminos; texto livre pode conter alegações sobre terceiros. |
| Utilização de inteligência artificial | Não | Sem qualquer funcionalidade de IA na aplicação em produção. |
| Integrações com serviços externos | Sim, mas de baixo risco individual | Neon, Resend, Vercel Blob, Vercel Analytics, Have I Been Pwned — nenhuma constitui, por si, um tratamento de alto risco (ver `DATA_SUBPROCESSORS_REGISTER.md`). |
| Dados de menores | Não identificado | Sem recolha deliberada de dados de menores; teoricamente um proprietário pode ser menor (herança), mas não é um cenário tratado especificamente hoje. |
| Concentração de informação sobre residentes | **Sim, dentro de um condomínio** | Nome, contacto, situação financeira, ocorrências reportadas e presença/voto em assembleia do mesmo titular ficam todos associados à mesma fração — concentração relevante *dentro* de um condomínio, mas sem cruzamento entre condomínios diferentes (isolamento multi-tenant verificado, ver `SECURITY_AUDIT.md` S9). |

## Conclusão

**DPIA não é obrigatória neste momento**, com base nos critérios acima — nenhum dos critérios de alto risco típico (videovigilância, decisões automatizadas, IA, grande escala) se verifica hoje. Os dois pontos mais próximos de exigir atenção redobrada — dados financeiros e concentração de informação por fração — já têm mitigação estrutural (isolamento multi-tenant, controlo de acesso por perfil, soft-delete, auditoria).

**Reavaliar esta conclusão se**:
- o produto passar a suportar videovigilância ou qualquer forma de monitorização;
- o volume de condomínios geridos pela mesma administradora crescer substancialmente (tratamento em larga escala deixa de ser hipotético);
- for introduzida qualquer funcionalidade de decisão automatizada com efeito direto sobre um titular (ex. suspensão automática de acesso por dívida, sem revisão humana).

Não foi criado `DPIA_TEMPLATE.md` — não é necessário enquanto esta conclusão se mantiver.

---

[1] CNPD, participações e orientações sobre videovigilância (incluindo em condomínios), consultado em 2026-07-22: https://www.cnpd.pt/organizacoes/areas-tematicas/videovigilancia/
