# Personas — simulação de usabilidade e acessibilidade

**Estado:** simulação técnica, não teste real. **Data:** 2026-07-31.

## O que é isto e o que não é

Este documento e os que dele derivam (`USABILITY_SIMULATION.md`, `ACCESSIBILITY_REVIEW.md`,
`ROLE_BASED_USAGE_REVIEW.md`, `USABILITY_FINDINGS.md`, `USABILITY_IMPROVEMENT_PLAN.md`) são:

- uma simulação técnica baseada em personas;
- uma avaliação heurística de usabilidade;
- uma revisão de acessibilidade feita por análise de código e navegação simulada;
- uma análise de percursos, tarefas e riscos de erro humano.

**Não são, e não devem ser lidos como:**

- testes reais com utilizadores;
- equivalentes a testes com pessoas cegas, surdas, idosas ou com outras necessidades
  específicas — nenhuma pessoa real com essas condições participou;
- prova de que a aplicação está "acessível" ou "conforme WCAG" — apenas análise técnica;
- uma lista definitiva e completa de todos os problemas existentes.

Todas as conclusões devem ser confirmadas por testes reais antes de se considerarem
resolvidas. O teste real já planeado com um utilizador cego (`docs/GUIA_TESTE_NVDA.md`,
memória `teste-nvda-amigo-invisual`) continua pendente e é uma das validações mais
importantes para confirmar ou corrigir o que está aqui.

As personas foram desenhadas para **evitar estereótipos**: idade não implica
automaticamente dificuldade digital (há idosos muito experientes e jovens com baixa
literacia), e o género não foi usado para inventar diferenças de comportamento — é
apenas um dado demográfico equilibrado (15 mulheres, 15 homens). Nenhum nome corresponde
a pessoa real, condómino real ou conta existente na aplicação.

## Base real usada para as personas

As personas foram desenhadas a partir do modelo de dados e permissões que existe hoje na
aplicação (não inventado):

- **Papéis reais** (`lib/perfis.ts`): `admin`, `gestor`, `condomino`, `inquilino`,
  `fornecedor`, `auditor` — mais dois papéis transversais e ortogonais: `isSuperAdmin` e
  `isOperadorPlataforma` (`/plataforma`).
- Um `membro` pertence a **um** condomínio e, no máximo, a **uma** fração
  (`membro.fracaoId`). Uma pessoa com várias frações no mesmo condomínio precisa de
  várias linhas `membro` (mesmo `userId`) — o modelo suporta isto, mas nunca foi testado
  a sério; é um ponto de atenção retomado em `USABILITY_SIMULATION.md`.
- Não existe no esquema distinção formal "residente vs. não residente" — é inferida pelo
  contexto da persona, não pela aplicação.
- `condominio.estadoSubscricao` pode estar `suspenso`, o que bloqueia o acesso a quase
  todos os perfis exceto o operador da plataforma.
- Rotas inventariadas (`app/(app)/**/page.tsx` + públicas): Painel, Notificações,
  Pesquisa, Finanças (+ 8 subpáginas: mapa mensal, relatório, balanço, balanço
  patrimonial, recibo, declaração de dívida, interpelação, antiguidade de dívida,
  lembretes de cobrança), Avisos, Assembleias (+ detalhe, convocatória, procuração,
  dossier, ata, comunicação de deliberações + carta), Ocorrências, Documentos, Mensagens,
  Fornecedores, Frações, Condóminos, Auditoria, Os meus dados, Ajuda, Condomínio,
  Plataforma; públicas: Instruções, Sign-in, Sign-up, Esqueci a password, Redefinir
  password, Onboarding, Privacidade, Termos.

## Matriz de personas

Cada persona lista: idade · função · dispositivo · experiência digital · necessidade
relevante · contexto · objetivo principal · preocupações · tarefas típicas · critérios
de sucesso · riscos de erro.

---

### 1. Beatriz Andrade — condómina residente, digitalmente avançada
34 anos · condómina proprietária residente · portátil + smartphone · experiência digital
avançada · sem necessidade de acessibilidade específica · usa a app em casa, à noite,
ocasionalmente sob pressão de tempo (antes de sair de casa).
**Objetivo:** pagar a quota em dia e saber se há assembleias marcadas.
**Preocupações:** perder tempo a encontrar informação simples.
**Tarefas:** consultar saldo/dívida, confirmar leitura de avisos, ver ata de assembleia.
**Sucesso:** confirma o que precisa em menos de 2 minutos.
**Riscos de erro:** baixos — mas pode ignorar avisos por excesso de confiança.

