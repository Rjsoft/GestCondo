# AUDITORIA JURÍDICA, RGPD E DE CONFORMIDADE — APP DE GESTÃO DE CONDOMÍNIOS

Quero que efetues uma auditoria completa à aplicação de gestão de condomínios existente neste repositório, incidindo especialmente sobre:

* RGPD e proteção de dados pessoais;
* Política de Privacidade;
* Termos de Utilização;
* segurança e controlo de acessos;
* legislação portuguesa aplicável aos condomínios;
* regime da propriedade horizontal;
* assembleias, atas, deliberações, quóruns e votações;
* quotas, Fundo Comum de Reserva, dívidas e cobranças;
* responsabilidades do administrador do condomínio;
* conservação documental;
* rastreabilidade das operações;
* relações contratuais entre a plataforma, administradoras, condomínios, condóminos e fornecedores;
* preparação de um Caderno Jurídico, RGPD e de Conformidade da aplicação.

## 1. REGRAS DE EXECUÇÃO

Nesta fase:

1. Não alteres código funcional.
2. Não alteres a base de dados.
3. Não cries migrações.
4. Não alteres textos legais existentes sem primeiro apresentar uma análise.
5. Não assumas que funcionalidades já implementadas estão juridicamente corretas.
6. Não assumas que documentos existentes estão atualizados.
7. Não transformes interpretações jurídicas em regras rígidas sem identificar a respetiva base legal.
8. Não uses apenas conhecimento interno do modelo.
9. Confirma a legislação atual através de fontes oficiais portuguesas e europeias.
10. Indica sempre:
    * diploma;
    * artigo;
    * versão aplicável;
    * data da consulta;
    * ligação ou referência oficial.
11. Se uma matéria admitir interpretações diferentes, apresenta as alternativas e classifica o risco.
12. Distingue claramente:
    * requisito legal obrigatório;
    * boa prática;
    * recomendação técnica;
    * decisão contratual;
    * matéria que exige validação por advogado ou DPO.
13. Não declares que a aplicação está "em conformidade" apenas por existir documentação.
14. Não apresentes esta auditoria como substituto de parecer jurídico profissional.
15. Trabalha de forma económica:
    * reutiliza resultados já obtidos;
    * evita repetir análise do mesmo ficheiro;
    * não faças alterações exploratórias;
    * produz primeiro os relatórios e só depois propõe implementação.

## 2. CONTEXTO DA APLICAÇÃO

Trata-se de uma aplicação destinada à gestão de condomínios em Portugal.

A aplicação poderá ser utilizada por:

* empresas administradoras de condomínios;
* administradores eleitos;
* membros da administração;
* conselho fiscal;
* condóminos;
* coproprietários;
* residentes;
* arrendatários;
* contabilistas;
* fornecedores;
* equipas de suporte da plataforma.

A aplicação poderá tratar, entre outros:

* nomes;
* moradas;
* emails;
* telefones;
* NIF;
* identificação de frações;
* permilagens;
* informação sobre proprietários e residentes;
* IBAN e informação bancária;
* quotas;
* dívidas;
* pagamentos;
* recibos;
* despesas;
* faturas;
* atas;
* procurações;
* votações;
* correspondência;
* reclamações;
* ocorrências;
* litígios;
* contratos;
* seguros;
* documentos;
* fotografias;
* registos de acesso;
* endereços IP;
* histórico de ações.

## 3. PRIMEIRA FASE — LEVANTAMENTO DO SISTEMA

Analisa todo o repositório antes de emitir conclusões.

Revê:

* README;
* documentação;
* arquitetura;
* esquema da base de dados;
* migrações;
* modelos;
* APIs;
* frontend;
* autenticação;
* autorização;
* permissões;
* armazenamento de documentos;
* envio de email;
* logs;
* auditoria;
* backups;
* configurações;
* variáveis de ambiente;
* integrações externas;
* testes;
* documentos legais;
* textos apresentados no registo e login;
* gestão de consentimentos;
* cookies;
* telemetria;
* analytics;
* tratamento de erros;
* exportação e eliminação de dados;
* processos de cancelamento de conta.

Identifica:

* entidades de dados;
* categorias de titulares;
* tipos de dados;
* finalidades;
* fluxos;
* integrações;
* acessos internos;
* acessos externos;
* transferências internacionais;
* dados sensíveis ou de risco elevado;
* duplicações;
* dados recolhidos sem necessidade evidente;
* dados sem prazo de retenção;
* funcionalidades sem auditoria;
* operações irreversíveis;
* riscos de acesso entre condomínios.

