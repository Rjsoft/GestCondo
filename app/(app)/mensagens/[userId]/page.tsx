import { notFound } from 'next/navigation'
import { getConversa, enviarMensagemParaMembro } from '@/app/actions/mensagens'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { VoltarButton } from '@/components/voltar-button'
import { Conversa } from '@/components/mensagens/conversa'
import { PERFIL_LABEL, type Perfil } from '@/lib/perfis'

export default async function ConversaPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const membro = await requireMembroPagina()
  if (!temPermissaoGestao(membro)) notFound()

  const { userId } = await params

  const conversa = await getConversa(userId).catch(() => null)
  if (!conversa) notFound()

  async function enviar(conteudo: string) {
    'use server'
    await enviarMensagemParaMembro(userId, conteudo)
  }

  return (
    <div>
      <PageHeader
        title={conversa.nome}
        description={conversa.perfil ? PERFIL_LABEL[conversa.perfil as Perfil] ?? conversa.perfil : 'Conta removida'}
      >
        <VoltarButton />
      </PageHeader>
      <Conversa mensagens={conversa.mensagens} souGestao onEnviar={enviar} />
    </div>
  )
}
