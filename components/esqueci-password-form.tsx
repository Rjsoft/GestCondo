'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, MailCheck } from 'lucide-react'

export function EsqueciPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await authClient.requestPasswordReset({
      email,
      redirectTo: '/redefinir-password',
    })
    setLoading(false)
    // Mostrar sempre a mesma mensagem, exista ou não uma conta com este
    // email — não confirmar/negar a existência de uma conta a quem pede o
    // reset é uma prática comum de segurança (evita "adivinhar" emails
    // registados).
    setEnviado(true)
  }

  if (enviado) {
    return (
      <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MailCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-serif text-xl font-bold text-foreground">
              Verifique o seu email
            </h1>
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Se existir uma conta com o email <strong>{email}</strong>,
              enviámos um link para repor a palavra-passe. Abra o email e siga as
              instruções.
            </p>
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              Não encontra o email? Verifique também a pasta de spam ou lixo
              eletrónico.
            </p>
            <Link href="/sign-in">
              <Button variant="outline" className="mt-6 w-full">
                Voltar a entrar
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
            Repor palavra-passe
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center text-pretty">
            Indique o email da sua conta e enviamos-lhe um link para criar
            uma nova palavra-passe.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Aguarde...' : 'Enviar link de recuperação'}
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
