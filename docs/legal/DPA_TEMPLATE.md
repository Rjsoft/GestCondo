# Modelo de Acordo de Tratamento de Dados (DPA) — GestCondo

Data: 2026-07-22. Produzido no seguimento do achado RGPD-03/LEGAL_DOCUMENTS_REGISTER.md desta auditoria. **Este é um modelo/template, não um contrato assinado** — hoje não existe nenhuma empresa administradora cliente distinta do próprio utilizador (confirmado: o utilizador é o único com conta na aplicação). Fica pronto a preencher e a rever juridicamente assim que surgir o primeiro cliente administradora.

**Campos entre `[colchetes]` têm de ser preenchidos antes de qualquer uso real. Este modelo não substitui revisão por um advogado antes da assinatura** (ver `LEGAL_RGPD_COMPLIANCE_HANDBOOK.md` secção 25).

---

## Acordo de Tratamento de Dados Pessoais

Nos termos do artigo 28º do Regulamento (UE) 2016/679 (RGPD), entre:

**Responsável pelo Tratamento**: `[nome da empresa administradora]`, com sede em `[morada]`, NIF `[NIF]`, doravante "Responsável".

**Subcontratante**: `[nome/entidade do operador do GestCondo]`, com sede em `[morada]`, NIF `[NIF]`, doravante "Subcontratante".

Este Acordo aplica-se ao tratamento de dados pessoais efetuado pelo Subcontratante, através da aplicação GestCondo, por conta do Responsável, no âmbito da administração dos condomínios geridos pelo Responsável.

### 1. Objeto e duração

O Subcontratante presta ao Responsável um serviço de software de gestão de condomínios (GestCondo), que implica o tratamento de dados pessoais dos condóminos, inquilinos e outros intervenientes dos condomínios geridos pelo Responsável. Este Acordo vigora enquanto durar a prestação do serviço principal (Contrato SaaS, ver `LEGAL_DOCUMENTS_REGISTER.md`) e mantém-se em vigor, quanto às obrigações de confidencialidade e eliminação/devolução de dados, mesmo após a cessação desse contrato.

### 2. Natureza e finalidade do tratamento

Ver Anexo I. Em resumo: gestão administrativa e financeira de condomínios (frações, condóminos, quotas, despesas, orçamento, seguro, fundo de reserva, assembleias/atas, ocorrências, avisos, documentos), conforme descrito em `docs/audit/SYSTEM_DATA_MAP.md` e `RAT.md`.

### 3. Categorias de titulares e de dados

Ver Anexo I. Proprietários, inquilinos, administradores/gestores, fornecedores; nome, email, telefone, NIF, dados financeiros associados a uma fração, conteúdo de ocorrências/avisos/atas.

### 4. Obrigações do Subcontratante (art. 28º/3 RGPD)

O Subcontratante obriga-se a:

a) Tratar os dados pessoais apenas mediante instruções documentadas do Responsável, incluindo no que respeita a transferências para países terceiros, salvo obrigação legal em contrário (caso em que informa o Responsável dessa obrigação antes do tratamento, salvo se a lei o proibir);

b) Garantir que as pessoas autorizadas a tratar os dados pessoais assumiram um compromisso de confidencialidade ou estão sujeitas a adequada obrigação legal de confidencialidade;

c) Tomar todas as medidas exigidas nos termos do art. 32º RGPD (segurança do tratamento) — ver Anexo II para as medidas técnicas e organizativas em vigor no GestCondo;

d) Respeitar as condições do art. 28º/2 e 28º/4 RGPD para recorrer a outro subcontratante (subcontratante posterior) — ver Anexo III para a lista atual, e informar previamente o Responsável de qualquer alteração pretendida, dando-lhe a oportunidade de se opor;

e) Assistir o Responsável, através de medidas técnicas e organizativas adequadas, na resposta a pedidos de exercício de direitos dos titulares (ver `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`);

