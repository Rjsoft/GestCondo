# Matriz de Assembleias, Quóruns e Maiorias — GestCondo

Data: 2026-07-22. Produzida na Fase D da auditoria (`PROMPT_AUDITORIA_JURIDICA_RGPD.md` secção 7.5). Fontes: Código Civil (arts. 1419º, 1424º, 1425º, 1432º), consolidado em [dre.pt](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2022-177392492), consultado em 2026-07-22.

**Atualidade verificada 2026-07-22 (sessão seguinte)**: confirmado que a Lei n.º 8/2022 continua a ser a reforma portuguesa mais recente aplicável a esta matriz — ver nota de verificação em `docs/audit/LEGAL_COMPLIANCE_AUDIT.md` secção 7.5 (inclui aviso sobre uma "Lei n.º 57/X/2025" que é de Cabo Verde, não de Portugal, para não confundir em pesquisas futuras).

**Princípio geral desta matriz, conforme instruído no prompt**: não existe uma única "maioria" — a exigida depende da matéria. O GestCondo (`app/actions/assembleias.ts`) **não codifica nenhuma regra automática de maioria** — mostra o quórum e a votação por permilagem calculados, mas é sempre o administrador que regista o `resultado` (aprovado/reprovado/adiado) de cada ponto. Isto está correto e é a decisão certa — o risco não está na app, está em o administrador aplicar a matéria errada a uma votação.

## 1. Convocatória e funcionamento (art. 1432º CC)

| Matéria | Regra | Base legal | Risco se aplicada mal |
|---|---|---|---|
| Prazo de convocatória | Carta registada ou aviso com recibo de receção assinado, 10 dias de antecedência (ou email, se o condómino tiver manifestado essa vontade em assembleia anterior e o endereço constar da ata) | Art. 1432º/1-3 | Convocatória irregular pode anular as deliberações tomadas |
| Conteúdo obrigatório da convocatória | Dia, hora, local, ordem de trabalhos; **deve informar quais os assuntos que só podem ser aprovados por unanimidade** | Art. 1432º/4 | Omitir esta informação é um vício de forma |
| 1ª convocatória — deliberação regra geral | Maioria dos votos representativos do capital investido (permilagem) | Art. 1432º/5 | — |
| Falta de "vencimento" na 1ª reunião | Se a convocatória não fixar outra data: nova reunião automática uma semana depois, mesma hora/local. Se a convocatória fixar desde logo uma 2ª data: pode ser o **mesmo dia**, com intervalo mínimo de **30 minutos**, no mesmo local, desde que garantida a presença de condóminos representando ≥1/4 do valor total do prédio | Art. 1432º/6-7, na redação da Lei n.º 8/2022 (em vigor desde 10/04/2022) | Sem esse mínimo de 30 minutos (ou sem o 1/4 de presença garantida), a deliberação em 2ª convocatória é anulável |
| 2ª convocatória — deliberação | Maioria dos votos dos presentes, desde que representem, pelo menos, **1/4 do valor total do prédio** | Art. 1432º/7 | Sem esse mínimo de 1/4, a deliberação é inválida mesmo em 2ª convocatória |
| Deliberações por unanimidade — regra especial | Podem ser aprovadas por **unanimidade dos condóminos presentes, desde que representem ≥2/3 do capital investido** (não "2/3 dos presentes" — corrigido 2026-07-23 após verificação do texto legal); comunicação aos ausentes em 30 dias, que têm 90 dias para responder por escrito; **o silêncio vale como aprovação** | Art. 1432º/8-11 | A redação anterior desta linha ("2/3 dos presentes") era imprecisa e foi replicada na primeira versão da minuta da convocatória |

**Nota sobre o GestCondo**: `assembleia.dataPrimeiraConvocatoria`/`dataSegundaConvocatoria` já modelam as duas datas. `criarAssembleia` (`app/actions/assembleias.ts`) valida um intervalo mínimo de 30 minutos entre as duas — permite o mesmo dia, conforme o art. 1432º/7 (Lei n.º 8/2022). Corrigido 2026-07-22 (ver `LEGAL_COMPLIANCE_AUDIT.md`, achado LEGAL-03); a versão anterior desta validação exigia incorretamente dias distintos, com base em jurisprudência anterior à reforma de 2022.

