'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, MailCheck } from 'lucide-react'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [aceitaTermos, setAceitaTermos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registado, setRegistado] = useState(false)
  const [pedeCodigo2fa, setPedeCodigo2fa] = useState(false)
  const [usarCodigoRecuperacao, setUsarCodigoRecuperacao] = useState(false)
  const [codigo2fa, setCodigo2fa] = useState('')

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (pedeCodigo2fa) {
      const { error } = usarCodigoRecuperacao
        ? await authClient.twoFactor.verifyBackupCode({ code: codigo2fa })
        : await authClient.twoFactor.verifyTotp({ code: codigo2fa })

      setLoading(false)

      if (error) {
        setError(traduzErro(error.message))
        return
      }

      router.push('/')
      router.refresh()
      return
    }

    if (isSignUp && !aceitaTermos) {
      setLoading(false)
      setError('Tem de aceitar a Política de Privacidade e os Termos de Utilização')
      return
    }

    const { data, error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(traduzErro(error.message))
      return
    }

    if (isSignUp) {
      // A conta fica a aguardar confirmação do email antes de poder entrar
      // (ver lib/auth.ts: requireEmailVerification) — não redirecionar,
      // mostrar instruções claras em vez de deixar a pessoa "perdida".
      setRegistado(true)
      return
    }

    if ('twoFactorRedirect' in data && data.twoFactorRedirect) {
      // Login com password válida, mas a conta tem MFA ativo — pede o
      // código antes de terminar a sessão (lib/auth.ts: plugin twoFactor).
      setPedeCodigo2fa(true)
      return
    }

    router.push('/')
    router.refresh()
  }

  if (pedeCodigo2fa) {
    return (
      <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="font-serif text-xl font-bold text-foreground">
              Verificação em duas etapas
            </h1>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              {usarCodigoRecuperacao
                ? 'Introduza um dos seus códigos de recuperação.'
                : 'Introduza o código de 6 dígitos gerado pela sua aplicação de autenticação.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="codigo2fa">
                  {usarCodigoRecuperacao ? 'Código de recuperação' : 'Código de verificação'}
                </Label>
                <Input
                  id="codigo2fa"
                  value={codigo2fa}
                  onChange={(e) => setCodigo2fa(e.target.value)}
                  required
                  autoFocus
                  inputMode={usarCodigoRecuperacao ? 'text' : 'numeric'}
                  placeholder={usarCodigoRecuperacao ? 'xxxxxxxx' : '000000'}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Aguarde...' : 'Verificar'}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setUsarCodigoRecuperacao(!usarCodigoRecuperacao)
                setCodigo2fa('')
                setError(null)
              }}
              className="mt-4 text-xs text-primary underline-offset-4 hover:underline"
            >
              {usarCodigoRecuperacao
                ? 'Usar o código da aplicação de autenticação'
                : 'Usar um código de recuperação'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (registado) {
    return (
      <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MailCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-serif text-xl font-bold text-foreground">
              Falta só um passo
            </h1>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Enviámos um email para <strong>{email}</strong> com um link
              para confirmar a sua conta. Abra o email e clique no link para
              poder entrar.
            </p>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              Não encontra o email? Verifique também a pasta de spam ou lixo
              eletrónico.
            </p>
            <Link href="/sign-in">
              <Button variant="outline" className="mt-6 w-full">
                Já confirmei, quero entrar
              </Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight text-foreground">
            GestCondo
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center text-pretty">
            {isSignUp
              ? 'Crie a sua conta para começar a gerir o condomínio'
              : 'Aceda à gestão do seu condomínio'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Ex: Maria Silva"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="nome@exemplo.pt"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Palavra-passe</Label>
                {!isSignUp && (
                  <Link
                    href="/esqueci-password"
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Esqueceu-se da password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="Mínimo 10 caracteres"
              />
            </div>

            {isSignUp && (
              <div className="flex items-start gap-2">
                <input
                  id="aceitaTermos"
                  type="checkbox"
                  checked={aceitaTermos}
                  onChange={(e) => setAceitaTermos(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-input"
                />
                <Label htmlFor="aceitaTermos" className="font-normal text-xs text-muted-foreground">
                  Li e aceito a{' '}
                  <Link href="/privacidade" target="_blank" className="text-primary underline-offset-4 hover:underline">
                    Política de Privacidade
                  </Link>{' '}
                  e os{' '}
                  <Link href="/termos" target="_blank" className="text-primary underline-offset-4 hover:underline">
                    Termos de Utilização
                  </Link>
                </Label>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || (isSignUp && !aceitaTermos)}
              className="w-full"
            >
              {loading
                ? 'Aguarde...'
                : isSignUp
                  ? 'Criar conta'
                  : 'Entrar'}
            </Button>
          </form>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? 'Já tem conta? ' : 'Ainda não tem conta? '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Entrar' : 'Registar'}
          </Link>
        </p>

        <p className="mt-3 flex justify-center gap-3 text-xs text-muted-foreground">
          <Link href="/privacidade" className="underline-offset-4 hover:underline">
            Privacidade
          </Link>
          <Link href="/termos" className="underline-offset-4 hover:underline">
            Termos
          </Link>
        </p>
      </div>
    </main>
  )
}

function traduzErro(message?: string) {
  if (!message) return 'Ocorreu um erro. Tente novamente.'
  const m = message.toLowerCase()
  if (m.includes('not') && m.includes('verif'))
    return 'Ainda não confirmou o seu email. Verifique a sua caixa de entrada (e a pasta de spam) e clique no link que enviámos — acabámos de enviar um novo.'
  if (m.includes('invalid') && m.includes('password'))
    return 'Email ou palavra-passe incorretos.'
  if (m.includes('user') && m.includes('exist'))
    return 'Já existe uma conta com este email.'
  if (m.includes('credential')) return 'Email ou palavra-passe incorretos.'
  return message
}