f) Assistir o Responsável a garantir o cumprimento das obrigações dos arts. 32º a 36º RGPD (segurança, notificação de violações, DPIA), tendo em conta a informação de que dispõe — ver `docs/legal/DATA_BREACH_PROCEDURE.md`;

g) Ao critério do Responsável, eliminar ou devolver-lhe todos os dados pessoais após o termo da prestação de serviços, e eliminar as cópias existentes, salvo obrigação legal de conservação (ex. dados financeiros com retenção legal contabilística/fiscal — ver `docs/legal/DATA_RETENTION_MATRIX.md`);

h) Disponibilizar ao Responsável todas as informações necessárias para demonstrar o cumprimento das obrigações deste artigo, e permitir e contribuir para auditorias, incluindo inspeções, realizadas pelo Responsável ou por outro auditor por si mandatado.

### 5. Subcontratantes posteriores

Ver Anexo III (lista atual: Neon, Resend, Vercel Blob, Vercel Analytics — detalhe completo em `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`). O Responsável autoriza genericamente o recurso a estes subcontratantes. Qualquer alteração a esta lista será comunicada ao Responsável com uma antecedência de `[prazo a definir, ex. 30 dias]`, com direito de oposição.

### 6. Transferências internacionais

Não identificadas transferências para fora da UE/EEE com confiança (ver `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`, regiões de alguns subcontratantes ainda por confirmar formalmente). Caso venham a existir, aplicam-se as salvaguardas do Capítulo V do RGPD (ex. Cláusulas Contratuais-Tipo).

### 7. Notificação de violações de dados

O Subcontratante notifica o Responsável sem atraso indevido após ter conhecimento de uma violação de dados pessoais que afete os dados tratados ao abrigo deste Acordo, fornecendo a informação necessária para que o Responsável cumpra as suas próprias obrigações de notificação (ver `docs/legal/DATA_BREACH_PROCEDURE.md`).

### 8. Responsabilidade

`[cláusula de responsabilidade/indemnização — depende de negociação comercial, não preenchível sem decisão do utilizador]`.

### 9. Lei aplicável e foro

Lei portuguesa. Foro: `[a definir]`.

---

## Anexo I — Descrição do tratamento

Ver `RAT.md` (Registo de Atividades de Tratamento) na íntegra. Resumo das 6 finalidades: gestão administrativa (frações/condóminos/avisos/ocorrências), autenticação, gestão financeira, assembleias, documentos/ficheiros, auditoria interna.

## Anexo II — Medidas técnicas e organizativas de segurança

Isolamento multi-tenant por `condominioId` (verificado por teste de integração real); autenticação com password + MFA/TOTP opcional; rate limiting; cifra em trânsito (TLS); `audit_log` para as principais escritas; soft-delete em dados financeiros. Ficheiros em store privado, servidos só por rota autenticada com validação de sessão e `condominioId` (desde 2026-07-22). Ver `SECURITY_AUDIT.md` para o detalhe completo, incluindo o gap conhecido que permanece (`storage` do rate limiting não partilhado entre instâncias, S5).

## Anexo III — Subcontratantes posteriores autorizados

| Subcontratante | Finalidade |
|---|---|
| Neon | Alojamento da base de dados |
| Resend | Envio de email transacional |
| Vercel Blob | Armazenamento de ficheiros |
| Vercel Analytics | Métricas de utilização agregadas |

Detalhe completo em `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`.

---

## Nota final desta auditoria

Este modelo cobre o essencial exigido pelo art. 28º RGPD, mas **antes de qualquer assinatura real**:
1. Preencher todos os campos entre colchetes com os dados reais das partes.
2. Obter revisão de um advogado — este documento é tecnicamente informado, não juridicamente validado.

O achado do bucket de ficheiros público, de que o Anexo II dependia, foi **resolvido em 2026-07-22** e deixou de ser um pré-requisito para a assinatura.