Cria inicialmente:

`docs/audit/SYSTEM_DATA_MAP.md`

O documento deve conter:

* mapa dos módulos;
* mapa dos dados;
* mapa dos intervenientes;
* fluxos de dados;
* integrações externas;
* pontos de recolha;
* locais de armazenamento;
* locais de exportação;
* riscos preliminares.

## 4. RGPD — AUDITORIA COMPLETA

Avalia a aplicação à luz de:

* Regulamento Geral sobre a Proteção de Dados;
* Lei n.º 58/2019;
* orientações relevantes da CNPD;
* orientações do Comité Europeu para a Proteção de Dados;
* legislação nacional complementar aplicável;
* regras sobre comunicações eletrónicas e cookies;
* princípios de privacy by design e privacy by default.

### 4.1 Princípios

Verifica:

* licitude;
* lealdade;
* transparência;
* limitação das finalidades;
* minimização;
* exatidão;
* limitação da conservação;
* integridade;
* confidencialidade;
* responsabilidade demonstrada.

### 4.2 Base jurídica

Para cada tratamento identifica:

* finalidade;
* titular;
* dados;
* responsável;
* subcontratante;
* base jurídica;
* prazo de conservação;
* destinatários;
* transferência internacional;
* risco;
* mecanismo de exercício de direitos.

Não uses consentimento como base jurídica por defeito.

Distingue, quando aplicável:

* obrigação legal;
* execução de contrato;
* interesse legítimo;
* consentimento;
* exercício ou defesa de direitos;
* outras bases previstas no RGPD.

Regista o resultado deste levantamento (registo de atividades de tratamento) em `docs/legal/PROCESSING_ACTIVITIES_REGISTER.md`.

### 4.3 Papéis das entidades

Analisa os diferentes cenários:

1. Plataforma SaaS contratada por uma empresa administradora.
2. Plataforma contratada diretamente por um condomínio.
3. Administradora que utiliza a plataforma em nome do condomínio.
4. Plataforma que define autonomamente determinadas finalidades.
5. Serviços de suporte com acesso a dados.
6. Fornecedores tecnológicos externos.

Determina, para cada cenário:

* responsável pelo tratamento;
* subcontratante;
* eventual corresponsabilidade;
* subcontratantes posteriores;
* contratos necessários;
* instruções documentadas;
* obrigações de cada parte.

Não assumas automaticamente que a plataforma é sempre subcontratante.

Documenta esta análise (responsável vs. subcontratante, por cenário) em `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md`, e regista os subcontratantes e subcontratantes posteriores identificados em `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`.

### 4.4 Direitos dos titulares

Verifica se a aplicação permite:

* acesso;
* retificação;
* apagamento;
* limitação;
* oposição;
* portabilidade, quando aplicável;
* retirada de consentimento;
* reclamação;
* resposta dentro dos prazos;
* validação da identidade;
* registo do pedido;
* decisão fundamentada;
* conservação de prova.

Avalia também situações em que o apagamento não possa ocorrer devido a:

* obrigações legais;
* contabilidade;
* documentação de deliberações;
* cobrança de dívidas;
* defesa de direitos;
* conservação de atas;
* litígios.

Documenta o procedimento de exercício de direitos em `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`.

### 4.5 Segurança

Audita:

* autenticação;
* MFA;
* recuperação de conta;
* sessões;
* tokens;
* passwords;
* autorização por função;
* permissões por condomínio;
* isolamento multi-tenant;
* cifragem;
* gestão de segredos;
* backups;
* logs;
* auditoria;
* anexos;
* proteção contra acesso direto a ficheiros;
* URLs temporários;
* malware;
* uploads;
* rate limiting;
* ataques de força bruta;
* CSRF;
* XSS;
* SQL injection;
* SSRF;
* controlo de exportações;
* eliminação segura;
* vulnerabilidades de dependências.

Confirma que:

* um utilizador de um condomínio não consegue consultar outro;
* um condómino não consegue consultar dados de outra fração;
* colaboradores internos apenas acedem quando necessário;
* acessos de suporte são temporários, justificados e auditados;
* os logs não expõem dados excessivos;
* os documentos não são publicamente acessíveis;
* ações financeiras críticas ficam registadas.

