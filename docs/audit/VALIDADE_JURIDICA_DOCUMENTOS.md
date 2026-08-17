# Validade jurídica dos documentos emitidos pelo GestCondo

Data: 2026-08-17. **Auditoria técnica, não parecer jurídico.** Pedido do utilizador: avaliar em detalhe a validade de todos os documentos formais/imprimíveis gerados pela aplicação, com foco no caso de uso concreto de apresentação de uma declaração de dívida numa **escritura de compra e venda de uma fração**.

Âmbito: os 13 documentos imprimíveis existentes (todos usam `components/print/cabecalho-documento.tsx` e são gerados via "Imprimir/guardar em PDF" do browser — não há assinatura digital nem submissão a um serviço de assinatura integrada na aplicação). Complementa `docs/audit/LEGAL_COMPLIANCE_AUDIT.md` (Fase D, 2026-07-22), que avalia a completude do modelo de dados face à lei, não a validade formal dos documentos gerados.

Distinção usada ao longo do documento: **facto confirmado na fonte** (com hiperligação) vs. **hipótese/inferência razoável** vs. **risco identificado** vs. **recomendação**.

## Tabela-resumo

| Documento | Base legal citada no código | Estado |
|---|---|---|
| Declaração de dívida | Art. 1424º-A CC | ✅ Corrigido 2026-08-17 — bloco de assinatura acrescentado (dois campos: Administração Externa/Interna), mais nota explicativa na própria página sobre reconhecimento notarial e assinatura qualificada via GOV.PT |
| Interpelação para pagamento | Arts. 805º/806º CC + art. 6º DL 268/94 | ✅ Adequado (tem assinatura; base legal verificada em sessão anterior) |
| Recibo de quota | Art. 23º/4 CIRC | 🟡 Sem qualquer bloco de assinatura/identificação de quem emite |
| Ata de assembleia | (nenhuma citada no conteúdo) | ✅ Corrigido 2026-08-17 — bloco de assinatura acrescentado (Presidente da Mesa + Secretário), só quando a ata está aprovada |
| Convocatória | Art. 1432º CC | ✅ Adequado (tem assinatura; base legal verificada em sessão anterior) |
| Procuração para assembleia | Arts. 1431º/3 e 262º/1 CC | ✅ Adequado (bloco de assinatura completo, revisto com o utilizador) |
| Carta de comunicação de deliberação | Art. 1432º/8-11 CC | ✅ Adequado (tem assinatura; base legal verificada em sessão anterior) |
| Dossier de apoio à assembleia | Art. 1436º/1/j CC (referência) | ✅ Adequado — autodeclarado não vinculativo |
| Balanço orçamental | (nenhuma) | ✅ Adequado — autodeclarado não substitui documentos contabilísticos oficiais |
| Balanço patrimonial | (nenhuma) | ✅ Adequado — idem, com limitação já assumida (adiantamentos) |
| Antiguidade da dívida | (nenhuma) | ✅ Adequado — relatório interno, não pretende valor externo |
| Mapa mensal de quotas | (nenhuma) | ✅ Adequado — idem balanço |
| Relatório de movimentos | (nenhuma) | ✅ Adequado — idem balanço |
| **Caso de uso: assinatura via GOV.PT para a escritura** | Art. 25º/2 Regulamento (UE) 910/2014 (eIDAS) + art. 3º/2 e 3º/5 DL 12/2021 (texto literal confirmado 2026-08-17 via anacom.pt) | 🟢 Base legal confirmada na fonte; nenhuma fonte encontrada confirma a alegação de recusa pelo IRN — pelo contrário, o próprio IRN usa/aceita este tipo de assinatura nos seus canais — mas aceitação por um notário/conservatória concreto não pode ser garantida à distância |

---

## Caso de uso: declaração de dívida para uma escritura de compra e venda

### O que a lei exige (confirmado na fonte)

