# Relatório de viabilidade — funcionalidades de IA para o GestCondo

Data: 2026-07-31. Relatório de análise, pedido em paralelo ao trabalho de "Ler em voz alta" (`docs/RELATORIO_LEITURA_VOZ.md`). Auditoria técnica, não uma decisão de produto.

**Atualização 2026-07-31:** os dois itens P0 (pesquisa melhorada e deteção de inconsistências — item 1 e item 8 abaixo), ambos deterministicamente sem IA como aqui recomendado, foram implementados. Ver `lib/pesquisa-ajuda.ts`/`app/actions/pesquisa.ts` e `lib/inconsistencias.ts`/`app/actions/inconsistencias.ts` (testados). Os restantes itens continuam por implementar.

## Como ler este relatório

Para cada funcionalidade: o que resolve, quem beneficia, se precisa mesmo de IA (vs. alternativa determinística), dados envolvidos, riscos, custo/complexidade, e uma prioridade recomendada (P0 = fazer primeiro, P3 = não vale a pena ainda). Regra geral seguida: **preferir sempre solução determinística, local e gratuita quando produzir o mesmo resultado com mais segurança e previsibilidade** — só recomendar IA quando resolve algo que o determinístico não consegue.

## Classificação por tipo (pedida explicitamente)

| Funcionalidade | Usa mesmo IA/modelo? | Alternativa determinística/pesquisa tradicional? | Precisa de dados reais do condomínio? | Funciona só com documentação pública? |
|---|---|---|---|---|
| Pesquisa melhorada na ajuda | Não (recomendado) | Sim — é a recomendação | Não | Sim |
| Assistente contextual (Q&A sobre a app) | Sim | Parcial (pesquisa + FAQ) | Não | Sim |
| Explicação simplificada | Sim, ou dicionário fixo | Sim, para o conteúdo já existente | Não | Sim |
| Exemplos personalizados | Sim (geração) ou fórmula fixa | Sim — fórmula já usada em `lib/rateio.ts` | Não (valores hipotéticos) | Sim |
| Assistente de preenchimento | Não necessariamente | Sim — validação de formulário normal | Parcial (lê o que já está no ecrã) | Não |
| Resumos (atas, financeiro, etc.) | Sim | Parcial (agregações já existem em código) | **Sim** | Não |
| Deteção preventiva de erros | Não (recomendado) | Sim — é a recomendação | **Sim** | Não |
| Geração assistida de comunicações | Sim | Parcial (modelos de texto fixos) | Parcial | Não |
| Apoio à acessibilidade (simplificação, glossário, resumo por secção) | Misto — ver detalhe | Maioritariamente sim | Não | Sim |

## Prioridade recomendada, por ordem

1. **P0 — Pesquisa melhorada na ajuda** (determinística, sem IA)
2. **P0 — Deteção preventiva de erros** (determinística, sem IA)
3. **P1 — Assistente contextual limitado à documentação, com citação de fonte**
4. **P1 — Explicação simplificada com dicionário fixo primeiro, IA só se insuficiente**
5. **P2 — Exemplos personalizados (fórmula fixa, sem IA)**
6. **P2 — Geração assistida de comunicações, sempre com revisão humana**
7. **P3 — Resumos de dados financeiros/atas** (maior risco RGPD/alucinação)
8. **P3 — Assistente de preenchimento**

---

## 1. Pesquisa melhorada na `/ajuda` — ✅ Implementado 2026-07-31

**Problema concreto:** a pesquisa atual da app (`/pesquisa`) cobre avisos, documentos, ocorrências, condóminos e movimentos — não cobre o conteúdo de `/ajuda`. Um utilizador com uma pergunta ("como aprovo um condómino?") tem de adivinhar em que separador está a resposta.

