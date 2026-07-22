# Checklist de teste manual — percorrer a app com dados reais

Data: 2026-07-22. Para seres tu a percorrer, com a tua conta real em produção, não uma conta de teste. Cada linha é algo concreto a clicar/verificar — não é preciso seguir pela ordem exata, mas cobre os fluxos que mais mudaram nas últimas sessões.

**Antes de começar:** isto não substitui os testes automáticos (esses já correm). Serve para apanhar o que só um utilizador real nota — texto confuso, número que não bate certo, botão no sítio errado.

## Painel

- [ ] Os números de Receitas/Despesas/Saldo/Fundo de reserva no painel correspondem ao que esperas?
- [ ] Os avisos e ocorrências recentes mostrados são mesmo os últimos, e nenhum "eliminado" continua a aparecer?

## Finanças

- [ ] A lista de Movimentos mostra o histórico completo e correto?
- [ ] Se tiveres fornecedores registados, aparecem corretamente associados às despesas certas?
- [ ] "Dívidas por fração" reflete quem está mesmo em atraso?
- [ ] Gerar uma "Declaração" de dívida para uma fração — o texto e os valores fazem sentido?
- [ ] O relatório PDF (`Relatório (PDF)`) imprime/exporta bem, sem cortes estranhos?
- [ ] Exportar CSV — abre bem no Excel, com acentos corretos?
- [ ] Seguro: os dados da apólice atual estão certos (seguradora, validade, capital seguro)?
- [ ] Conciliação bancária: se importares um extrato real, os valores emparelham como esperado?

## Fornecedores

- [ ] A lista de fornecedores reais está completa e sem duplicados?
- [ ] Editar um fornecedor guarda corretamente as alterações?

## Assembleias

- [ ] O histórico de assembleias já realizadas está correto (datas, pontos, resultados)?
- [ ] Abrir uma ata aprovada — o conteúdo está completo e continua bloqueado para edição?

## Avisos / Ocorrências / Documentos

- [ ] Os avisos publicados aparecem com a prioridade certa?
- [ ] Reportar uma ocorrência nova, com foto — a foto aparece corretamente depois?
- [ ] Abrir um documento já carregado — descarrega/abre sem erro?

## Condóminos / Frações

- [ ] A lista de condóminos e frações está atualizada (permilagens, proprietários)?
- [ ] Um condómino sem acesso financeiro (ex. inquilino, se tiveres algum) não vê Finanças/Frações no menu?

## Auditoria

- [ ] `/auditoria` mostra as ações recentes de forma legível (quem fez o quê, quando)?

## Sessão e conta

- [ ] Terminar sessão e voltar a entrar funciona sem fricção?
- [ ] `/os-meus-dados` mostra os teus dados corretos e a exportação funciona?

## O que fazer se encontrares algo estranho

Não corrigir nada sozinho — anota o que viste (página, o que esperavas, o que aconteceu) e traz para a próxima sessão. A maioria dos problemas reais só aparece assim, com dados a sério.
