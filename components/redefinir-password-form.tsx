'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, CheckCircle2 } from 'lucide-react'

export function RedefinirPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError(
        'Este link já não é válido. Peça um novo link em "Esqueceu-se da palavra-passe?".',
      )
      return
    }

    setLoading(true)
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setLoading(false)

    if (error) {
      setError(
        error.message?.toLowerCase().includes('token')
          ? 'Este link já expirou ou já foi usado. Peça um novo link em "Esqueceu-se da palavra-passe?".'
          : (error.message ?? 'Ocorreu um erro. Tente novamente.'),
      )
      return
    }

    setSucesso(true)
  }

  if (sucesso) {
    return (
      <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-serif text-xl font-bold text-foreground">
              Palavra-passe alterada
            </h1>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              A sua palavra-passe foi alterada com sucesso. Já pode entrar com a
              nova palavra-passe.
            </p>
            <Button className="mt-6 w-full" onClick={() => router.push('/sign-in')}>
              Entrar
            </Button>
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
            Criar nova palavra-passe
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center text-pretty">
            Escolha uma nova palavra-passe para a sua conta.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Nova palavra-passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
                placeholder="Mínimo 10 caracteres"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Aguarde...' : 'Guardar nova palavra-passe'}
            </Button>
          </form>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-6">
          <Link
            href="/sign-in"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Voltar a entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