### 2. Manuel Ferreira — condómino idoso, experiente (ex-engenheiro)
78 anos · condómino proprietário residente · portátil · experiência digital intermédia
(usou software profissional a vida toda) · baixa visão ligeira relacionada com a idade,
por vezes aumenta o zoom do browser · usa a app sentado, com boa luz, sem pressa.
**Objetivo:** confirmar que a sua quota está paga e entender o orçamento anual.
**Preocupações:** letra pequena, termos técnicos financeiros pouco claros.
**Tarefas:** ver extrato de conta, ler relatório financeiro, confirmar leitura de aviso.
**Sucesso:** lê o relatório financeiro sem precisar de ajuda.
**Riscos de erro:** confundir valores por texto pequeno em tabelas densas.

### 3. Rosa Pinto — condómina idosa, pouca experiência digital
81 anos · condómina proprietária residente · smartphone (herdado de um neto) ·
experiência digital muito reduzida · alguma dificuldade de memória de trabalho (esquece
o caminho já percorrido) · usa a app raramente, com receio de "estragar algo".
**Objetivo:** saber se deve dinheiro ao condomínio.
**Preocupações:** carregar num botão errado e causar um problema irreversível.
**Tarefas:** iniciar sessão, encontrar o saldo da sua fração.
**Sucesso:** consegue ver o saldo sem telefonar a ninguém a pedir ajuda.
**Riscos de erro:** abandonar a tarefa a meio por não reconhecer onde está; medo
impede-a de explorar menus.

### 4. João Ribeiro — condómino proprietário não residente
45 anos · proprietário de fração arrendada, mora noutra cidade · portátil no
escritório + telemóvel em deslocação · experiência digital intermédia · sem necessidade
de acessibilidade específica · usa a app em viagem, por vezes com ligação instável (3G).
**Objetivo:** acompanhar despesas e assembleias sem estar presente fisicamente.
**Preocupações:** perder uma votação importante por não ter recebido a convocatória a
tempo; procuração para quem o representa.
**Tarefas:** consultar assembleias, emitir procuração, ver ocorrências na sua fração.
**Sucesso:** vota por procuração sem se deslocar.
**Riscos de erro:** submissão falhada por ligação instável sem aviso claro de que não
foi guardada.

### 5. Sandra Melo — senhoria com várias frações no mesmo condomínio
39 anos · condómina proprietária de 3 frações (investimento imobiliário) · portátil ·
experiência digital avançada (gere outros imóveis fora da app) · sem necessidade de
acessibilidade específica · consulta a app semanalmente, entre outras tarefas.
**Objetivo:** ver a situação financeira consolidada das suas 3 frações.
**Preocupações:** ter de repetir o login ou confundir qual fração está a ver.
**Tarefas:** consultar saldo de cada fração, confirmar quem são os inquilinos associados.
**Sucesso:** distingue claramente os dados de cada fração sua.
**Riscos de erro:** se a conta precisar de 3 logins/membros separados, arrisca ver dados
da fração errada como se fosse a certa.

### 6. Tiago Cunha — inquilino jovem, daltónico
27 anos · inquilino (arrendatário) com acesso limitado · smartphone apenas · experiência
digital muito avançada (trabalha em tecnologia) · daltonismo (deuteranopia — dificuldade
a distinguir vermelho/verde) · usa a app em qualquer lugar, rapidamente, entre tarefas.
**Objetivo:** confirmar leitura de avisos e saber a quem reportar uma avaria.
**Preocupações:** nenhuma de maior — só quer rapidez.
**Tarefas:** ler avisos, reportar ocorrência.
**Sucesso:** conclui em menos de 1 minuto.
**Riscos de erro:** se estados (ex. "pago"/"em dívida", "aprovado"/"reprovado") forem
distinguidos só por cor (verde/vermelho), pode misturar significados.