Consolida esta secção em `docs/audit/SECURITY_AND_ACCESS_AUDIT.md`.

### 4.6 Violações de dados

Verifica se existe processo para:

* deteção;
* registo;
* triagem;
* contenção;
* investigação;
* avaliação de risco;
* notificação à CNPD;
* comunicação aos titulares;
* documentação da decisão;
* ações corretivas;
* comunicação entre responsável e subcontratante.

Documenta o procedimento em `docs/legal/DATA_BREACH_PROCEDURE.md`.

### 4.7 Conservação

Cria uma matriz de retenção em `docs/legal/DATA_RETENTION_MATRIX.md` com, pelo menos:

* contas de utilizador;
* contactos;
* proprietários;
* residentes;
* histórico de titularidade;
* quotas;
* pagamentos;
* recibos;
* despesas;
* documentos fiscais;
* atas;
* deliberações;
* procurações;
* contratos;
* seguros;
* incidentes;
* ocorrências;
* comunicações;
* logs de segurança;
* logs de auditoria;
* backups;
* dados de suporte;
* dados de potenciais clientes;
* pedidos de direitos;
* reclamações;
* litígios.

Para cada categoria indica:

* prazo;
* fundamento;
* evento inicial;
* exceções;
* anonimização ou eliminação;
* responsável pela execução.

### 4.8 DPIA

Avalia se existe necessidade de Avaliação de Impacto sobre a Proteção de Dados.

Considera especialmente:

* monitorização sistemática;
* videovigilância;
* perfis comportamentais;
* decisões automatizadas;
* tratamento em larga escala;
* dados financeiros;
* dados relativos a litígios;
* utilização de inteligência artificial;
* integrações com serviços externos;
* dados de menores;
* concentração de informação sobre residentes.

Cria:

`docs/legal/DPIA_SCREENING.md`

Se entenderes que é necessária uma DPIA, cria também uma estrutura inicial:

`docs/legal/DPIA_TEMPLATE.md`

Consolida os resultados das subsecções 4.1 a 4.8 em `docs/audit/RGPD_AUDIT.md`.

## 5. POLÍTICA DE PRIVACIDADE

Revê a Política de Privacidade existente ou cria uma proposta nova.

Deve explicar, de forma clara:

* identidade e contactos da entidade;
* contactos de privacidade;
* papel da plataforma;
* diferenças entre utilização pela administradora e pelo condomínio;
* categorias de dados;
* origem dos dados;
* finalidades;
* bases jurídicas;
* destinatários;
* subcontratantes;
* transferências internacionais;
* prazos de conservação;
* direitos;
* reclamações à CNPD;
* obrigação ou não de fornecer dados;
* consequências da não disponibilização;
* decisões automatizadas;
* cookies;
* segurança;
* alterações da política;
* data da versão.

A política não deve:

* prometer segurança absoluta;
* dizer que nunca existem transferências sem confirmar;
* usar consentimento como fundamento genérico;
* afirmar que todos os dados podem ser apagados imediatamente;
* misturar o papel do condomínio com o papel da plataforma;
* usar linguagem excessivamente vaga.

Cria:

`docs/legal/PRIVACY_POLICY_REVIEW.md`

Inclui:

* falhas encontradas;
* riscos;
* alterações recomendadas;
* texto proposto;
* campos que dependem de decisões comerciais;
* campos que exigem validação jurídica.

## 6. TERMOS DE UTILIZAÇÃO

Revê ou cria Termos de Utilização para a aplicação.

Analisa e propõe cláusulas sobre:

* identificação da entidade;
* objeto;
* definição dos utilizadores;
* criação de conta;
* representação do condomínio;
* autorização para inserir dados;
* exatidão da informação;
* credenciais;
* perfis e permissões;
* obrigações do cliente;
* obrigações dos utilizadores;
* utilização proibida;
* disponibilidade;
* manutenção;
* suporte;
* atualizações;
* integrações;
* propriedade intelectual;
* documentos carregados;
* dados pessoais;
* confidencialidade;
* segurança;
* pagamentos;
* faturação;
* renovação;
* cancelamento;
* suspensão;
* exportação;
* eliminação;
* responsabilidade;
* limites de responsabilidade;
* força maior;
* notificações;
* alterações aos termos;
* lei aplicável;
* foro;
* resolução alternativa de litígios, quando aplicável;
* consumidores, quando aplicável.

Verifica se o modelo é:

* B2B;
* B2C;
* misto.

Assinala cláusulas que não podem ser iguais para empresas e consumidores.

Cria:

`docs/legal/TERMS_OF_USE_REVIEW.md`

## 7. LEGISLAÇÃO DOS CONDOMÍNIOS

Revê a aplicação à luz da legislação portuguesa atual aplicável à propriedade horizontal e administração de condomínios.

Analisa, pelo menos:

* Código Civil;
* Decreto-Lei n.º 268/94;
* Lei n.º 8/2022;
* alterações posteriores relevantes;
* Código de Processo Civil, quando aplicável à cobrança;
* legislação relativa a seguros obrigatórios;
* legislação fiscal relevante;
* legislação sobre acessibilidade;
* carregamento de veículos elétricos;
* videovigilância;
* alojamento local;
* proteção contra incêndios;
* inspeções e manutenção;
* elevadores;
* contratos e fornecedores;
* assinatura eletrónica;
* comunicações eletrónicas;
* arquivo documental;
* resolução alternativa de litígios;
* livro de reclamações, caso aplicável.

### 7.1 Frações e titulares

Verifica se a aplicação suporta:

* fração autónoma;
* permilagem;
* copropriedade;
* usufruto;
* mudança de proprietário;
* histórico de titularidade;
* residentes;
* arrendatários;
* contactos distintos;
* responsabilidade temporal pelas obrigações.

### 7.2 Orçamento e repartição

Verifica:

* orçamento anual;
* aprovação;
* versão;
* deliberação associada;
* repartição por permilagem;
* repartição por utilização;
* despesas de partes comuns que servem apenas algumas frações;
* critérios especiais;
* documentação da decisão;
* arredondamentos;
* regularizações;
* alteração posterior.

### 7.3 Fundo Comum de Reserva

Analisa:

* constituição;
* percentagem;
* base de cálculo;
* separação contabilística;
* finalidade;
* utilização;
* autorização;
* conta bancária;
* relatório;
* reposição;
* rastreabilidade.

### 7.4 Quotas e dívidas

Verifica:

* quotas ordinárias;
* extraordinárias;
* prestações;
* vencimentos;
* pagamentos parciais;
* créditos;
* adiantamentos;
* juros;
* penalizações;
* avisos;
* certidão de dívida;
* ata;
* título executivo;
* mudança de proprietário;
* transmissão da fração;
* informação de encargos;
* cobrança judicial;
* prescrição;
* regularizações.

Não implementes automaticamente juros ou penalizações sem base legal ou deliberação válida.

### 7.5 Assembleias

Analisa:

* convocatória;
* prazo;
* forma de envio;
* prova de receção;
* ordem de trabalhos;
* primeira e segunda convocatória;
* presença;
* representação;
* procurações;
* quórum;
* maiorias;
* abstenções;
* votação;
* comunicação aos ausentes;
* deliberações;
* atas;
* assinatura;
* retificação;
* aditamento;
* impugnação;
* reuniões à distância;
* documentos anexos;
* execução.

Cria uma matriz:

`docs/legal/MEETINGS_AND_VOTING_MATRIX.md`

A matriz deve conter:

* matéria;
* base legal;
* quórum;
* maioria;
* exceções;
* documentação necessária;
* regra configurável na aplicação;
* risco se configurada incorretamente.

Não tentes codificar uma única regra universal de maioria.

### 7.6 Administrador

Cria uma matriz das funções e obrigações do administrador:

`docs/legal/ADMINISTRATOR_DUTIES_MATRIX.md`

Inclui:

* obrigação;
* base legal;
* prazo;
* ação na APP;
* documento;
* alerta;
* responsável;
* evidência;
* risco de incumprimento.

### 7.7 Obras, seguros e manutenção

Revê:

* obras urgentes;
* conservação;
* inovação;
* acessibilidade;
* fachadas;
* telhados;
* infiltrações;
* elevadores;
* gás;
* eletricidade;
* incêndios;
* seguros;
* inspeções;
* contratos;
* garantias;
* responsabilidade por danos;
* contratação de fornecedores;
* documentação obrigatória.

Consolida as secções 7.1 a 7.7 em `docs/audit/LEGAL_COMPLIANCE_AUDIT.md`.

## 8. DOCUMENTOS E PROVA

Avalia se os documentos gerados pela aplicação possuem:

