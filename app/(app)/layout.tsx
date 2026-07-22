import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PendingScreen } from '@/components/pending-screen'
import { getCondominioAtual, getMembroAtual, getSession } from '@/lib/session'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const membro = await getMembroAtual()
  if (!membro) {
    const session = await getSession()
    if (!session?.user) redirect('/sign-in')
    redirect('/onboarding')
  }

  if (membro.estado !== 'aprovado' && !membro.isSuperAdmin) {
    return (
      <>
        <PendingScreen email={membro.email} />
        <Toaster />
      </>
    )
  }

  const condominio = await getCondominioAtual(membro.condominioId)

  return (
    <AppShell
      nome={membro.nome}
      perfil={membro.perfil}
      isSuperAdmin={membro.isSuperAdmin}
      condominioNome={condominio?.nome ?? 'Condomínio'}
    >
      {children}
      <Toaster />
    </AppShell>
  )
}