- **Utilizadores beneficiados:** todos, principalmente leigos e administradores novos.
- **Frequência provável:** alta — é o ponto de entrada mais natural para "não sei como fazer X".
- **Precisa mesmo de IA?** Não. `SECOES_AJUDA` (`components/ajuda/secoes.tsx`) já é texto estruturado em React; uma pesquisa por palavra-chave sobre esse texto (o mesmo padrão de `removerAcentos` + `includes` já usado em `app/actions/pesquisa.ts`) resolve o caso de uso sem qualquer modelo.
- **Alternativa sem IA:** pesquisa textual local, 100% determinística. **É a recomendação.**
- **Dados necessários:** só o texto já público de `SECOES_AJUDA`.
- **Dados enviados para terceiros:** nenhuns.
- **Risco de exposição de dados pessoais:** nenhum.
- **Risco de respostas erradas:** nenhum (não gera texto, só localiza).
- **Validação humana necessária:** não.
- **Custo de implementação/operação:** baixo — reaproveita padrão já existente no projeto.
- **Dependência de fornecedor:** nenhuma.
- **Execução local:** sim, 100%.
- **Impacto no desempenho:** nenhum.
- **Complexidade de manutenção:** baixa.
- **Prioridade: P0.**

---

## 2. Assistente contextual da ajuda (perguntas em linguagem natural)

**Problema concreto:** mesmo com pesquisa melhorada, uma pergunta formulada de forma diferente do texto ("o que faço se um condómino quiser sair?") pode não encontrar a secção certa por pesquisa literal.

- **Utilizadores beneficiados:** leigos totais, sobretudo quem não sabe o vocabulário certo para pesquisar.
- **Frequência provável:** média — só supera a pesquisa simples em perguntas mal formuladas.
- **Precisa mesmo de IA?** Sim, para perguntas verdadeiramente em linguagem livre — mas com um âmbito muito estreito (RAG só sobre `SECOES_AJUDA` e o conteúdo de `/instrucoes`, nunca dados do condomínio).
- **Alternativa sem IA:** pesquisa melhorada (item 1) cobre grande parte dos casos com risco zero.
- **Dados necessários:** só o texto de ajuda já público — nenhum dado do condomínio deve ser exposto ao modelo.
- **Dados enviados para terceiros:** a pergunta do utilizador e o texto de ajuda relevante seriam enviados a um fornecedor de modelo (via Vercel AI Gateway, por exemplo) — **isto exige decisão e autorização explícitas do utilizador antes de qualquer implementação**, por ser a primeira vez que texto sai da aplicação para um serviço externo.
- **Risco de exposição de dados pessoais:** baixo, se o âmbito for mesmo restrito à documentação pública (sem acesso a `condominioId`, movimentos, condóminos, etc.) — mas exige desenho cuidadoso para nunca ser tentador "só espreitar os dados para dar uma resposta melhor".
- **Risco de respostas erradas/alucinação:** real — modelos inventam com confiança. Mitigação obrigatória: citar sempre a secção da ajuda que suporta a resposta, admitir quando não sabe, nunca inventar regra legal/contabilística, nunca executar ações.
- **Validação humana necessária:** não por resposta individual (é read-only, sem efeitos), mas o comportamento do assistente (prompts, âmbito) precisa de revisão antes de publicar.
- **Custos:** por token, recorrente, dependente do fornecedor escolhido — a avaliar antes de decidir.
- **Dependência de fornecedor:** sim (modelo de linguagem).
- **Execução local:** não, salvo um modelo pequeno correndo no browser (qualidade duvidosa em português).
- **Impacto no desempenho:** baixo se assíncrono/opt-in.
- **Complexidade de manutenção:** média — prompt, citações, testes de regressão de qualidade.
- **Prioridade: P1**, só depois da pesquisa melhorada (item 1) já existir e se mostrar insuficiente na prática.

---

## 3. Pesquisa semântica

Sobreposta com os itens 1 e 2 — não é uma funcionalidade à parte, é a técnica que suporta o assistente contextual (item 2) quando a pesquisa por palavra-chave (item 1) não chega. Comparação pedida:

| Abordagem | Precisão para "como registo uma despesa?" | Custo | Complexidade | Dados fora do dispositivo |
|---|---|---|---|---|
| Pesquisa tradicional melhorada (item 1) | Boa, se o texto contiver as palavras certas | Zero | Baixa | Não |
| Pesquisa semântica local (embeddings pequenos, sem servidor) | Melhor para paráfrases | Baixo (cálculo local) | Média | Não, se o modelo de embeddings correr no browser/servidor próprio |
| Modelo externo (LLM completo) | Melhor para perguntas complexas/compostas | Recorrente por uso | Alta | Sim (texto enviado ao fornecedor) |

**Recomendação:** começar pela pesquisa tradicional (item 1); só avançar para semântica/LLM se, na prática, houver queixas reais de "não encontrei a resposta" — não implementar preventivamente.

