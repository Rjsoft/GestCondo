import { notFound } from 'next/navigation'
import { getMeuPerfil } from '@/app/actions/perfil'
import { getFracaoPorId } from '@/app/actions/fracoes'
import { getCondominioAtual, requireMembroPagina, temAcessoFinanceiro } from '@/lib/session'
import { PERFIL_LABEL } from '@/lib/perfis'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { EditarPerfilForm } from '@/components/perfil/editar-perfil-form'
import { ExportarDadosButton } from '@/components/perfil/exportar-dados-button'
import { EliminarContaDialog } from '@/components/perfil/eliminar-conta-dialog'
import { MfaSection } from '@/components/perfil/mfa-section'
import Link from 'next/link'

export default async function OsMeusDadosPage() {
  const membro = await requireMembroPagina()
  const perfil = await getMeuPerfil()
  if (!perfil) notFound()

  // A fração só é consultada para quem já tem acesso financeiro — reutiliza
  // o gate existente de getFracaoPorId em vez de o alterar (ver
  // app/actions/fracoes.ts).
  const [condominio, fracao] = await Promise.all([
    getCondominioAtual(membro.condominioId),
    perfil.fracaoId && temAcessoFinanceiro(membro) ? getFracaoPorId(perfil.fracaoId) : null,
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Os meus dados"
        description="Consulte e corrija os seus dados pessoais, exporte-os ou peça a eliminação da sua conta."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <h2 className="font-serif text-sm font-bold text-foreground">Dados pessoais</h2>
          <EditarPerfilForm nome={perfil.nome} telefone={perfil.telefone} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 text-sm">
          <h2 className="font-serif text-sm font-bold text-foreground">Dados só de leitura</h2>
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium text-foreground">{perfil.email}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Perfil</dt>
              <dd className="font-medium text-foreground">
                {PERFIL_LABEL[perfil.perfil as keyof typeof PERFIL_LABEL] ?? perfil.perfil}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <dt className="text-muted-foreground">Condomínio</dt>
              <dd className="font-medium text-foreground">{condominio?.nome ?? '—'}</dd>
            </div>
            <div className="flex justify-between pb-1">
              <dt className="text-muted-foreground">Fração</dt>
              <dd className="font-medium text-foreground">{fracao?.identificacao ?? '—'}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Para corrigir o perfil, a fração ou o email, contacte o administrador do condomínio.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <h2 className="font-serif text-sm font-bold text-foreground">Segurança</h2>
          <p className="text-sm text-muted-foreground">
            Adicione uma verificação extra ao entrar na sua conta, além da palavra-passe, usando uma
            aplicação de autenticação no seu telemóvel.
          </p>
          <MfaSection />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <h2 className="font-serif text-sm font-bold text-foreground">Exportar os meus dados</h2>
          <p className="text-sm text-muted-foreground">
            Descarregue uma cópia dos seus dados em formato JSON.
          </p>
          <ExportarDadosButton />
        </CardContent>
      </Card>

      <Card className="ring-destructive/30">
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <h2 className="font-serif text-sm font-bold text-destructive">Eliminar conta</h2>
          <p className="text-sm text-muted-foreground">
            Elimina permanentemente a sua conta GestCondo. Consulte a{' '}
            <Link href="/privacidade" className="text-primary underline-offset-4 hover:underline">
              Política de Privacidade
            </Link>{' '}
            para saber o que acontece aos seus dados.
          </p>
          <EliminarContaDialog />
        </CardContent>
      </Card>
    </div>
  )
}
