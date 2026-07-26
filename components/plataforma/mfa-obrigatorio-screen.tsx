import { ShieldAlert } from 'lucide-react'
import { MfaSection } from '@/components/perfil/mfa-section'
import { SairButton } from '@/components/plataforma/sair-button'

export function MfaObrigatorioScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 font-serif text-xl font-bold text-foreground">
          Verificação em duas etapas obrigatória
        </h1>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          Por segurança, o acesso à plataforma exige verificação em duas etapas — esta conta
          controla o acesso de todos os condomínios. Ative-a abaixo para continuar.
        </p>
        <div className="mt-6 flex justify-center">
          <MfaSection />
        </div>
        <div className="mt-4">
          <SairButton />
        </div>
      </div>
    </main>
  )
}