---

## 4. Explicação simplificada ("Explicar de forma mais simples")

**Problema concreto:** mesmo depois da expansão de `/ajuda` desta sessão, algum texto pode continuar denso para um leigo total (ex: partes de Assembleias/Finanças).

- **Utilizadores beneficiados:** leigos totais, dificuldades de leitura/compreensão.
- **Frequência provável:** baixa a média — só nos pontos mais densos.
- **Precisa mesmo de IA?** Parcialmente. Para o conteúdo **já existente e finito** de `/ajuda`, um dicionário fixo de reformulações (escritas e revistas uma vez por um humano, não geradas em tempo real) é mais seguro, mais barato e sem risco de alucinação. IA generativa só faria sentido para conteúdo dinâmico que ainda não existe em texto simplificado — o que não é o caso aqui (`SECOES_AJUDA` é finito e controlado).
- **Alternativa sem IA:** escrever, uma vez, uma versão "ainda mais simples" de cada secção mais densa (como já foi feito nesta sessão para Finanças/Assembleias) e alternar entre as duas com um botão — sem geração em tempo real, sem custo recorrente, sem risco de alucinação.
- **Dados necessários:** nenhum além do texto já existente.
- **Dados enviados para terceiros:** nenhuns, na alternativa sem IA.
- **Risco de respostas erradas:** zero na alternativa sem IA (texto revisto por humano); real se gerado em tempo real por modelo, e "explicar de forma diferente" um artigo legal citado é exatamente o tipo de situação onde uma alucinação teria consequência prática.
- **Deve sempre existir acesso ao texto original** e indicação clara de que é uma versão simplificada — requisito já satisfeito trivialmente ao alternar entre dois textos escritos por nós.
- **Custo:** baixo (tempo de escrita humana, uma vez).
- **Prioridade: P1**, mas **sem IA** — é fundamentalmente um trabalho de redação, não um problema de modelo.

---

## 5. Exemplos personalizados

**Problema concreto:** o exemplo do "Prédio das Amendoeiras" (já usado em `/instrucoes` e `/ajuda`) é fixo — um utilizador podia querer ver o cálculo com os números do seu próprio prédio, sem usar dados reais.

- **Utilizadores beneficiados:** quem está a decidir a permilagem/orçamento do seu condomínio.
- **Frequência provável:** baixa (uso pontual, não recorrente).
- **Precisa mesmo de IA?** Não. A fórmula já existe e está testada (`lib/rateio.ts`, `lib/juros.ts`) — um pequeno formulário ("quantas frações, que permilagem, que orçamento") que chama essas mesmas funções puras dá exatamente o mesmo resultado, sem inventar nada e sem custo de modelo.
- **Alternativa sem IA:** interface simples sobre as funções já existentes. **É a recomendação.**
- **Dados necessários:** só os valores que o próprio utilizador escrever no formulário, nunca os dados reais do condomínio por defeito.
- **Dados enviados para terceiros:** nenhuns.
- **Risco de respostas erradas:** zero — é a mesma fórmula já usada para calcular quotas reais.
- **Custo:** baixo — reaproveita lógica já testada.
- **Prioridade: P2** (agradável, não urgente).

---

## 6. Assistente de preenchimento

**Problema concreto:** ajudar a explicar campos de formulário e detetar omissões (ex: esqueceu-se de preencher a permilagem).

- **Utilizadores beneficiados:** administradores a preencher formulários pela primeira vez (frações, orçamentos).
- **Frequência provável:** média, concentrada nas primeiras utilizações.
- **Precisa mesmo de IA?** Não para a parte de "detetar omissões" (validação de formulário standard, já parcialmente existente via campos obrigatórios). Só faria sentido IA para "explicar o campo em contexto" de forma mais rica do que um texto de ajuda fixo — valor marginal sobre simplesmente ter um texto de apoio junto ao campo (`placeholder`/texto auxiliar, já um padrão usado na app).
- **Alternativa sem IA:** texto de apoio fixo junto a cada campo + validação de formulário (já existente em grande parte). **É a recomendação.**
- **Importante, conforme pedido:** nunca preencher nem submeter informação sensível de forma autónoma — mesmo numa versão futura com IA, isto teria de continuar a ser assistivo, nunca automático.
- **Dados necessários:** o que já está no ecrã (não precisa de aceder a mais nada).
- **Risco de respostas erradas:** baixo se limitado a texto de apoio estático.
- **Prioridade: P3** — o ganho sobre texto de apoio estático bem escrito é pequeno para o custo de implementar IA aqui.

