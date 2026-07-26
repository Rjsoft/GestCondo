import { redirect } from 'next/navigation'
import { getSession, getOperadorPlataforma } from '@/lib/session'
import { listarCondominiosPlataforma } from '@/app/actions/plataforma'
import { PlataformaTabela } from '@/components/plataforma/plataforma-tabela'
import { SairButton } from '@/components/plataforma/sair-button'
import { MfaObrigatorioScreen } from '@/components/plataforma/mfa-obrigatorio-screen'
import { Building2 } from 'lucide-react'

export default async function PlataformaPage() {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  const operador = await getOperadorPlataforma()
  if (!operador) {
    // Autenticado mas sem ser operador da plataforma — manda para o painel
    // normal (que por sua vez trata onboarding/aprovação pendente), em vez
    // de rebentar com um erro 500 genérico.
    redirect('/')
  }

  // Operador da plataforma sem MFA ativo — o próprio requireOperadorPlataforma()
  // usado pelas server actions bloqueia esta conta, por isso a página nem
  // chega a pedir a lista de condomínios; mostra só o ecrã de ativação.
  if (!operador.twoFactorEnabled) {
    return <MfaObrigatorioScreen />
  }

  const condominios = await listarCondominiosPlataforma()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">Plataforma</h1>
            <p className="text-sm text-muted-foreground">
              Estado de subscrição de todos os condomínios — visível só ao operador da plataforma.
            </p>
          </div>
        </div>
        <SairButton />
      </div>

      <PlataformaTabela condominios={condominios} />
    </div>
  )
}
