import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PendingScreen } from '@/components/pending-screen'
import { SuspensoScreen } from '@/components/suspenso-screen'
import { ehOperadorPlataforma, getCondominioAtual, getMembroAtual, getSession } from '@/lib/session'
import { getContagemMensagensNaoLidas } from '@/app/actions/mensagens'
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
    // Conta de operador da plataforma sem nenhum condomínio associado — não
    // faz sentido mandá-la para o onboarding (não gere nenhum condomínio),
    // vai direta para /plataforma.
    if (await ehOperadorPlataforma(session.user.id)) redirect('/plataforma')
    redirect('/onboarding')
  }

  if (membro.condominioSuspenso && !membro.isOperadorPlataforma) {
    return (
      <>
        <SuspensoScreen email={membro.email} />
        <Toaster />
      </>
    )
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
  // Auditor fica de fora do canal de mensagens por completo — evita chamar
  // a action (que rejeitaria) só para saber que a contagem é sempre 0.
  const contagemMensagens =
    membro.perfil === 'auditor' && !membro.isSuperAdmin
      ? 0
      : await getContagemMensagensNaoLidas()

  return (
    <AppShell
      nome={membro.nome}
      perfil={membro.perfil}
      isSuperAdmin={membro.isSuperAdmin}
      isOperadorPlataforma={membro.isOperadorPlataforma}
      condominioNome={condominio?.nome ?? 'Condomínio'}
      contagensNav={{ '/mensagens': contagemMensagens }}
    >
      {children}
      <Toaster />
    </AppShell>
  )
}
