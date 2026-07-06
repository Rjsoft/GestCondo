import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PendingScreen } from '@/components/pending-screen'
import { getMembroAtual } from '@/lib/session'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const membro = await getMembroAtual()
  if (!membro) redirect('/sign-in')

  if (membro.estado !== 'aprovado') {
    return (
      <>
        <PendingScreen email={membro.email} />
        <Toaster />
      </>
    )
  }

  return (
    <AppShell nome={membro.nome} perfil={membro.perfil}>
      {children}
      <Toaster />
    </AppShell>
  )
}