* identificação inequívoca;
* numeração;
* data e hora;
* autor;
* condomínio;
* exercício;
* versão;
* estado;
* integridade;
* histórico;
* associação ao ato de origem;
* possibilidade de reprodução;
* proteção contra alteração silenciosa;
* cancelamento ou estorno auditável.

Revê especialmente:

* recibos;
* avisos de cobrança;
* extratos;
* atas;
* convocatórias;
* procurações;
* orçamentos;
* deliberações;
* relatórios;
* declarações;
* certidões;
* comunicações.

A aplicação não deve apagar documentos financeiros ou jurídicos emitidos. Deve usar:

* anulação;
* substituição;
* nova versão;
* estorno;
* aditamento;
* retificação;

conforme o tipo de documento.

## 9. AUDITORIA E RASTREABILIDADE

Verifica se ficam auditadas as seguintes operações:

* login;
* falhas de login;
* recuperação de conta;
* alteração de permissões;
* criação de utilizadores;
* exportação;
* consulta de dados sensíveis;
* criação e alteração de titulares;
* mudança de proprietário;
* alteração de permilagem;
* aprovação de orçamento;
* emissão de quotas;
* pagamento;
* recibo;
* estorno;
* anulação;
* alteração de IBAN;
* upload;
* download;
* eliminação;
* assembleia;
* votação;
* ata;
* alterações jurídicas;
* acessos de suporte.

Define:

* informação registada;
* prazo de retenção;
* quem pode consultar;
* proteção contra alteração;
* anonimização;
* alertas;
* relatórios de auditoria.

Consolida as secções 8 e 9 em `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md`.

## 10. CONTRATOS E DOCUMENTOS JURÍDICOS NECESSÁRIOS

Identifica quais os documentos necessários para exploração comercial.

Considera:

* Política de Privacidade;
* Termos de Utilização;
* Contrato SaaS;
* Acordo de Tratamento de Dados;
* cláusulas de subcontratação;
* lista de subcontratantes;
* política de cookies;
* tabela de conservação;
* política de segurança;
* política de acessos;
* política de backups;
* procedimento de incidentes;
* procedimento de direitos;
* política de suporte;
* política de exportação;
* política de eliminação;
* acordo de confidencialidade;
* termos para utilizadores convidados;
* termos para fornecedores;
* acordo de nível de serviço;
* plano de continuidade;
* plano de recuperação de desastre;
* registo de atividades de tratamento;
* avaliação de impacto;
* avaliação de interesse legítimo;
* informação aos condóminos.

Cria:

`docs/legal/LEGAL_DOCUMENTS_REGISTER.md`

## 11. ENTREGÁVEIS OBRIGATÓRIOS

Cria os seguintes documentos:

1. `docs/audit/SYSTEM_DATA_MAP.md`
2. `docs/audit/RGPD_AUDIT.md`
3. `docs/audit/LEGAL_COMPLIANCE_AUDIT.md`
4. `docs/audit/SECURITY_AND_ACCESS_AUDIT.md`
5. `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md`
6. `docs/legal/PRIVACY_POLICY_REVIEW.md`
7. `docs/legal/TERMS_OF_USE_REVIEW.md`
8. `docs/legal/PROCESSING_ACTIVITIES_REGISTER.md`
9. `docs/legal/DATA_RETENTION_MATRIX.md`
10. `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md`
11. `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`
12. `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`
13. `docs/legal/DATA_BREACH_PROCEDURE.md`
14. `docs/legal/DPIA_SCREENING.md`
15. `docs/legal/MEETINGS_AND_VOTING_MATRIX.md`
16. `docs/legal/ADMINISTRATOR_DUTIES_MATRIX.md`
17. `docs/legal/LEGAL_DOCUMENTS_REGISTER.md`
18. `docs/legal/LEGAL_RGPD_COMPLIANCE_HANDBOOK.md`
19. `docs/audit/REMEDIATION_PLAN.md`
20. `docs/audit/EXECUTIVE_SUMMARY.md`

Cada um destes ficheiros tem origem numa secção específica deste documento (ver secções 3 a 10, 13, 14 e 16) — não cries só a lista final sem o conteúdo de suporte correspondente.

## 12. ESTRUTURA DOS RELATÓRIOS DE AUDITORIA

Cada problema identificado deve conter:

* ID;
* título;
* área;
* descrição;
* evidência;
* ficheiro;
* componente;
* impacto;
* probabilidade;
* severidade;
* base legal;
* risco para os titulares;
* risco para o condomínio;
* risco para a administradora;
* risco para a plataforma;
* recomendação;
* esforço estimado;
* dependências;
* responsável sugerido;
* teste de validação;
* estado.

Usa severidade:

* Crítica;
* Alta;
* Média;
* Baixa;
* Informativa.

Usa prioridade:

* P0 — bloqueia piloto ou produção;
* P1 — corrigir antes da produção;
* P2 — corrigir logo após MVP;
* P3 — melhoria recomendada.

## 13. CADERNO JURÍDICO, RGPD E DE CONFORMIDADE

Cria um documento consolidado:

`docs/legal/LEGAL_RGPD_COMPLIANCE_HANDBOOK.md`

Deve conter:

1. âmbito;
2. intervenientes;
3. legislação aplicável;
4. papéis RGPD;
5. mapa dos tratamentos;
6. bases jurídicas;
7. direitos dos titulares;
8. segurança;
9. auditoria;
10. conservação;
11. subcontratantes;
12. transferências;
13. incidentes;
14. assembleias;
15. quotas;
16. FCR;
17. dívidas;
18. atas;
19. administrador;
20. seguros;
21. contratos;
22. documentos;
23. responsabilidades;
24. checklist de produção;
25. assuntos para parecer jurídico.

## 14. PLANO DE CORREÇÃO

No `docs/audit/REMEDIATION_PLAN.md`, organiza as ações por fases.

### Fase 1 — Bloqueadores

* fuga de dados entre condomínios;
* permissões incorretas;
* documentos públicos;
* passwords ou segredos expostos;
* ausência de auditoria financeira;
* eliminações irreversíveis;
* falhas graves de base jurídica;
* textos legais enganadores.

### Fase 2 — Antes do piloto

* Política de Privacidade;
* Termos;
* acordo de tratamento;
* retenção;
* direitos;
* incidentes;
* logs;
* exportação;
* cancelamento;
* fluxos jurídicos essenciais.

### Fase 3 — Antes da produção

* assembleias;
* maiorias;
* atas;
* dívidas;
* certidões;
* notificações;
* contratos;
* subcontratantes;
* segurança;
* continuidade;
* testes de isolamento.

### Fase 4 — Evolução

* automatizações;
* assinaturas;
* notificações avançadas;
* videovigilância;
* inteligência artificial;
* integrações bancárias;
* funcionalidades jurídicas adicionais.

## 15. TESTES OBRIGATÓRIOS

Propõe testes automáticos e manuais para garantir:

* isolamento multi-tenant;
* isolamento por fração;
* permissões;
* exportação;
* eliminação;
* retenção;
* logs;
* recibos imutáveis;
* estornos;
* mudanças de proprietário;
* quotas;
* FCR;
* documentos;
* assembleias;
* procurações;
* votações;
* maiorias configuráveis;
* bloqueio de exercícios;
* acessos de suporte;
* uploads;
* backups;
* recuperação;
* incidentes.

## 16. RESULTADO FINAL

No final, apresenta:

1. resumo executivo;
2. nível geral de maturidade;
3. riscos críticos;
4. bloqueadores de produção;
5. lacunas RGPD;
6. lacunas jurídicas;
7. lacunas contratuais;
8. lacunas de segurança;
9. documentação em falta;
10. correções prioritárias;
11. funcionalidades que devem ser bloqueadas;
12. funcionalidades que exigem configuração jurídica;
13. matérias que exigem parecer de advogado;
14. matérias que exigem parecer de DPO;
15. plano de implementação;
16. checklist de aprovação para piloto;
17. checklist de aprovação para produção.

Regista este resumo em `docs/audit/EXECUTIVE_SUMMARY.md`.

## 17. FORMATO DA PRIMEIRA RESPOSTA

Não comeces por alterar ficheiros.

Na primeira resposta, apresenta apenas:

* resumo do que encontraste no repositório;
* documentos já existentes;
* módulos identificados;
* riscos preliminares;
* fontes legais que vais validar;
* lista dos ficheiros que pretendes criar;
* dúvidas ou decisões que não podem ser inferidas;
* plano de auditoria por fases.

Depois aguarda autorização antes de iniciares alterações extensas.

Caso já tenhas autorização explícita para prosseguir sem nova confirmação, cria primeiro os documentos de auditoria, mas não alteres código funcional até existir um plano de correção aprovado.