O [art. 1424º-A do Código Civil](https://informador.pt/legislacao/lexit/codigos/direito-civil/codigo-civil/livro-iii-direito-das-coisas/titulo-ii-do-direito-de-propriedade/subtitulo-iv-do-exercicio-e-tutela-dos-direitos-5/capitulo-vi-propriedade-horizontal/seccao-iii-direitos-e-encargos-dos-condominos/artigo-1424-o-a-responsabilidade-por-encargos-do-condominio/) (aditado pela Lei n.º 8/2022) tem dois números:

1. O condómino, para efeitos de celebração de contrato de alienação da fração, requer ao administrador a emissão de declaração escrita da qual conste o montante de todos os encargos de condomínio em vigor relativamente à sua fração, com especificação da sua natureza, respetivos montantes e prazos de pagamento, bem como, caso se verifique, das dívidas existentes, respetiva natureza, montantes, datas de constituição e vencimento.
2. A declaração é emitida pelo administrador no prazo máximo de 10 dias a contar do requerimento e **constitui um documento instrutório obrigatório da escritura ou do documento particular autenticado de alienação da fração**.

**Facto confirmado**: o artigo não impõe nenhuma forma especial de assinatura (nem reconhecimento notarial, nem assinatura eletrónica qualificada) — é omisso quanto a isso.

### Reconhecimento notarial da assinatura: exigido por lei ou só por hábito?

**Facto confirmado**, via [artigo da Idealista sobre a obrigatoriedade da declaração de dívidas](https://www.idealista.pt/news/imobiliario/habitacao/2024/09/17/65684-a-declaracao-de-dividas-ao-condominio-e-obrigatoria-na-venda-de-casas), citando diretamente a prática:

> "Infelizmente o critério utilizado não tem sido uniforme, especialmente no que respeita aos notários. Alguns só aceitam a declaração com o reconhecimento da assinatura do administrador do condomínio, sem que haja previsão legal para essa exigência."

Ou seja:
- A **lei não exige** reconhecimento notarial da assinatura do administrador.
- **Na prática**, alguns notários/cartórios exigem-no de qualquer forma, por hábito ou precaução, sem base legal.
- Quando exigido, a despesa do reconhecimento (12–20€, segundo a mesma fonte) é do **condómino alienante**, não do condomínio.
- A própria declaração pode ser **dispensada** se o adquirente declarar expressamente, na escritura ou documento particular autenticado, que prescinde dela — nesse caso assume a responsabilidade por eventuais dívidas do vendedor ao condomínio.

**Conclusão desta secção**: não há uma resposta única e garantida — depende do notário/conservatória concreto. Este é um facto relevante para gerir expectativas do utilizador: mesmo um documento perfeito gerado pela app pode ser rejeitado por um cartório que exija reconhecimento presencial por hábito.

### A alternativa investigada nesta sessão: assinatura qualificada via GOV.PT (Cartão de Cidadão / Chave Móvel Digital)

O utilizador pediu para avaliar se assinar o PDF gerado pela app com a **Assinatura Qualificada do Cartão de Cidadão ou da Chave Móvel Digital** (serviço oficial do Estado, tipicamente em autenticacao.gov.pt ou na app "gov.pt") resolve, na prática, a questão do reconhecimento.

**Factos confirmados**, incluindo o texto literal do diploma (verificado 2026-08-17 diretamente na página oficial da ANACOM, que reproduz o articulado — o acesso direto a diariodarepublica.pt/dre.pt e pgdlisboa.pt falhou tecnicamente para as ferramentas desta sessão, mas a ANACOM, autoridade administrativa independente, publica o texto integral do artigo):

1. O [art. 25º, n.º 2, do Regulamento (UE) n.º 910/2014 (eIDAS)](https://pt.wikipedia.org/wiki/Assinatura_eletr%C3%B3nica_qualificada) estabelece que uma assinatura eletrónica **qualificada** produz efeitos jurídicos equivalentes aos de uma assinatura manuscrita, em toda a UE. O Regulamento eIDAS é diretamente aplicável em Portugal.
2. A execução deste regime na ordem jurídica interna foi feita pelo **Decreto-Lei n.º 12/2021, de 9 de fevereiro** — este diploma substituiu/atualizou o quadro legal mais antigo do Decreto-Lei n.º 116-A/2006 (mencionado na pergunta original), que era anterior à entrada em vigor do eIDAS.
3. **Texto literal confirmado** (fonte: [anacom.pt](https://www.anacom.pt/render.jsp?contentId=1602535), citando o Decreto-Lei n.º 12/2021):
   - **Art. 3º, n.º 2**: "A aposição de uma assinatura eletrónica qualificada a um documento eletrónico equivale à assinatura autógrafa dos documentos com forma escrita sobre suporte de papel", criando a presunção de que quem apôs a assinatura é o seu titular, que o fez com intenção de assinar, e que o documento não sofreu alterações posteriores.
   - **Art. 3º, n.º 5**: o documento eletrónico com assinatura eletrónica qualificada tem "a força probatória de documento particular assinado, nos termos do artigo 376º do Código Civil".
   - O art. 376º CC é precisamente a norma que regula os efeitos probatórios de um documento particular cuja autoria (assinatura) esteja reconhecida — ou seja, a lei portuguesa já trata um documento com assinatura eletrónica qualificada como tendo o nível de prova de autoria que o "reconhecimento" tradicionalmente serve para estabelecer.
4. A Assinatura Qualificada disponibilizada pelo Estado através do Cartão de Cidadão e da Chave Móvel Digital (páginas oficiais em autenticacao.gov.pt) é uma assinatura eletrónica **qualificada** na aceção do eIDAS — distinta de uma assinatura eletrónica simples (ex. clicar "aceito" ou uma imagem de assinatura colada num PDF, que **não** tem esta equivalência legal).

**Conclusão, agora com base legal confirmada na fonte (não só hipótese)**: um PDF gerado pela app e depois assinado pelo administrador com Assinatura Qualificada via GOV.PT tem, legalmente, força probatória equivalente à de um documento particular assinado (art. 376º CC) — o mesmo nível de prova de autoria que o reconhecimento notarial tradicionalmente serve para estabelecer. Em princípio, **não deveria** ser necessário nenhum passo adicional de reconhecimento presencial da assinatura para efeitos do art. 1424º-A CC.

**O que continua em aberto (não confirmável à distância)**:
- A mesma inconsistência prática já identificada para a assinatura manuscrita reconhecida pode repetir-se aqui: um notário/conservatória pouco familiarizado com a verificação de uma assinatura eletrónica qualificada pode, na prática, hesitar em aceitá-la ou pedir confirmação adicional — mesmo que, legalmente, não tenha esse direito. Isto **não pode ser confirmado nem afastado à distância**; só a experiência concreta com o cartório escolhido o dirá.
- Existe também o portal **Assinatura Digital / Mosaico** (mosaico.gov.pt) como via alternativa oficial para assinar documentos — não foi comparado em detalhe com o fluxo de autenticacao.gov.pt nesta auditoria.

### A alegação de que o IRN não aceita a Assinatura Digital via GOV.PT

O utilizador colocou uma dúvida concreta: tem a perceção de que o **IRN (Instituto dos Registos e do Notariado)** não reconhece a Assinatura Digital feita via GOV.PT (CMD/Cartão de Cidadão) como válida para os seus próprios atos, apesar da equivalência legal geral confirmada acima — e estranha essa possível contradição.

É importante distinguir três perguntas diferentes, fáceis de confundir:
- **(a)** A validade legal geral de uma assinatura eletrónica qualificada como equivalente a assinatura manuscrita (eIDAS/DL 12/2021) — é sobre o documento **entre privados**, já tratada acima.
- **(b)** Se um notário/conservador, ao praticar um ato formal, aceita esse documento assinado eletronicamente como prova suficiente de autenticidade — pode ter regras próprias, mais restritas do que a lei geral.
- **(c)** Se existe alguma exigência específica portuguesa (ex. só aceitarem documentos autenticados por advogado/solicitador, ou assinatura presencial) independente da lei geral das assinaturas eletrónicas.

**O que a pesquisa encontrou, e o que não encontrou:**

- **Não encontrei nenhuma fonte** (circular, parecer do Conselho Consultivo do IRN, orientação oficial, notícia jurídica) que confirme a alegação de que o IRN recusa a Assinatura Qualificada via CMD/Cartão de Cidadão. Procurei especificamente nos [pareceres do Conselho Consultivo do IRN](https://irn.justica.gov.pt/Sobre-o-IRN/Doutrina-registal/Pareceres-do-Conselho-Consultivo) e no site institucional, sem sucesso a localizar este tema.
- **Encontrei evidência do contrário**: o próprio IRN, nos seus canais de submissão de pedidos de registo (civil, predial, comercial, automóvel) que não possam ser feitos online, **aceita explicitamente** documentos assinados eletronicamente pelos participantes "com o cartão de cidadão, a chave móvel digital ou outra modalidade de assinatura eletrónica qualificada" — [confirmado em fonte relacionada com o funcionamento dos serviços de registo](https://imojuris.vidaimobiliaria.com/actualidade/noticias/COVID-19-Pedidos-de-registo-predial-que-nao-possam-ser-efetuados-online-podem-ser-enviados-por-correio-eletronico/).
- Também encontrei que a própria **Ordem dos Notários** tem em curso um projeto de escrituras/atos notariais digitais, assinados com certificados qualificados dos intervenientes e do próprio notário, e mantém um [Arquivo Eletrónico de Documentos Notariais](https://arquivo.notarios.pt/) — o que indica uma direção institucional de aceitação crescente da assinatura eletrónica qualificada nos atos notariais, não de recusa.

**Conclusão honesta**: **não consegui confirmar nem afastar** a alegação específica do utilizador com uma fonte primária direta sobre este cenário exato (uma declaração de dívida de condomínio, assinada eletronicamente, apresentada como documento instrutório de uma escritura). A evidência disponível **pende para a aceitação** (o próprio IRN usa e aceita este tipo de assinatura nos seus canais), o que contraria a perceção do utilizador tal como descrita — mas:
- Pode existir uma experiência real e concreta por trás da perceção do utilizador (ex. um caso específico com um cartório ou conservatória em particular, um sistema informático que não reconheceu o certificado, ou uma exigência de um profissional em concreto) que esta pesquisa, feita à distância e sobre fontes gerais, não consegue captar nem confirmar.
- Recomenda-se que, antes de comunicar ao utilizador ou a terceiros que "isto resolve o problema", se peça ao próprio utilizador a origem da sua perceção (se tiver uma fonte, um caso concreto, ou o nome do notário/conservatória em causa) — pode revelar uma exceção real e específica que vale a pena investigar com mais precisão — e que, em qualquer caso, se confirme diretamente com o notário/conservatória escolhido antes de depender deste workflow como solução garantida.

**Atualização 2026-08-17 (após entrega desta auditoria)**: questionado sobre a origem da sua perceção, o utilizador não indicou um caso concreto — respondeu com o link oficial do Decreto-Lei n.º 12/2021 no Diário da República, pedindo confirmação do texto na fonte primária. Esse texto foi entretanto confirmado (ver secção anterior, via anacom.pt, dado o acesso direto a dre.pt continuar indisponível para as ferramentas desta sessão). Não surgiu nenhuma evidência adicional que sustente a recusa pelo IRN — a conclusão desta secção mantém-se: a base legal da via GOV.PT está confirmada, a alegação de recusa pelo IRN não tem fonte que a confirme.

**Workflow recomendado, hoje já viável tecnicamente com o que a app oferece**:
1. Administrador acede a `/financas/declaracao-divida/[fracaoId]`, clica em "Registar emissão e imprimir" (regista o snapshot com hash implementado nesta mesma sessão) e guarda como PDF.
2. Administrador assina esse PDF com Assinatura Qualificada via GOV.PT (Cartão de Cidadão ou Chave Móvel Digital).
3. Entrega o PDF assinado ao condómino vendedor, para apresentação ao notário/conservatória.

Isto **não substitui** a recomendação de confirmar com um jurista ou diretamente com o cartório escolhido antes de o apresentar como solução garantida a um cliente — ver "Limitações" no fim.

### Lacuna encontrada no documento atual: falta espaço de assinatura

Independentemente da via de assinatura escolhida (manuscrita, reconhecida ou eletrónica qualificada), **o PDF gerado por `app/(app)/financas/declaracao-divida/[fracaoId]/page.tsx` não tem nenhum bloco de assinatura** — ao contrário da interpelação, da convocatória, da procuração e da carta de comunicação de deliberação, que têm todas uma linha "A Administração do Condomínio" ou equivalente. Isto é uma lacuna real: um documento pensado para ser assinado (manualmente ou digitalmente) devia ter um local claro para isso. Ver recomendação abaixo.

---

## Documentos — avaliação individual

### 1. Declaração de dívida (`financas/declaracao-divida/[fracaoId]`)
- **Base legal**: art. 1424º-A CC — correta e confirmada nesta auditoria (texto integral acima).
- **Formalidades**: conteúdo cobre o essencial (fração, proprietário, NIF, encargo corrente, dívidas discriminadas com natureza/data/valor), mas **falta**: (a) bloco de assinatura do administrador; (b) o art. 1424º-A exige "montante de todos os encargos de condomínio em vigor... com especificação da sua natureza" — a app mostra a quota mensal atual como valor único, sem discriminar separadamente eventuais quotas extraordinárias em vigor ou a fatia do fundo de reserva, que a própria aplicação já calcula distintamente noutros pontos.
- **Adequação à escritura**: ver secção dedicada acima. Desde 2026-08-17, a emissão fica registada com snapshot e hash (`app/actions/cobranca.ts:registarEmissaoDocumentoCobranca`) — bom para prova de que o documento não foi alterado depois de emitido, mas isso não substitui a assinatura do administrador.
- **Risco**: um documento sem assinatura, mesmo com conteúdo correto, dificilmente é aceite como "declaração emitida pelo administrador" — a assinatura é o que liga o documento a uma pessoa responsável.
- **Corrigido em 2026-08-17**: acrescentado um bloco de assinatura com dois campos em branco — "Administração Externa" e "Administração Interna do Condomínio" (pedido do utilizador, refletindo que alguns condomínios têm as duas em simultâneo, outros só uma) — através do novo componente partilhado `components/print/bloco-assinatura-administracao.tsx`, também aplicado à interpelação, convocatória e carta de comunicação de deliberação (substituindo o bloco de assinatura única que cada uma já tinha). Acrescentada também uma nota explicativa na própria página (fora da área de impressão) sobre o reconhecimento notarial e a alternativa da assinatura qualificada via GOV.PT. **Pendente/não corrigido**: continuar a mostrar só a quota corrente agregada, sem discriminar separadamente fundo de reserva e quotas extraordinárias ativas — fica registado como possível melhoria futura, fora do âmbito desta correção pontual.

### 2. Interpelação para pagamento (`financas/interpelacao/[fracaoId]`)
- **Base legal**: arts. 805º/806º CC + art. 6º DL 268/94 (redação Lei 8/2022) — citada no código com nota de verificação de 2026-07-23 (sessão anterior); não re-verificada de raiz nesta auditoria.
- **Formalidades**: tem bloco de assinatura, data, e instrução explícita para envio por carta registada com aviso de receção — adequado ao propósito de fazer prova de interpelação.
- **Escritura**: não é o documento tipicamente pedido para uma escritura (é sobre cobrança, não sobre transmissão), mas pode ser relevante se houver dívida por regularizar.
- **Risco/recomendação**: nenhum.

### 3. Recibo de quota (`financas/recibo/[id]`)
- **Base legal**: art. 23º/4 CIRC — confirmado indiretamente via fichas doutrinárias da Autoridade Tributária (o condomínio, não sendo sujeito passivo de IVA, emite recibo de quitação "contendo todos os elementos do art. 23º, nº4 do CIRC"). Citação correta.
- **Formalidades**: **sem nenhum bloco de assinatura ou identificação nominal de quem emite o recibo** — só o cabeçalho com o nome/NIF do condomínio.
- **Escritura**: não é normalmente exigido para escritura, mas pode ser pedido informalmente para confirmar pagamentos.
- **Risco**: lacuna menor — na prática, recibos gerados por software de gestão são geralmente aceites sem assinatura manuscrita (o cabeçalho identificando o condomínio já cumpre a função básica), mas para reforçar valor probatório (ex. para o condómino usar em sede de IRS, dedução de mais-valias) um espaço de assinatura/carimbo aumentaria a robustez.
- **Recomendação**: opcional — acrescentar linha "Emitido por" com o nome de quem gerou o recibo (já disponível na sessão autenticada).

### 4. Ata de assembleia (`assembleias/ata/[id]`)
- **Base legal**: nenhuma citada diretamente no conteúdo da ata (a numeração sequencial do livro de atas e a imutabilidade após aprovação já implementam boas práticas, mas sem referência legal explícita no próprio documento impresso).
- **Formalidades**: **sem nenhum espaço de assinatura** — nem do presidente da mesa, nem do secretário, nem de quem quer que seja.
- **Risco identificado (relevante)**: a própria aplicação, no texto da interpelação, afirma que "a ata da assembleia de condóminos que fixou as contribuições devidas... constitui título executivo" (art. 6º DL 268/94). Um documento apresentado como título executivo tipicamente precisa de estar devidamente assinado por quem tem competência para tal (presidente da mesa/secretário, conforme o regulamento do condomínio ou a praxe). Uma ata sem nenhum espaço de assinatura fragiliza essa alegação — não encontrei um artigo específico do Código Civil que imponha a forma exata de assinatura de uma ata de condomínio (parece reger-se mais pelo regulamento interno e pela praxe geral de atas de pessoas coletivas/associações do que por uma norma explícita), pelo que este ponto fica como risco identificado por inconsistência interna da própria app, não como violação de uma norma específica confirmada.
- **Corrigido em 2026-08-17**: acrescentado um bloco de assinatura com dois campos em branco — "O Presidente da Mesa da Assembleia" e "O Secretário" — visível apenas quando a ata está aprovada (`components/assembleias/ata-conteudo.tsx`), mais uma nota final a mencionar a via de assinatura digital qualificada via GOV.PT. Os campos ficam em branco porque o schema atual não regista quem presidiu/secretariou como dados estruturados — preenchimento continua a ser manual, à semelhança da procuração.

### 5. Convocatória (`assembleias/[id]/convocatoria`)
- **Base legal**: art. 1432º CC — citada com nota de verificação de 2026-07-23 (sessão anterior).
- **Formalidades**: tem bloco de assinatura ("O Administrador do Condomínio") e aviso em ecrã (nunca impresso) quando a antecedência legal de 10 dias já não é cumprível — boa prática.
- **Risco/recomendação**: nenhum.

### 6. Procuração para assembleia (`assembleias/[id]/procuracao`)
- **Base legal**: arts. 1431º/3 e 262º/1 CC — texto revisto com o utilizador e comparado com minutas publicadas (2026-07-23).
- **Formalidades**: bloco de assinatura completo, campos para documento de identificação do outorgante e do procurador, instruções de voto, tudo em branco para preenchimento manual — adequado ao propósito (documento entre condómino e representante, fora da gestão de dados pessoais da app, por opção deliberada).
- **Risco/recomendação**: nenhum.

### 7. Carta de comunicação de deliberação (`assembleias/[id]/comunicacao-deliberacoes/carta/...`)
- **Base legal**: art. 1432º/8-11 CC — mesma base já verificada para a convocatória.
- **Formalidades**: bloco de assinatura presente, instrução de envio por email ou carta registada.
- **Risco/recomendação**: nenhum.

### 8. Dossier de apoio à assembleia (`assembleias/[id]/dossier`)
- **Base legal**: referência ao art. 1436º/1/j CC (dever de prestação de contas) — confirmado nesta auditoria: essa alínea impõe ao administrador "prestar contas à assembleia".
- **Formalidades**: o próprio rodapé do documento declara explicitamente "Não substitui a ata nem a convocatória, que continuam a ser os documentos legalmente vinculativos" — postura correta, este documento não pretende ter valor formal próprio.
- **Risco/recomendação**: nenhum.

### 9. Balanço orçamental (`financas/balanco/[id]`)
- **Base legal**: nenhuma citada — documento de gestão interna (orçado vs. real).
- **Formalidades**: rodapé com aviso "não substitui documentos contabilísticos oficiais" — adequado.
- **Risco/recomendação**: nenhum.

### 10. Balanço patrimonial (`financas/balanco-patrimonial/[exercicioId]`)
- **Base legal**: nenhuma citada.
- **Formalidades**: mesmo aviso de não substituição de documentos contabilísticos oficiais, mais uma limitação já assumida no próprio rodapé (não inclui adiantamentos como passivo).
- **Risco/recomendação**: nenhum — a limitação já é comunicada com transparência.

### 11. Antiguidade da dívida (`financas/antiguidade-divida`)
- **Base legal**: nenhuma — relatório operacional interno.
- **Formalidades**: sem pretensão de valor formal externo, adequado ao propósito (priorizar cobrança).
- **Risco/recomendação**: nenhum.

### 12. Mapa mensal de quotas (`financas/mapa-mensal`)
- **Base legal**: nenhuma.
- **Formalidades**: mesmo aviso de não substituição de documentos contabilísticos oficiais.
- **Risco/recomendação**: nenhum.

### 13. Relatório de movimentos (`financas/relatorio`)
- **Base legal**: nenhuma.
- **Formalidades**: mesmo aviso de não substituição.
- **Risco/recomendação**: nenhum.

---

## Ações tomadas na app, no mesmo dia (2026-08-17)

Por pedido explícito do utilizador — "preciso que toda esta análise seja clara e conste na APP para esclarecimento de todos" —, as conclusões concretas e verificadas desta auditoria não ficaram só neste documento:

- **Bloco de assinatura** acrescentado à declaração de dívida e à ata de assembleia (ver detalhe nas secções 1 e 4 acima), com dois campos — "Administração Externa" e "Administração Interna do Condomínio" — reutilizado também na interpelação, convocatória e carta de comunicação de deliberação (`components/print/bloco-assinatura-administracao.tsx`).
- **Nota explicativa** na própria página da declaração de dívida (fora da área de impressão) sobre o reconhecimento notarial não ser legalmente exigido, a prática variar por cartório, e a alternativa da assinatura qualificada via GOV.PT — com hiperligação para mais detalhe em `/ajuda`.
- **`/ajuda`** (secção "Frações" → "Registar uma transmissão") expandida com a mesma explicação em linguagem simples, e a secção "Finanças" → "Dívidas por fração" passou a documentar os botões "Declaração"/"Interpelação", que ainda não estavam cobertos.

Isto não esgota as recomendações desta auditoria (ver "Recomendação" em cada documento) — só implementa as que foram pedidas e confirmadas nesta sessão.

## Limitações desta auditoria

- **Isto não é aconselhamento jurídico.** É análise do código-fonte da aplicação cruzada com pesquisa jurídica geral (fontes públicas, doutrina, imprensa especializada). Qualquer decisão de negócio — nomeadamente adicionar um passo de assinatura eletrónica qualificada como funcionalidade, ou comunicar ao utilizador final que a via GOV.PT "resolve" a questão do reconhecimento — deve ser confirmada por um jurista ou notário antes de avançar.
- **O texto do art. 3º do Decreto-Lei n.º 12/2021** foi confirmado (2026-08-17, a pedido do utilizador, que forneceu o link oficial em dre.pt) — o acesso direto a diariodarepublica.pt e pgdlisboa.pt continuou indisponível para as ferramentas desta sessão, mas o texto literal dos n.os 2 e 5 do art. 3º foi obtido através da página oficial da ANACOM (autoridade administrativa independente), que o reproduz integralmente. Considera-se confirmado, com esta ressalva de proveniência.
- Os artigos 805º/806º CC, 1432º CC e 1431º/3 CC **não foram re-verificados de raiz nesta sessão** — foram tratados como já verificados, com base nos comentários datados (2026-07-23) deixados no próprio código em sessões anteriores. Se algum destes artigos tiver sido alterado por legislação posterior a essa data, esta auditoria não o deteta.
- A prática notarial/registral concreta (se um cartório específico aceita ou não um determinado documento, assinado de uma determinada forma) **não pode ser confirmada à distância** — varia por notário/conservatória e evolui com o tempo. Qualquer recomendação final ao utilizador sobre "isto chega para a escritura" deveria incluir a sugestão de confirmar previamente com o cartório/notário escolhido.
- Não foi avaliada a validade de documentos fora do âmbito pedido (ex. RGPD, termos de utilização, política de privacidade — já cobertos por `GDPR_CHECKLIST.md`/`RAT.md`).
