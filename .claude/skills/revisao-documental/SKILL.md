---
name: revisao-documental
description: Revisão rigorosa de documentação de governança do GestCondo (segurança, RGPD, rastreabilidade, acessibilidade, estado funcional) antes de aplicar qualquer alteração — diff aprovado previamente pelo utilizador, verificação de cada afirmação contra o código real, verificação cruzada contra os outros documentos relacionados, sem escrever nada sem evidência. Usar quando o utilizador pedir para rever, atualizar, corrigir ou consolidar SECURITY_AUDIT.md, GDPR_CHECKLIST.md, RAT.md, DATA_RETENTION_MATRIX.md, DOCUMENT_TRACEABILITY_AUDIT.md, ACCESSIBILITY_AUDIT.md, PRE_CLIENTE_EXTERNO.md, CHECKLIST_TESTE_MANUAL.md, FUNCTIONAL_GAPS.md, MVP_PLAN.md, ROADMAP.md, TECHNICAL_DEBT.md, ou qualquer documento equivalente que descreva estado técnico, legal ou funcional do projeto.
---

# Revisão documental rigorosa — GestCondo

Protocolo fixado a partir do padrão já seguido repetidamente neste projeto para rever documentação de auditoria/conformidade/estado funcional. Aplica-se a `SECURITY_AUDIT.md`, `GDPR_CHECKLIST.md`, `RAT.md`, `docs/legal/DATA_RETENTION_MATRIX.md`, `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md`, `docs/audit/ACCESSIBILITY_AUDIT.md`, `docs/audit/PRE_CLIENTE_EXTERNO.md`, `docs/CHECKLIST_TESTE_MANUAL.md`, `FUNCTIONAL_GAPS.md`, `MVP_PLAN.md`, `ROADMAP.md`, `TECHNICAL_DEBT.md`, `docs/product/*_GAP_ANALYSIS.md` — ou a qualquer documento novo do mesmo género (descreve estado técnico/legal/funcional do projeto, lido por ti ou por terceiros para decidir algo).

**Argumento**: o(s) ficheiro(s) a rever, e o motivo/contexto da revisão (ex. "consolidar o estado da Fase X", "corrigir uma contradição encontrada em Y").

## Princípio geral

Nada é escrito num documento sem evidência verificável no código, e nada é aplicado a um ficheiro sem o utilizador ver e aprovar o diff primeiro. Isto não é negociável mesmo quando a alteração parece pequena ou óbvia.

## Passos

1. **Ler o(s) ficheiro(s) alvo na íntegra** (não confiar em memória de sessão nem em resumos anteriores — o ficheiro pode ter mudado).

2. **Verificar cada afirmação candidata contra o código real** antes de a propor — `grep`/`Read` do ficheiro/função/tabela citada. Nunca escrever "implementado", "corrigido", "auditado", "testado" ou equivalente sem confirmar isso na fonte. Se não for possível confirmar, dizê-lo explicitamente em vez de assumir.

3. **Listar as alterações propostas**, uma a uma, cada uma com:
   - secção/linha alterada;
   - texto anterior;
   - texto novo;
   - motivo da alteração;
   - relação com o que motivou a revisão (ex. uma fase de implementação concluída, uma contradição encontrada);
   - limitações ou pontos que continuam pendentes mesmo depois da alteração.

4. **Nunca confundir categorias que este projeto trata como distintas**:
   - "implementado e validado em desenvolvimento" vs. "validado em produção";
   - "estado técnico atual" vs. "política/decisão formal definitiva";
   - conjuntos de lacunas rastreados em documentos diferentes (ex. T1–T4 de rastreabilidade em `DOCUMENT_TRACEABILITY_AUDIT.md` vs. L1–L4/L5–L8 de acessibilidade em `ACCESSIBILITY_AUDIT.md`) — nunca aparecem misturados no mesmo sítio;
   - observação vs. decisão do utilizador vs. recomendação vs. hipótese — indicar sempre qual é qual;
   - "não é um bloqueador" tem de ser justificado com o critério real do projeto (risco concreto de perda/corrupção de dados, cálculo financeiro incorreto, falha de isolamento multi-tenant, exposição indevida de dados, incapacidade de cumprir obrigação legal essencial, incapacidade de recuperar de migração falhada, ou utilização enganadora/insegura) — não classificar algo como bloqueador só por parecer importante, nem desclassificar algo que cumpre esse critério.

5. **Verificação cruzada** contra os outros documentos do mapa da documentação (ver `CLAUDE.md` do projeto, secção "Mapa da documentação") que possam referenciar o mesmo facto, para detetar:
   - estados divergentes entre documentos para o mesmo item;
   - datas ou prioridades divergentes;
   - algo apresentado como concluído num ficheiro e como pendente noutro;
   - produção apresentada como concluída nalgum sítio sem o ser;
   - retenção de dados apresentada como definitiva quando é provisória;
   - contradição interna dentro do próprio ficheiro revisto (ex. uma secção recente contradiz uma frase mais antiga que ficou esquecida no fim do documento).

6. **Apresentar o diff completo proposto** ao utilizador antes de tocar em qualquer ficheiro — nunca aplicar preventivamente "porque parece óbvio". Se a resposta arriscar ficar cortada por ser longa, dividir por ficheiro/secção em blocos mais estreitos em vez de encurtar o conteúdo.

7. **Aguardar aprovação explícita.** Aplicar só depois de o utilizador confirmar — e aplicar exatamente o texto aprovado, nem mais nem menos, mesmo que surjam outras melhorias óbvias pelo caminho (registar essas à parte, não as incluir sem autorização).

8. **Depois de aplicado, confirmar que o resultado corresponde ao aprovado** — reler ou `grep` os pontos-chave da alteração.

9. **Revisão documental e commit são passos distintos.** Não criar commits nem tocar noutros ficheiros sem autorização separada para essa etapa. Ao commitar (só quando pedido), seguir a disciplina de staging já estabelecida no projeto: caminhos exatos, nunca `git add -A`/`git add .`/`git commit -a`, verificar `git diff --cached --name-only`/`--stat` antes de cada commit, uma mensagem por commit, sem `push` sem autorização à parte.

10. **Relatório final**, sempre:
    - ficheiro(s) alterado(s) e diff efetivamente aplicado;
    - resultado da verificação cruzada;
    - confirmação de que nada mais foi alterado;
    - confirmação de que não foi criado nenhum commit (salvo se essa etapa também foi autorizada e executada — nesse caso, hash e ficheiros do commit);
    - confirmação de que não houve `push`;
    - confirmação de que produção não foi acedida nem alterada;
    - o que ficou pendente ou por confirmar, se algo ficou.

## O que este skill não faz

Não decide sozinho promover algo a produção, não corrige código a partir de uma revisão documental sem autorização à parte, e não assume que uma alteração aprovada num documento anterior desta sessão continua válida sem reler o ficheiro atual primeiro.