## 2. Modificação do título constitutivo e regulamento (art. 1419º CC)

| Matéria | Regra | Base legal |
|---|---|---|
| Alteração do título constitutivo | **Unanimidade**, por escritura pública ou documento particular autenticado | Art. 1419º/1 |
| Alteração do regulamento, se estiver dentro do título constitutivo | Unanimidade (mesma regra do título) — matéria com interpretação divergente na doutrina, ver nota abaixo | Art. 1419º/1-2 |
| Alteração do regulamento aprovado à parte (não integrado no título) | Maioria em assembleia (delibera-se como qualquer outra deliberação, art. 1432º/5) | Art. 1432º/2 |

**Nota de incerteza a assinalar ao administrador**: existe divergência doutrinal/jurisprudencial sobre se um regulamento *dentro* do título constitutivo só pode ser alterado por unanimidade ou se, na prática, uma alteração aprovada por maioria simples é também válida. O GestCondo não deve assumir uma posição — deve exigir sempre que o administrador confirme com um jurista antes de tratar uma alteração de regulamento como definitiva se o regulamento estiver integrado no título constitutivo.

## 3. Obras e inovações (art. 1425º CC)

| Tipo de obra | Maioria exigida | Base legal |
|---|---|---|
| Inovação comum (regra geral) | Maioria dos condóminos, representando **2/3 do valor total do prédio** (dupla maioria: nº de pessoas + valor) | Art. 1425º/1 |
| Elevadores ou gás canalizado, em prédios com **8 ou mais frações autónomas** | Maioria dos condóminos representando a **maioria** (não 2/3) do valor total | Art. 1425º/2 |
| Obras de acessibilidade para pessoa com mobilidade condicionada no agregado de um condómino (rampas, plataformas elevatórias) | **Não depende de aprovação da assembleia** — qualquer condómino pode realizá-las, mediante comunicação prévia ao administrador com 15 dias de antecedência | Art. 1425º/3-6 |
| Obras extraordinárias de conservação ou inovação — obrigação de transparência do administrador | Apresentar **três orçamentos diferentes** de fornecedores | Lei n.º 8/2022 (altera art. 1436º) |
| Limite geral às inovações | Não são permitidas inovações que prejudiquem a utilização, por qualquer condómino, das suas frações ou das partes comuns | Art. 1425º/7 |

**Relevante para o GestCondo**: `FUNCTIONAL_GAPS.md` já identifica que não há distinção entre "obras urgentes" (art. 1427º, decisão do administrador sem esperar assembleia) e "obras aprovadas em assembleia" — esta matriz confirma que a distinção tem, de facto, base legal concreta e consequências de maioria diferentes, reforçando a prioridade desse gap.

## 4. Quóruns e maiorias — resumo por tipo de deliberação

| Deliberação | Maioria | Fonte |
|---|---|---|
| Assuntos correntes (orçamento, eleição de administrador, contas) | Maioria simples do capital investido, em 1ª convocatória; maioria dos presentes com ≥1/4 do valor total, em 2ª | Art. 1432º/5,7 |
| Inovações comuns | Maioria de pessoas + 2/3 do valor total | Art. 1425º/1 |
| Elevadores/gás (≥8 frações) | Maioria de pessoas + maioria do valor total | Art. 1425º/2 |
| Alteração do título constitutivo | Unanimidade | Art. 1419º/1 |
| Deliberações que a convocatória identifique como exigindo unanimidade | Unanimidade, ou 2/3 dos presentes + confirmação dos ausentes em 90 dias | Art. 1432º/4,8-11 |

## 5. Como isto se reflete na aplicação

O GestCondo mostra corretamente os números (permilagem presente, permilagem por opção de voto) e deixa ao administrador a responsabilidade de qualificar o resultado à luz da matéria em discussão — **decisão de desenho correta**, não uma lacuna a corrigir. A lacuna real é de **suporte à decisão**: a aplicação não ajuda o administrador a saber qual maioria se aplica a cada ponto da ordem de trabalhos. Recomendação (P2, não urgente): considerar um campo opcional "tipo de maioria aplicável" por ponto da ordem de trabalhos, preenchido pelo administrador como referência, sem impor uma regra automática.
