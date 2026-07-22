# Caderno Jurídico, RGPD e de Conformidade — GestCondo

Data: 2026-07-22. Documento consolidado da auditoria completa (`PROMPT_AUDITORIA_JURIDICA_RGPD.md`). **Auditoria técnica, não parecer jurídico** — os pontos assinalados na secção 25 exigem validação por advogado/DPO antes de decisões finais.

## 1. Âmbito

Aplicação de gestão de condomínios para o mercado português (GestCondo), multi-condomínio, cobrindo gestão administrativa, financeira, assembleias, ocorrências e documentos. Auditado: código-fonte completo (`app/`, `components/`, `lib/`), configuração de produção (Vercel), integrações externas (Neon, Resend, Vercel Blob, Vercel Analytics). Não auditado diretamente: infraestrutura física dos subcontratantes (fora de alcance técnico).

## 2. Intervenientes

Administradores eleitos, empresas de administração (`perfil: gestor`), condóminos proprietários, inquilinos, fornecedores, auditores (consulta), super admin (operador da plataforma), pessoas terceiras mencionadas em texto livre sem conta própria. Ver `docs/audit/SYSTEM_DATA_MAP.md` secção 3.

## 3. Legislação aplicável

Código Civil (arts. 1419º, 1424º, 1424º-A, 1425º, 1427º, 1430º–1438º-A, 1436º), Decreto-Lei n.º 268/94 de 25 de outubro, Lei n.º 8/2022 de 10 de janeiro (altera Código Civil/DL 268/94/Código do Notariado), RGPD, Lei n.º 58/2019, orientações da CNPD e do CEPD. Todas as referências confirmadas em fontes oficiais em 2026-07-22 (ver citações em `docs/legal/MEETINGS_AND_VOTING_MATRIX.md` e `docs/legal/ADMINISTRATOR_DUTIES_MATRIX.md`).

## 4. Papéis RGPD

Ver `docs/legal/CONTROLLER_PROCESSOR_MATRIX.md` — 6 cenários analisados. Resumo: o operador é subcontratante quando uma administradora ou condomínio contrata a plataforma; é responsável autónomo para finalidades próprias (ex. Vercel Analytics, Cenário 4). O onboarding multi-condomínio (2026-07-22) tornou o Cenário 1 (administradora com vários condomínios) real, não hipotético.

## 5. Mapa dos tratamentos

Ver `RAT.md` (Registo de Atividades de Tratamento, 6 finalidades) e `docs/audit/SYSTEM_DATA_MAP.md`.

## 6. Bases jurídicas

Predominantemente execução de contrato / cumprimento de obrigação legal (regime da propriedade horizontal) — corretamente, **não** consentimento. Exceção: Vercel Analytics, com base em interesse legítimo (avaliação formal ainda em falta — ver `docs/legal/LEGAL_DOCUMENTS_REGISTER.md`).

## 7. Direitos dos titulares

Ver `docs/legal/DATA_SUBJECT_RIGHTS_PROCEDURE.md`. Acesso, retificação, portabilidade e apagamento com autosserviço maduro; oposição e limitação processadas manualmente, sem registo formal de prazo (achado RGPD-06). Exportação de dados incompleta — só devolve o registo `membro` (achado RGPD-02).

## 8. Segurança

Ver `SECURITY_AUDIT.md` (S1–S18). Sem SQL injection/XSS/CSRF encontrados. Isolamento multi-tenant verificado por teste de integração real. Gaps abertos: bucket de ficheiros público, `storage` do rate limiting não partilhado entre instâncias.

## 9. Auditoria

Ver `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md` secção 9. `audit_log` cobre a maioria das escritas sensíveis (frações, membros, movimentos, assembleias, votos). Não cobre: login, falhas de login, recuperação de conta, exportação de dados, download de documentos (achados AUDIT-01 a AUDIT-03).

## 10. Conservação

Ver `docs/legal/DATA_RETENTION_MATRIX.md`. Só `movimento` usa soft-delete; `seguro`/`aviso`/`documento`/`ocorrencia` continuam com `DELETE` físico (achado DOC-01). Sem expurgo automático de sessões expiradas nem do `audit_log`.

## 11. Subcontratantes

Ver `docs/legal/DATA_SUBPROCESSORS_REGISTER.md`. Neon, Resend, Vercel Blob, Vercel Analytics (este último não divulgado até esta auditoria — achado RGPD-01, corrigido no `RAT.md`, pendente na Política de Privacidade). DPA/anexo RGPD de cada subcontratante ainda por localizar/confirmar (achado RGPD-09).

## 12. Transferências internacionais

Nenhuma identificada com confiança — subprocessadores aparentam operar na UE/EEE (Neon confirmado em `eu-west-2`/Londres nesta sessão), mas as regiões exatas da Resend e do Vercel Blob não foram formalmente confirmadas.

## 13. Incidentes