### 7. Rui Antunes — condómino cego, usa NVDA e teclado
52 anos · condómino proprietário residente, também membro da administração interna ·
computador de secretária com Windows · experiência digital avançada com tecnologia de
apoio (usa NVDA há anos, teclado exclusivamente, nunca rato) · usa a app com regularidade
para gerir o condomínio.
**Objetivo:** conseguir fazer tudo o que um administrador vidente faz — lançar despesas,
preparar uma assembleia, aprovar pedidos — só com teclado e leitor de ecrã.
**Preocupações:** botões sem descrição, foco perdido depois de fechar um diálogo, ordem
de leitura que não corresponde à ordem visual.
**Tarefas:** lançar uma despesa, criar uma assembleia, aprovar um condómino pendente,
usar tabelas financeiras.
**Sucesso:** completa qualquer tarefa administrativa sem pedir ajuda a um vidente.
**Riscos de erro:** perder o sítio onde estava depois de uma ação assíncrona (ex.
confirmação de eliminação); tabelas complexas lidas fora de contexto.

### 8. Carla Nogueira — auditora externa cega, usa VoiceOver em iPhone
29 anos · revisora de contas externa (perfil `auditor`) · iPhone (VoiceOver) — não tem
sempre acesso a um computador quando confirma algo rapidamente · experiência digital
avançada com tecnologia de apoio móvel · consulta a app a partir de vários condomínios
clientes, muitas vezes em deslocação.
**Objetivo:** confirmar rapidamente um valor ou aceder a um documento justificativo.
**Preocupações:** gestos de exploração do VoiceOver não corresponderem à ordem lógica da
página em ecrã pequeno; tabelas financeiras longas em mobile.
**Tarefas:** consultar auditoria, exportar/consultar movimentos, localizar documento.
**Sucesso:** encontra o valor ou documento certo sem ambiguidade.
**Riscos de erro:** confundir dois valores semelhantes lidos em sequência rápida por voz.

### 9. Fernando Sousa — condómino com baixa visão, zoom 200-400%
67 anos · condómino proprietário reformado · computador de secretária, ecrã grande ·
experiência digital intermédia · baixa visão (degenerescência macular), usa zoom do
browser a 200-400% e prefere contraste elevado · sem pressa, usa a app com calma.
**Objetivo:** ler avisos e assembleias sem perder informação por corte de ecrã.
**Preocupações:** texto ou botões que desaparecem/sobrepõem-se com zoom elevado; menus
que exigem scroll horizontal.
**Tarefas:** ler avisos, consultar atas, usar formulários.
**Sucesso:** lê tudo com zoom elevado sem perder conteúdo cortado ou sobreposto.
**Riscos de erro:** clicar no botão errado por elementos sobrepostos a zoom alto.

### 10. Marta Esteves — administradora profissional, surda
44 anos · colaboradora de empresa gestora, perfil `gestor` · portátil no escritório ·
experiência digital avançada · surda, comunica por LGP e leitura labial/escrita ·
trabalha com vários condomínios em simultâneo, ambiente de escritório.
**Objetivo:** gerir avisos, assembleias e ocorrências sem depender de som.
**Preocupações:** notificações ou confirmações que dependam de som (ex. um "beep" sem
equivalente visual); suporte da aplicação que só disponha de telefone.
**Tarefas:** publicar avisos, gerir ocorrências, contactar fornecedores por escrito.
**Sucesso:** conclui todas as tarefas sem nunca precisar de som ou chamada telefónica.
**Riscos de erro:** perder uma notificação importante se existir algum aviso sonoro sem
equivalente visual ou textual.

### 11. Diogo Pereira — fornecedor eletricista, perda auditiva parcial
36 anos · fornecedor habitual (eletricista independente), perfil `fornecedor` ·
smartphone antigo, em obra · experiência digital ocasional · perda auditiva parcial (usa
aparelho auditivo, evita chamadas em ambientes ruidosos) · ecrã pequeno, mãos sujas,
ligação instável em obra.
**Objetivo:** perceber rapidamente o que lhe foi pedido e responder com um orçamento.
**Preocupações:** app pouco usável em ecrã pequeno; preferir tudo por escrito (nunca
telefone).
**Tarefas:** ver pedido de orçamento, submeter proposta, anexar fatura.
**Sucesso:** trata tudo por escrito, sem precisar de telefonar a ninguém.
**Riscos de erro:** falhar um passo em formulário longo em ecrã pequeno sem perceber.