---

## 7. Resumos (atas, documentos, ocorrências, situação financeira, tarefas pendentes)

**Problema concreto:** um administrador ocupado pode querer um resumo rápido em vez de ler tudo.

- **Utilizadores beneficiados:** administradores, gestores.
- **Frequência provável:** média, mais alta antes de assembleias.
- **Precisa mesmo de IA?** Sim, para texto verdadeiramente livre (atas, documentos); **não** para "situação financeira" nem "tarefas pendentes", que já são dados estruturados (saldos, dívidas, ocorrências abertas) melhor servidos por um resumo determinístico (agregações já existentes no Painel e em Finanças) do que por um modelo a "reler" números e arriscar arredondar ou inverter algo.
- **Alternativa sem IA:** para dados estruturados, sim — é a recomendação (já existe grande parte disto no Painel). Para atas/documentos em texto livre, não há alternativa determinística equivalente.
- **Dados necessários:** **dados reais do condomínio** (financeiros, atas com deliberações, ocorrências) — o item mais sensível de toda esta lista.
- **Dados enviados para terceiros:** se usar um modelo externo, sim — conteúdo financeiro e de atas sairia da aplicação. Exige decisão explícita sobre fornecedor, retenção de dados pelo fornecedor, e comunicação aos condóminos (RGPD).
- **Risco de exposição de dados pessoais:** alto — atas e finanças contêm nomes, dívidas nominais, moradas. Exigiria, no mínimo, avaliação de impacto (DPIA) antes de sequer prototipar.
- **Risco de alucinação:** particularmente grave aqui — um resumo financeiro errado ("o condomínio tem X€ de saldo") pode ser tomado como facto e usado para decisões reais.
- **Fundamento legal para processar estes dados através de um fornecedor de IA:** teria de ser avaliado (provavelmente exigiria consentimento ou base de interesse legítimo muito bem justificada, e um Acordo de Processamento de Dados com o fornecedor).
- **Retenção/alojamento de dados pelo fornecedor:** a confirmar por fornecedor, antes de qualquer decisão.
- **Custos:** recorrentes, por volume de texto processado.
- **Prioridade: P3** — maior valor potencial de toda a lista, mas também o maior risco; não avançar sem uma decisão deliberada sobre RGPD e revisão jurídica, não só técnica.

---

## 8. Deteção preventiva de erros/inconsistências — ✅ Implementado (parcial) 2026-07-31

Implementadas 4 das verificações sugeridas (permilagem esquecida, movimentos possivelmente duplicados, atas por escrever, pontos de assembleia sem resultado) — ver `lib/inconsistencias.ts`. Não implementadas por não corresponderem a um estado real do schema atual (ver `FUNCTIONAL_GAPS.md`): "documentos sem associação" (a tabela `documento` nunca foi desenhada para exigir uma associação) e "totais que não coincidem"/"datas incompatíveis" (não identificado um caso concreto e real no schema atual que justifique a verificação, para não implementar uma condição especulativa).

**Problema concreto:** totais que não batem certo, datas incompatíveis, frações sem permilagem, documentos sem associação, pagamentos duplicados, assembleias sem informação obrigatória.

- **Utilizadores beneficiados:** administradores, sobretudo antes de fechar um exercício ou preparar uma assembleia.
- **Frequência provável:** alta, se corrido automaticamente (ex: ao abrir Finanças ou antes de gerar o dossier de assembleia).
- **Precisa mesmo de IA?** **Não.** Todos os exemplos dados são verificações determinísticas clássicas: soma de permilagem ≠ 1000‰ (já existe, `lib/fracoes.ts`), duas quotas iguais na mesma fração/mês, data de assembleia sem convocatória, movimento sem conta associada, etc. — tudo `if`/consulta SQL, sem ambiguidade nenhuma a resolver.
- **Alternativa sem IA:** funções de validação determinísticas, reaproveitando o padrão já usado (`lib/fracoes.ts:excedePermilagemTotal`, etc.). **É a recomendação, sem exceção.**
- **Dados necessários:** dados reais do condomínio, mas processados **localmente no servidor da aplicação**, nunca enviados a um fornecedor externo — não há razão nenhuma para isto sair da aplicação.
- **Risco de respostas erradas:** zero, se implementado como validação determinística (ao contrário de pedir a um modelo para "encontrar inconsistências", que teria falsos positivos/negativos sem necessidade).
- **Custo:** baixo — funções puras, testáveis, sem custo de modelo.
- **Prioridade: P0**, junto com o item 1 — é puro trabalho de engenharia determinística, sem qualquer motivo para envolver IA.