Ver `docs/legal/DATA_BREACH_PROCEDURE.md`. Procedimento novo, proposto nesta auditoria — não existia antes. Prazo de notificação à CNPD: 72 horas (art. 33º RGPD, confirmado via Orientações n.º 9/2022 do CEPD).

## 14. Assembleias

Ver `docs/legal/MEETINGS_AND_VOTING_MATRIX.md`. Núcleo P1 implementado corretamente — a app não codifica uma única regra de maioria, o administrador qualifica cada deliberação. Gap: datas de 1ª/2ª convocatória sem validação de dia distinto (achado LEGAL-03).

## 15. Quotas

Rateio automático por permilagem, com isenção de elevador, juros de mora. Falta distinção formal ordinária/extraordinária ligada a uma deliberação (já em `FUNCTIONAL_GAPS.md`).

## 16. Fundo Comum de Reserva

Mínimo legal de 10% (DL 268/94 art. 4º) confirmado, mas não imposto automaticamente — segregação manual por lançamento.

## 17. Dívidas

Mapa de saldos por fração implementado e testado. **Falta a declaração de encargos/dívida (art. 1424º-A CC, Lei 8/2022)** — obrigatória em 10 dias, documento instrutório da venda de fração. Achado mais urgente de toda a Fase D (**LEGAL-01**, subido a P1 em `FUNCTIONAL_GAPS.md`).

## 18. Atas

Imutáveis após aprovação (bloqueio de escrita verificado no código). Sem número sequencial próprio de assembleia/ata (achado DOC-02).

## 19. Administrador

Ver `docs/legal/ADMINISTRATOR_DUTIES_MATRIX.md`. A maioria das funções do art. 1436º CC está coberta; gaps nas obrigações introduzidas pela Lei 8/2022: execução de deliberações em 15 dias úteis sem prazo registado (LEGAL-04), três orçamentos para obras extraordinárias (LEGAL-05), informação semestral sobre processos judiciais (LEGAL-06).

## 20. Seguros

Entidade própria com capital seguro (adicionado nesta sessão), alertas de expiração. Usa `DELETE` físico, não soft-delete — relevante por ser prova de cumprimento de obrigação legal (parte do achado DOC-01).

## 21. Contratos

Ver `docs/legal/LEGAL_DOCUMENTS_REGISTER.md`. Contrato SaaS e DPA são as duas peças em falta mais urgentes — o cenário que os exige (empresa administradora com vários condomínios) já está em produção.

## 22. Documentos

Ver `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md` secção 8. Recibos com numeração sequencial (mas partilhada com despesas, achado DOC-04); relatórios/balanços sem numeração própria (aceitável, são vistas agregadas, não documentos formais); sem histórico de versões em orçamentos (achado DOC-03).

## 23. Responsabilidades

Responsável pelo tratamento varia por cenário (ver secção 4 acima). Administrador do condomínio mantém as responsabilidades legais do art. 1436º CC independentemente da ferramenta usada — o GestCondo é uma ferramenta de apoio, não substitui essas responsabilidades (já expresso nos Termos de Utilização, secção 1).

## 24. Checklist de aprovação para produção

- [x] Isolamento multi-tenant verificado
- [x] Autenticação, MFA opcional, rate limiting
- [x] `audit_log` para as principais escritas
- [x] Política de Privacidade e Termos publicados (ainda como rascunho técnico)
- [x] Email transacional a funcionar em produção (corrigido nesta sessão)
- [ ] DPA com empresas administradoras clientes
- [ ] Contrato SaaS formal
- [ ] Declaração de encargos/dívida (art. 1424º-A)
- [ ] Gaps de PP-1 a PP-10 e TU-1 a TU-12 fechados
- [ ] Bucket de ficheiros deixar de ser público
- [ ] Confirmação formal das regiões de processamento dos subcontratantes

## 25. Assuntos que exigem parecer de advogado ou DPO

1. Se o regulamento do condomínio, quando integrado no título constitutivo, pode ser alterado por maioria ou exige unanimidade (divergência doutrinal, ver `MEETINGS_AND_VOTING_MATRIX.md` secção 2).
2. Conteúdo e âmbito exato do DPA a celebrar com empresas administradoras clientes.
3. Se o GestCondo, nalgum cenário, deve ser tratado como responsável conjunto (corresponsável) com uma administradora, não só subcontratante.
4. Prazo de retenção fiscal/contabilístico exato (10 anos é referência habitual, não confirmado formalmente — consultar contabilista certificado).
5. Necessidade e conteúdo de cláusulas de resolução alternativa de litígios (RAL/ODR) nos Termos de Utilização, dependendo de o utilizador final ser ou não qualificável como consumidor.
6. Validação jurídica final da Política de Privacidade e Termos de Utilização antes de qualquer utilizador real adicional (o piloto atual já está em produção com base nos rascunhos técnicos existentes — risco assumido e a resolver com prioridade).
