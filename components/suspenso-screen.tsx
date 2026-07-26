'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export function SuspensoScreen({ email }: { email: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-foreground">
          Acesso suspenso
        </h1>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          O acesso deste condomínio ({email}) foi temporariamente suspenso.
          Contacte o administrador do serviço para regularizar a situação.
        </p>
        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={handleSignOut}
        >
          Terminar sessão
        </Button>
      </div>
    </main>
  )
}