---

## 9. Geração assistida de comunicações (avisos, convocatórias, lembretes)

**Problema concreto:** escrever o texto de um aviso ou convocatória do zero pode ser difícil para um administrador leigo.

- **Utilizadores beneficiados:** administradores voluntários, sobretudo os que não se sentem à-vontade a escrever formalmente.
- **Frequência provável:** média — usado a cada aviso/convocatória, mas cada instância é rápida de rever.
- **Precisa mesmo de IA?** Parcialmente. Para os casos mais comuns (aviso de corte de água, lembrete de quota em atraso, convocatória standard), **modelos de texto fixos com campos a preencher** (já parcialmente existente — ver `lib/lembrete-cobranca.ts`) resolvem sem IA. IA generativa só acrescenta valor real para texto verdadeiramente à medida, fora do que um modelo fixo cobre.
- **Alternativa sem IA:** modelos de texto fixos, como já existe para lembretes de cobrança. Cobre a maioria dos casos.
- **Dados necessários:** dados do condomínio (nome, valores, datas) — mas isto já acontece hoje sem IA, ao preencher um modelo fixo.
- **Dados enviados para terceiros:** só se usar IA generativa para o rascunho — nesse caso, sim.
- **Risco de respostas erradas:** o pedido já exige, corretamente, revisão e confirmação humana sempre antes do envio — isto reduz bastante o risco prático, mas não elimina a possibilidade de um rascunho gerado incluir uma afirmação legal incorreta que o administrador, não sendo jurista, não detete.
- **Custo:** só se optar pela via com IA generativa.
- **Prioridade: P2** — começar pelos modelos fixos (baixo risco, já há precedente no código); só considerar geração livre por IA depois de validar que os modelos fixos não chegam.

---

## 10. Apoio à acessibilidade (agregado)

Analisado item a item, cruzando com o que já foi feito nesta sessão:

| Sub-funcionalidade | Já existe? | Precisa de IA? |
|---|---|---|
| Simplificação de linguagem | Parcial (feito nesta sessão para Finanças/Assembleias) | Não — ver item 4 |
| Leitura guiada (ler em voz alta) | ✅ Implementado nesta sessão | Não — Web Speech API nativa |
| Glossário contextual | ✅ Já existe em `/ajuda` → "Começar aqui" e nos glossários por módulo | Não |
| Explicação de siglas | Parcial (RGPD/NIF acrescentados nesta sessão; outras podem faltar) | Não |
| Resumo por secção | Não existe | Poderia ser IA (item 4) ou um resumo fixo escrito à mão por secção — mesma lógica do item 4 |
| Modo de alto contraste | Não existe | Não — é CSS/tema, sem relação com IA |
| Adaptação de tamanho/espaçamento do texto | Não existe (depende do zoom do browser, já funcional) | Não |

**Conclusão:** a maior parte deste bloco já está resolvida ou é trabalho de engenharia normal (CSS, redação), não uma funcionalidade de IA. O único item genuinamente candidato a IA (resumo por secção) tem a mesma análise do item 4 — preferir texto escrito à mão sobre geração em tempo real, dado o conteúdo ser finito e controlado.

---

## Resumo executivo

Das 9 áreas analisadas, **4 não precisam de IA nenhuma** (pesquisa melhorada, deteção de inconsistências, exemplos personalizados, assistente de preenchimento) e resolvem-se com engenharia determinística que já seguiria os padrões existentes no código. Das restantes, o **assistente contextual sobre a documentação pública** (item 2) é o candidato a IA mais seguro para começar — âmbito fechado, sem dados do condomínio, com citação de fonte obrigatória. **Resumos sobre dados financeiros/atas reais** (item 7) é o de maior risco (RGPD, alucinação com consequência prática) e o que exige mais trabalho prévio fora do código (avaliação legal) antes de sequer prototipar.