### 12. Isabel Rocha — condómina com mobilidade reduzida nas mãos, controlo por voz
61 anos · condómina proprietária residente · portátil, frequentemente usa controlo por
voz do sistema operativo e/ou rato adaptado por ter artrite nas mãos · experiência
digital intermédia · usa a app muitas vezes só com uma mão.
**Objetivo:** pagar quotas e ler avisos sem esforço físico repetitivo.
**Preocupações:** áreas clicáveis pequenas, necessidade de precisão fina (drag/arrastar),
menus que exigem muitos cliques seguidos.
**Tarefas:** confirmar leitura de aviso, consultar dívida, usar formulários simples.
**Sucesso:** conclui tarefas com poucos cliques/comandos de voz, sem precisão fina.
**Riscos de erro:** falhar um alvo pequeno (ex. "x" de fechar, checkbox pequena) e
acionar a ação errada.

### 13. André Lima — colaborador operacional de empresa gestora, tremor, só teclado
31 anos · colaborador operacional (regista documentos/despesas/ocorrências), perfil
`gestor` com permissões limitadas · portátil da empresa · experiência digital
intermédia · tremor essencial nas mãos, evita rato e cliques precisos, navega
exclusivamente por teclado · trabalha sob pressão de tempo (muitos condomínios por dia).
**Objetivo:** registar rapidamente despesas e documentos em vários condomínios.
**Preocupações:** ter de usar o rato para algo que devia ser possível por teclado;
alternar de condomínio ativo por engano.
**Tarefas:** lançar despesas, carregar documentos, mudar de condomínio ativo.
**Sucesso:** completa tudo só com teclado (Tab, Enter, setas), sem rato.
**Riscos de erro:** registar um lançamento no condomínio errado por não confirmar
claramente qual está ativo.

### 14. Patrícia Gomes — condómina jovem, dislexia
25 anos · condómina proprietária (primeira casa) · smartphone · experiência digital
avançada com apps do dia a dia, mas cansa-se com texto longo · dislexia · usa a app em
espaços públicos, com distrações, tempo limitado.
**Objetivo:** perceber rapidamente o que lhe é pedido sem ler parágrafos longos.
**Preocupações:** textos densos, termos jurídicos sem explicação, formulários longos.
**Tarefas:** ler avisos, perceber uma convocatória de assembleia, pagar quota.
**Sucesso:** entende o essencial sem precisar de reler várias vezes.
**Riscos de erro:** perder informação importante escondida a meio de um parágrafo longo.

### 15. Vítor Almeida — condómino com várias frações, dificuldade de concentração
48 anos · condómino com 2 frações (perfil `condomino`) · portátil · experiência digital
intermédia · dificuldade de concentração e memória de trabalho (interrupções frequentes,
perde o fio à tarefa) · usa a app entre outras tarefas de trabalho, com interrupções.
**Objetivo:** tratar de um assunto financeiro específico sem se perder no caminho.
**Preocupações:** processos com muitos passos onde é fácil perder o contexto se for
interrompido.
**Tarefas:** consultar e contestar uma despesa, acompanhar uma ocorrência já aberta.
**Sucesso:** consegue retomar exatamente onde ficou depois de uma interrupção.
**Riscos de erro:** reiniciar uma tarefa do zero sem perceber que já a tinha começado
(ex. reportar a mesma ocorrência duas vezes).

### 16. Yulia Kovalenko — inquilina, não domina bem o português
33 anos · inquilina (arrendatária), perfil `inquilino` · smartphone · experiência
digital avançada, mas português é língua estrangeira (fala inglês e ucraniano) · sem
necessidade de acessibilidade motora/sensorial · usa a app pontualmente.
**Objetivo:** perceber avisos e saber a quem reportar um problema na fração.
**Preocupações:** vocabulário jurídico/técnico em português (ex. "permilagem",
"deliberação") sem tradução ou explicação simples.
**Tarefas:** ler avisos, reportar ocorrência.
**Sucesso:** entende o suficiente para agir sem tradutor externo.
**Riscos de erro:** mal-entendido por termo técnico não explicado, levando a reportar a
coisa errada ou não reportar de todo.

