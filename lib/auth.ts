import { betterAuth } from 'better-auth'
import { twoFactor, haveIBeenPwned } from 'better-auth/plugins'
import { createAuthMiddleware, APIError } from 'better-auth/api'
import { pool, db } from '@/lib/db'
import { membro } from '@/lib/db/schema'
import { registarAuditoria, registarEventoAutenticacao } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import type { MembroSessao } from '@/lib/perfis'
import { eq } from 'drizzle-orm'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 10,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Repor password — GestCondo',
        html: `<p>Recebemos um pedido para repor a password da sua conta GestCondo.</p><p><a href="${url}">Clique aqui para repor a password</a></p><p>Se não foi você a pedir, ignore este email — a sua password não será alterada.</p>`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Confirme o seu email — GestCondo',
        html: `<p>Bem-vindo(a) ao GestCondo.</p><p><a href="${url}">Clique aqui para confirmar o seu email</a></p>`,
      })
    },
  },
  // Rate limiting explícito (SECURITY_AUDIT.md S5) — antes só corria com
  // os valores por omissão do better-auth (ativo só em produção, 10s/100
  // pedidos). `storage` fica no default ("memory"): não sobrevive a
  // reinício nem é partilhado entre instâncias serverless — corrigir só
  // quando houver Redis/Upstash disponível.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/forget-password': { window: 60, max: 5 },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: 'Confirme a eliminação da sua conta — GestCondo',
          html: `<p>Pediu para eliminar a sua conta GestCondo. Esta ação não pode ser desfeita.</p><p><a href="${url}">Clique aqui para confirmar a eliminação</a></p><p>Se não foi você a pedir, ignore este email — a sua conta não será eliminada.</p>`,
        })
      },
      // Remove a(s) linha(s) membro deste utilizador — mesmo padrão de
      // rejeitarMembro (app/actions/fracoes.ts): nunca toca em
      // movimento/ocorrencia históricos, que mantêm o userId como
      // referência solta, sem FK, por obrigação de retenção legal.
      afterDelete: async (user) => {
        const linhas = await db.select().from(membro).where(eq(membro.userId, user.id))
        for (const m of linhas) {
          await registarAuditoria({
            actor: {
              id: m.id,
              condominioId: m.condominioId,
              userId: m.userId,
              nome: m.nome,
              email: m.email,
              perfil: (m.perfil as MembroSessao['perfil']) ?? 'condomino',
              estado: (m.estado as MembroSessao['estado']) ?? 'aprovado',
              fracaoId: m.fracaoId,
              isSuperAdmin: false,
            },
            acao: 'eliminar',
            entidade: 'membro',
            entidadeId: m.id,
            detalhes: 'Conta eliminada pelo próprio titular (RGPD)',
          })
          await db.delete(membro).where(eq(membro.id, m.id))
        }
      },
    },
  },
  // BETTER_AUTH_URL já é usado acima para o baseURL — incluído aqui também
  // para que configurar um domínio próprio (ex. gestcondo.pt) baste alterar
  // essa única variável de ambiente, sem tocar no código. Sem isto, o login
  // falharia nesse domínio (origem não confiável) mesmo com o baseURL certo.
  trustedOrigins: [
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // Auditoria de login/falha de login/pedido de reset de password (achado
  // AUDIT-01 da auditoria jurídica) — só existiam nos logs efémeros da
  // Vercel. `hooks.after` do better-auth não é por rota; corre para todos
  // os pedidos, por isso filtra por `ctx.path`. Uma falha de login lança
  // um `APIError` em vez de devolver o resultado normal — `ctx.context.returned`
  // é o `APIError` nesse caso (ver lib/audit.ts para a lógica de resolução
  // de condomínio a partir do userId/email).
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-in/email') {
        const email = String((ctx.body as { email?: string } | undefined)?.email ?? '')
        const returned = ctx.context.returned
        if (returned instanceof APIError) {
          if (email) await registarEventoAutenticacao('login_falhado', { email })
        } else {
          const userId = (returned as { user?: { id?: string } } | undefined)?.user?.id
          if (userId) await registarEventoAutenticacao('login', { userId })
        }
      }
      if (ctx.path === '/request-password-reset') {
        const email = String((ctx.body as { email?: string } | undefined)?.email ?? '')
        if (email) await registarEventoAutenticacao('pedido_reset_password', { email })
      }
    }),
  },
  plugins: [
    // Verificação de password comprometida (Fase 3, item 5) — usa a API
    // pública do Have I Been Pwned por k-anonimato (só envia um prefixo de
    // hash SHA-1, nunca a password em claro). Sem dependência nova.
    haveIBeenPwned(),
    // MFA/TOTP opcional, disponível a qualquer perfil (Fase 3, item 5) —
    // ativação é escolha do próprio membro, não é imposta a administradores
    // nesta primeira versão (evita lockout sem fluxo de recuperação testado).
    twoFactor({
      issuer: 'GestCondo',
    }),
  ],
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // In dev (v0 preview iframe), force cross-site cookies so the
          // session cookie is stored by the browser.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
