'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { criarCondominio, entrarComCodigo } from '@/app/actions/condominio'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, KeyRound } from 'lucide-react'

export function OnboardingForm() {
  const router = useRouter()
  const [modo, setModo] = useState<'escolher' | 'codigo' | 'novo'>('escolher')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSubmitCodigo = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await entrarComCodigo(formData)
        router.push('/')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao entrar no condomínio')
      }
    })
  }

  const onSubmitNovo = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await criarCondominio(formData)
        router.push('/')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao criar o condomínio')
      }
    })
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold tracking-tight text-foreground">
            Falta só mais um passo
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center text-pretty">
            Junte-se a um condomínio existente ou crie um novo.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {modo === 'escolher' && (
            <div className="flex flex-col gap-3">
              <Button variant="outline" className="justify-start" onClick={() => setModo('codigo')}>
                <KeyRound className="h-4 w-4" />
                Tenho um código de convite
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => setModo('novo')}>
                <Building2 className="h-4 w-4" />
                Quero criar um condomínio novo
              </Button>
            </div>
          )}

          {modo === 'codigo' && (
            <form action={onSubmitCodigo} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="codigo">Código de convite</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  required
                  autoFocus
                  placeholder="Ex: A3F9K2QX"
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Peça este código ao administrador do seu condomínio.
                </p>
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setModo('escolher')} disabled={pending}>
                  Voltar
                </Button>
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? 'A entrar...' : 'Entrar no condomínio'}
                </Button>
              </div>
            </form>
          )}

          {modo === 'novo' && (
            <form action={onSubmitNovo} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nome">Nome do condomínio</Label>
                <Input
                  id="nome"
                  name="nome"
                  required
                  autoFocus
                  placeholder="Ex: Rua das Flores, Nº 12"
                />
                <p className="text-xs text-muted-foreground">
                  Fica como administrador deste condomínio. Pode corrigir a morada e o NIF depois.
                </p>
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setModo('escolher')} disabled={pending}>
                  Voltar
                </Button>
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? 'A criar...' : 'Criar condomínio'}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Terminar sessão
          </button>
        </div>
      </div>
    </main>
  )
}