### 17. Beatriz Sales — condómina idosa muito experiente digitalmente
70 anos · condómina proprietária residente, ex-profissional de informática reformada ·
portátil + tablet · experiência digital avançada (contraria o estereótipo de que idade
implica dificuldade digital) · sem necessidade de acessibilidade específica · usa a app
com fluência e por vezes encontra atalhos que a documentação não explica.
**Objetivo:** gerir os seus assuntos com eficiência, sem ser tratada como incapaz.
**Preocupações:** interface "simplificada demais" que esconda informação ou funções.
**Tarefas:** consultar relatórios financeiros detalhados, usar pesquisa avançada.
**Sucesso:** encontra tudo sem precisar de ajuda nem de explicações básicas.
**Riscos de erro:** frustração se a app assumir baixa literacia digital sem opção de
avançar diretamente ao essencial.

### 18. Hugo Martins — inquilino jovem, baixa literacia
22 anos · inquilino (arrendatário), perfil `inquilino` · smartphone (único dispositivo) ·
experiência digital de "apenas apps móveis" (redes sociais, pouco mais) · baixa
literacia (terminou a escolaridade obrigatória) · usa a app raramente, só quando
obrigado.
**Objetivo:** perceber o que lhe pedem sem se sentir "burro".
**Preocupações:** termos técnicos, textos longos, medo de errar.
**Tarefas:** ler um aviso, confirmar leitura.
**Sucesso:** consegue concluir sem pedir ajuda a ninguém.
**Riscos de erro:** desiste da tarefa por não perceber o vocabulário, mesmo que a ação
em si fosse simples.

### 19. Sofia Cardoso — gestora principal de empresa com muitos condomínios
41 anos · responsável por 18 condomínios geridos pela empresa, perfil `gestor` ·
computador de secretária com vários monitores · experiência digital avançada · sem
necessidade de acessibilidade específica · trabalha sob pressão de tempo constante,
muitas interrupções (chamadas, reuniões).
**Objetivo:** alternar rapidamente entre condomínios e não perder tempo em tarefas
repetitivas.
**Preocupações:** confundir em que condomínio está a trabalhar; falta de ações em massa;
falta de visão consolidada entre condomínios.
**Tarefas:** trocar de condomínio ativo, consultar tarefas pendentes em vários
condomínios, supervisionar colaboradores.
**Sucesso:** sabe sempre, sem dúvida, em que condomínio está e não comete erros entre
condomínios.
**Riscos de erro:** lançar uma despesa ou publicar um aviso no condomínio errado por
troca recente e pouco visível do condomínio ativo.

### 20. Ricardo Nunes — colaborador operacional de empresa gestora, tarefas repetitivas
26 anos · só regista documentos, despesas e ocorrências (perfil `gestor` com permissões
limitadas na prática, mesmo que o esquema não distinga isso hoje) · portátil da
empresa · experiência digital intermédia · sem necessidade de acessibilidade
específica · tarefas repetitivas ao longo do dia, muitos condomínios.
**Objetivo:** ser rápido e não errar de condomínio.
**Preocupações:** repetir os mesmos passos manualmente para cada condomínio sem atalhos.
**Tarefas:** carregar documentos, lançar despesas em lote.
**Sucesso:** consegue processar um lote de tarefas semelhantes sem repetir passos
desnecessários.
**Riscos de erro:** o esquema real não distingue "colaborador operacional" de
"gestor/admin completo" — este utilizador tem, na prática, poder para fazer mais do que
devia (ver `ROLE_BASED_USAGE_REVIEW.md`).

### 21. Ana Beatriz Teixeira — supervisora de empresa gestora
35 anos · revê o trabalho dos colaboradores, perfil `gestor` · portátil · experiência
digital avançada · sem necessidade de acessibilidade específica · consulta a app
regularmente para controlo de qualidade.
**Objetivo:** confirmar que os colaboradores fizeram o trabalho corretamente.
**Preocupações:** não existir forma de ver quem fez o quê e quando de forma clara e
filtrável por colaborador.
**Tarefas:** consultar auditoria, filtrar por período e por autor.
**Sucesso:** identifica rapidamente uma ação de um colaborador específico.
**Riscos de erro:** auditoria pouco filtrável obriga a percorrer tudo manualmente.

