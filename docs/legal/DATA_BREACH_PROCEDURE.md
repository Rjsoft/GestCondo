# Procedimento de Resposta a Violações de Dados Pessoais — GestCondo

Data: 2026-07-22. Base: RGPD arts. 33º e 34º, Orientações n.º 9/2022 do Comité Europeu para a Proteção de Dados sobre notificação de violações de dados pessoais (tradução CNPD) [1]. **Hoje não existe nenhum procedimento formalizado nem ferramenta dentro da aplicação para nada disto** — este documento propõe o procedimento, não descreve algo já implementado.

## 1. O que conta como violação

Qualquer violação de segurança que resulte, de modo acidental ou ilícito, na destruição, perda, alteração, divulgação ou acesso não autorizados a dados pessoais transmitidos, conservados ou tratados de outro modo (art. 4º/12). No contexto do GestCondo, exemplos concretos: acesso de um condomínio aos dados de outro (falha de isolamento multi-tenant), exposição do store de ficheiros (privado desde 2026-07-22, servido por rota autenticada — ver `DATA_SUBPROCESSORS_REGISTER.md`), fuga de credenciais (`BETTER_AUTH_SECRET`, `DATABASE_URL`), ou um incidente do lado de um subcontratante (Neon, Resend, Vercel).

## 2. Fases do procedimento

1. **Deteção** — hoje depende de deteção manual (sem alertas automáticos configurados). Fontes possíveis: relato de um utilizador, monitorização do fornecedor de infraestrutura, revisão do `audit_log`.
2. **Registo** — assim que detetada, registar: data/hora de deteção, quem detetou, descrição inicial, sistemas afetados. **Sem ferramenta dedicada hoje** — recomenda-se, até existir uma, um registo externo à aplicação (ex. documento controlado), nunca só verbal.
3. **Triagem** — avaliar rapidamente: que dados, quantos titulares, que condomínio(s), há indício de exploração ativa?
4. **Contenção** — ações imediatas conforme o tipo (ex.: revogar uma chave/token comprometido, corrigir uma falha de isolamento, tornar um ficheiro privado). Documentar a ação e a hora.
5. **Investigação** — determinar causa raiz, extensão real (não assumir o pior nem o melhor sem evidência), se já cessou.
6. **Avaliação de risco para os titulares** — considerar o tipo de dado (financeiro, contacto, texto de ata/ocorrência), volume, se há dados sensíveis, se a exposição é reversível.
7. **Notificação à CNPD** — obrigatória em **72 horas** após ter conhecimento, salvo se for improvável que a violação resulte em risco para os direitos e liberdades dos titulares (art. 33º/1). Pode ser feita por fases se a informação completa não estiver disponível a tempo (confirmado nas Orientações n.º 9/2022). Se o prazo não for cumprido, a notificação deve ser acompanhada dos motivos do atraso.
8. **Comunicação aos titulares** — obrigatória, sem atraso indevido, quando a violação for suscetível de resultar num **risco elevado** para os direitos e liberdades das pessoas (art. 34º) — ex. exposição de dados financeiros ou de contacto de condóminos específicos.
9. **Documentação da decisão** — mesmo quando se conclui que a notificação à CNPD não é exigível, o próprio RGPD (art. 33º/5) obriga a documentar a violação, os seus efeitos e as medidas tomadas.
10. **Ações corretivas** — medidas técnicas/organizativas para prevenir recorrência, com responsável e prazo.
11. **Comunicação entre responsável e subcontratante** — se a violação ocorrer num subcontratante (Neon, Resend, Vercel), este deve notificar o operador GestCondo sem atraso indevido (art. 28º/3/f) — **a confirmar se os contratos/termos de serviço atuais destes fornecedores incluem esta obrigação explicitamente** (ver `DATA_SUBPROCESSORS_REGISTER.md`).

## 3. Quem decide e quem executa

**Hoje não há um responsável formalmente designado** para conduzir este procedimento (sem DPO nomeado, sem responsável de segurança identificado). Recomenda-se que, no mínimo, o administrador/operador da instância assuma este papel explicitamente até existir uma estrutura maior.

## 4. Ponto de contacto

A Política de Privacidade deve indicar um contacto de privacidade (a confirmar se já indica um, na Fase C) — esse é também o canal para reportar suspeitas de violação, tanto por titulares como por colaboradores.

## 5. Ações a tomar decorrentes desta auditoria

1. Definir explicitamente quem, na operação real do GestCondo, assume o papel de "responsável pelo incidente" (mesmo que seja o próprio Rui, como administrador único hoje).
2. Criar um registo simples (fora da aplicação, para já) para qualquer incidente, mesmo que pareça menor.
3. Verificar se os termos de serviço da Neon/Resend/Vercel já cobrem a notificação de incidentes ao operador — se não, considerar isto no DPA a negociar (ver `LEGAL_DOCUMENTS_REGISTER.md`).

---

[1] CNPD — Orientações n.º 9/2022 sobre a notificação da violação de dados pessoais (tradução das orientações do CEPD), consultado em 2026-07-22: https://www.cnpd.pt/media/vfhpxp3p/edpb_guidelines_202209_personal_data_breach_notification_v2-0_pt.pdf
