'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

export function PendingScreen({ email }: { email: string }) {
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
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-foreground">
          Conta a aguardar aprovação
        </h1>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          A sua conta ({email}) foi registada e está a aguardar aprovação de
          um administrador do condomínio antes de poder aceder aos dados.
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