### 22. Carlos Vaz — administrador substituto temporário
55 anos · substitui outro administrador durante férias, perfil `admin` recém-aprovado ·
portátil · experiência digital intermédia · sem necessidade de acessibilidade
específica · usa a app pela primeira vez, ansioso por não conhecer o histórico.
**Objetivo:** não deixar nada por fazer durante a ausência do administrador habitual.
**Preocupações:** não perceber o estado atual do condomínio (dívidas, ocorrências
abertas, assembleias marcadas) rapidamente.
**Tarefas:** ver o painel inicial, perceber tarefas pendentes.
**Sucesso:** em poucos minutos sabe o que precisa de atenção.
**Riscos de erro:** ignorar algo urgente por não saber onde procurar (painel pouco
informativo para um utilizador novo no condomínio).

### 23. Manuel Costa — fornecedor canalizador, pouca experiência digital
63 anos · fornecedor independente (canalizador), perfil `fornecedor` · smartphone
antigo (único dispositivo) · experiência digital reduzida · sem necessidade de
acessibilidade formal, mas trabalha com luz fraca e mãos sujas · usa a app raramente,
só quando é contactado.
**Objetivo:** perceber o pedido e responder o mais simples possível.
**Preocupações:** não perceber onde responder; medo de "estragar" o pedido do cliente.
**Tarefas:** ver pedido, aceitar/recusar, anexar foto de comprovativo.
**Sucesso:** responde ao pedido sem telefonar a pedir ajuda.
**Riscos de erro:** desiste e liga por telefone em vez de usar a app, perdendo o
registo formal do pedido.

### 24. Cristina Alves — responsável administrativa de empresa de limpeza
46 anos · fornecedora habitual (empresa de limpeza), perfil `fornecedor` · portátil no
escritório · experiência digital intermédia · sem necessidade de acessibilidade
específica · trata da faturação e comunicação com vários condomínios clientes.
**Objetivo:** manter o estado dos trabalhos e faturas em dia com cada condomínio.
**Preocupações:** não perceber se um documento/fatura foi mesmo recebido pelo lado do
condomínio.
**Tarefas:** anexar fatura, acompanhar estado de um trabalho.
**Sucesso:** tem confirmação clara de que o condomínio recebeu o que enviou.
**Riscos de erro:** reenviar a mesma fatura por falta de confirmação visível.

### 25. Miguel Fonseca — auditor interno / conselho fiscal
50 anos · condómino eleito para o conselho fiscal, perfil `auditor` · portátil ·
experiência digital intermédia · sem necessidade de acessibilidade específica · consulta
a app pontualmente, antes de assembleias.
**Objetivo:** confirmar que as contas apresentadas em assembleia batem certo.
**Preocupações:** não conseguir cruzar movimentos com documentos justificativos
facilmente; não ter a certeza se está a ver a versão final ou um rascunho.
**Tarefas:** consultar relatório financeiro, cruzar movimentos com documentos, exportar.
**Sucesso:** confirma os valores sem pedir ficheiros à parte por email.
**Riscos de erro:** validar um valor errado por não perceber que uma ata ainda é
rascunho ("Rascunho — ata ainda não aprovada").

### 26. Teresa Vieira — contabilista certificada externa
39 anos · presta serviços de contabilidade a vários condomínios, acesso equivalente a
`auditor` ou `gestor` conforme o condomínio · portátil · experiência digital avançada,
habituada a software de contabilidade tradicional (referência comparativa forte) · usa a
app de forma intensiva perto de fecho de exercício.
**Objetivo:** extrair dados fiáveis para as suas obrigações contabilísticas/fiscais.
**Preocupações:** exportação incompleta ou inconsistente; diferenças entre o que a app
mostra e o que precisa de reportar.
**Tarefas:** gerar/consultar balanço, balanço patrimonial, exportar movimentos.
**Sucesso:** consegue fechar as contas sem reconciliação manual fora da app.
**Riscos de erro:** confiar num total que não bate certo por um exercício ainda aberto
ou lançamento pendente que não é óbvio no ecrã.

### 27. Bruno Cabral — técnico de proteção de dados (DPO)
42 anos · encarregado de proteção de dados de uma empresa gestora, sem `membro` num
condomínio específico (perfil de confiança, fora do modelo atual — ver
`ROLE_BASED_USAGE_REVIEW.md`) · portátil · experiência digital avançada · consulta
esporadicamente para validar conformidade RGPD.
**Objetivo:** confirmar que dados pessoais só são vistos por quem deve.
**Preocupações:** não existir forma de auditar, por fora do condomínio, quem acede a
que dados.
**Tarefas:** validar RAT, confirmar âmbito de acesso por perfil.
**Sucesso:** confia no isolamento multi-tenant e nas permissões documentadas.
**Riscos de erro:** não é um utilizador operacional da app — risco é de processo, não de
interface.

