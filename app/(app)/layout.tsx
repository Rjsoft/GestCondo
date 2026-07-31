import { redirect } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { PendingScreen } from '@/components/pending-screen'
import { SuspensoScreen } from '@/components/suspenso-screen'
import {
  ehOperadorPlataforma,
  getCondominioAtual,
  getCondominiosDoUtilizador,
  getFracoesDoUtilizador,
  getMembroAtual,
  getSession,
  temPermissaoGestao,
} from '@/lib/session'
import { getNotificacoes } from '@/app/actions/notificacoes'
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

  const [condominio, notificacoes, condominios, fracoes] = await Promise.all([
    getCondominioAtual(membro.condominioId),
    getNotificacoes(),
    getCondominiosDoUtilizador(),
    getFracoesDoUtilizador(membro.condominioId),
  ])
  const totalNotificacoes =
    notificacoes.mensagens.total + notificacoes.avisos.total + notificacoes.ocorrencias.total

  return (
    <AppShell
      nome={membro.nome}
      perfil={membro.perfil}
      // F03: um gestor de nível "operacional" não vê "Condomínio" na barra
      // lateral (a própria página já bloqueava; isto evita mostrar um link
      // que dava 404). Ver components/app-shell.tsx.
      podeGerirCompleto={temPermissaoGestao(membro)}
      isSuperAdmin={membro.isSuperAdmin}
      isOperadorPlataforma={membro.isOperadorPlataforma}
      condominioNome={condominio?.nome ?? 'Condomínio'}
      condominioId={membro.condominioId}
      condominios={condominios}
      fracaoIdAtiva={membro.fracaoId}
      fracoes={fracoes}
      contagensNav={{
        '/mensagens': notificacoes.mensagens.total,
        '/notificacoes': totalNotificacoes,
      }}
    >
      {children}
      <Toaster />
    </AppShell>
  )
}
