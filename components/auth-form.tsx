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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [registado, setRegistado] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
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

    router.push('/')
    router.refresh()
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

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
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
