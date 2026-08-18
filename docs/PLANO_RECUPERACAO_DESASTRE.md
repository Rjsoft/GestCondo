# Plano de recuperação de desastre

Data: 2026-08-18. Cobre a base de dados de produção (Neon, branch `production`) — o único componente com estado persistente da aplicação (o código corre na Vercel, sem estado próprio; ficheiros carregados ficam no Vercel Blob, fora do âmbito deste documento). Complementa `docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md` (esse cobre migrações planeadas; este cobre falhas não planeadas).

## O que o plano atual (Neon, plano Free) garante

| Mecanismo | Cobertura | Confirmado |
|---|---|---|
| **PITR** ("Restore from history") | Restaura `production` para qualquer momento das últimas **6 horas** | ✅ Existe na interface, não testado a fundo nesta sessão (não destrutivo de testar isoladamente, mas não repetido aqui) |
| **Snapshot manual** | Cópia point-in-time sem expiração, mas só **1 de cada vez** no plano Free (criar um novo obriga a apagar o anterior) | ✅ Usado e confirmado a funcionar em 2026-08-17 (migração `0059`) |
| **Multi-step restore** (a partir de snapshot ou de um ponto no PITR) | Cria um **branch novo** com os dados restaurados, sem tocar em `production` — para inspecionar antes de decidir | ✅ **Testado a sério em 2026-08-18** (ver secção seguinte) — funciona, dados íntegros |
| **One-step restore** | Substitui os dados de `production` diretamente pelos do snapshot/ponto escolhido — **destrutivo** | Não testado deliberadamente (destrutivo por natureza; a mecânica é a mesma do multi-step, já confirmada) |

## RPO e RTO atuais (estimativa realista, não um compromisso contratual)

- **RPO (Recovery Point Objective — quantos dados se podem perder)**: até **6 horas**, limite do PITR do plano Free. Na prática, menor se o problema for detetado cedo (o `check-pending-migrations.mjs` e a monitorização nativa da Vercel ajudam a detetar problemas de código rapidamente; um problema de dados em si — ex. um `UPDATE` em massa por engano — só é detetado quando alguém repara).
- **RTO (Recovery Time Objective — quanto tempo até estar operacional outra vez)**: o restauro em si é quase instantâneo (o teste desta sessão demorou **0,5 segundos**). O tempo real depende de: decidir qual o ponto de restauro correto, executar o multi-step restore, verificar os dados no branch novo, e só depois trocar `production` para esses dados (ou fazer one-step restore diretamente, se já houver confiança). Estimativa realista: **15–30 minutos** para um incidente simples, mais se for preciso investigar qual foi a causa antes de restaurar (para não repetir o mesmo erro).

## Teste real do multi-step restore (2026-08-18)

Executado a partir do snapshot manual de produção existente (criado em 2026-08-17, antes da migração `0059`):

1. Neon Console → `production` → Backup & Restore → snapshot de 2026-08-17 18:01:08 UTC → "Restore" → **Multi-step restore**.
2. Confirmado no próprio diálogo: *"Your production branch will remain unchanged"* — só cria um branch novo.
3. Branch `branch_from_snapshot_Aug_18_2026` criado em **0,5 segundos**.
4. **Verificação de integridade dos dados restaurados** (via SQL Editor, ligado ao branch novo):
   - `drizzle.__drizzle_migrations`: **59** migrações — correto, este snapshot é de antes da migração `0059`, confirma que o ponto de restauro é exatamente o esperado.
   - `condominio`: 2 linhas, `movimento`: 546 linhas, `fracao`: 32 linhas — dados reais, coerentes com o que se esperava.
   - Tabela `processo_cobranca` (criada só na migração `0059`): **não existe** neste branch — confirma outra vez que o snapshot é anterior a essa migração, coerência total.
5. Branch de teste eliminado no fim (não fica nada pendurado a consumir quota).

**Conclusão**: o mecanismo de restauro funciona e preserva a integridade dos dados. Não foi testado o passo seguinte (promover o branch restaurado a `production`, ou fazer um one-step restore) por ser destrutivo e não haver nenhum incidente real a justificá-lo — mas a mecânica de trocar branches já é usada com sucesso noutros contextos deste projeto (ex. `development` é filho de `production`).

## Procedimento em caso de incidente real

1. **Não entrar em pânico nem restaurar de imediato.** Confirmar primeiro se o problema é de **código** (bug, página a rebentar) ou de **dados** (informação errada/perdida na BD):
   - Se for de código com o schema intacto: reverter o deploy (rollback na Vercel ou `git revert` + push) — **não mexer na base de dados**.
   - Se for de dados: avançar para o passo 2.
2. **Identificar o ponto no tempo antes do problema** — usar os timestamps do `audit_log` (`/auditoria`) sempre que possível, para saber exatamente quando algo mudou.
3. **Multi-step restore para esse ponto** (PITR, se dentro de 6h, ou o snapshot manual mais recente) — cria um branch novo, nunca mexe em `production` diretamente.
4. **Verificar os dados no branch novo** antes de qualquer decisão — confirmar que representam mesmo o estado correto (contagens, totais financeiros, o registo específico que motivou o incidente).
5. **Só depois de confirmado**: promover esse branch a `production` (a Neon permite trocar qual branch responde pela connection string de produção) — **nunca fazer one-step restore como primeiro reflexo**, mesmo estando confiante.
6. **Depois de resolvido**: registar o incidente (o que aconteceu, causa raiz, o que se perdeu, se algo), atualizar este documento e `TECHNICAL_DEBT.md` se revelar uma lacuna nova.

## O que continua em aberto (decisões do utilizador, não deste documento)

- **RPO de 6 horas é aceitável?** Decisão de negócio — ver `TECHNICAL_DEBT.md` D7. Reduzi-lo exige upgrade de plano Neon, atualmente adiado por decisão prévia (`upgrade-neon-adiado`).
- **Cópias fora da Neon**: hoje não existem — tudo depende de um único fornecedor. `exportarCondominio()` (JSON, por condomínio, acionado manualmente) não é um substituto de um backup de sistema. Fica como melhoria P2, não implementada.
- **One-step restore nunca testado**: por ser destrutivo, decidiu-se não o testar sem um incidente real a justificar. Se isso for considerado insuficiente, o multi-step restore já testado é funcionalmente equivalente no primeiro passo (a diferença está só em como se troca `production` para o branch restaurado no fim).

## Ficheiros relacionados

- `docs/PROCEDIMENTO_MIGRACAO_PRODUCAO.md` — procedimento para migrações planeadas (snapshot antes, `db:check-drift` depois).
- `TECHNICAL_DEBT.md` D7 — histórico deste achado, agora com o teste real registado.
- `docs/legal/DATA_RETENTION_MATRIX.md` — política de retenção de dados, distinta deste plano de recuperação técnica.