### 28. Filipa Ramos — advogada com acesso convidado limitado
47 anos · representa um condómino num litígio, precisa de consultar um documento
específico (ata, extrato) · computador de secretária no escritório · experiência digital
intermédia · usa a app uma única vez ou raramente, sem contexto prévio.
**Objetivo:** obter o documento certo, com valor probatório, sem confusão.
**Preocupações:** não perceber se o documento que vê é a versão oficial/aprovada.
**Tarefas:** aceder a um documento partilhado, confirmar autenticidade/data.
**Sucesso:** obtém o documento certo sem trocas de email adicionais.
**Riscos de erro:** hoje a aplicação não tem um mecanismo formal de "acesso convidado
temporário a um documento" — ver gap em `ROLE_BASED_USAGE_REVIEW.md`.

### 29. Duarte Pinho — candidato a comprar uma fração
34 anos · ainda não é condómino, quer ver documentação básica antes de comprar (atas,
situação de dívida da fração) · tablet · experiência digital avançada · não tem conta na
aplicação.
**Objetivo:** confirmar que a fração não tem dívidas pendentes antes de assinar.
**Preocupações:** ter de pedir tudo por fora da app, sem garantia de estar atualizado.
**Tarefas:** nenhuma dentro da app hoje — depende inteiramente do vendedor/administração
lhe entregar documentos por fora.
**Sucesso:** N/A — este percurso não existe hoje na aplicação.
**Riscos de erro:** não há erro de interface a avaliar; é uma funcionalidade em falta,
não um problema de usabilidade.

### 30. Elsa Marques — condómina com sensibilidade a movimento/animações
55 anos · condómina proprietária residente · computador de secretária · experiência
digital intermédia · sensibilidade vestibular a animações e transições (enjoos/tonturas
com movimento na tela, `prefers-reduced-motion` ativado no sistema) · usa a app com
regularidade moderada.
**Objetivo:** usar a app sem desconforto físico.
**Preocupações:** transições, scroll automático ou animações não respeitarem a
preferência do sistema operativo.
**Tarefas:** navegar entre secções, abrir diálogos.
**Sucesso:** não sente desconforto ao longo da sessão.
**Riscos de erro:** abandono da tarefa por desconforto físico, não por incapacidade de
perceber a interface.

---

## Cobertura da matriz (verificação contra o pedido)

- **Experiência digital:** muito reduzida (3, 18, 23), ocasional (11), intermédia (2, 4,
  5, 9, 13, 15, 20, 22, 24, 25, 28), avançada (1, 6, 7, 8, 10, 12, 14, 16, 17, 19, 21, 26,
  27, 29), habituado só a mobile (6, 18), habituado a software tradicional (26).
- **Idade:** jovem adulto (6, 14, 18, 29), adulto (1, 4, 5, 11, 13, 15, 16, 19-21, 24-28),
  meia-idade (2, 9, 10, 12, 17, 22, 23, 30), idoso/muito idoso (3, 7).
- **Acessibilidade:** cegos NVDA (7) e VoiceOver (8), baixa visão/zoom (2, 9), daltonismo
  (6), surdez (10), perda auditiva parcial (11), mobilidade reduzida nas mãos + controlo
  por voz (12), tremor/só teclado (13), dislexia (14), concentração/memória (3, 15),
  baixa literacia (18), português não nativo (16), sensibilidade a movimento (30).
- **Contexto/dispositivo:** secretária (9, 19, 25, 28, 30), portátil (maioria),
  smartphone único (3, 6, 11, 18, 23), tablet (29), ligação instável (4, 11), pressão de
  tempo (1, 19), interrupções (15), luz fraca (11, 23), uma mão (12).
- **Perfis funcionais:** condóminos (1-6, 9, 12, 14-18, 25, 30), administração (7, 22),
  empresas gestoras (10, 13, 19-21), fornecedores (11, 23-24), auditoria (8, 25-26),
  outros intervenientes (27-29).

Faltam por desenho deliberado (fora do âmbito de uma persona individual, tratados à
parte): utilização por "duas pessoas em simultâneo" e cenários de erro/rede — ver secção
11 do pedido, coberta em `USABILITY_SIMULATION.md`.
