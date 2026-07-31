import { notFound } from 'next/navigation'
import { getAssembleiaDetalhe } from '@/app/actions/assembleias'
import { getAcessosConvidadoDaAssembleia } from '@/app/actions/acesso-convidado'
import { acessoConvidadoAtivo } from '@/lib/acesso-convidado'
import { getCondominioAtual, requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { ImprimirButton } from '@/components/imprimir-button'
import { VoltarButton } from '@/components/voltar-button'
import { LeituraVozControls } from '@/components/leitura-voz/leitura-voz-controls'
import { AtaConteudo } from '@/components/assembleias/ata-conteudo'
import { PartilharAtaDialog } from '@/components/assembleias/partilhar-ata-dialog'

export default async function AtaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const membro = await requireMembroPagina()
  const { id } = await params
  const assembleiaId = Number(id)
  if (!Number.isInteger(assembleiaId)) notFound()

  const detalhe = await getAssembleiaDetalhe(assembleiaId)
  if (!detalhe) notFound()

  const { assembleia, pontos, presencas, totalPermilagem, permilagemPresente, anexos } = detalhe
  // Ainda não há nada para mostrar antes de a assembleia acontecer.
  if (assembleia.estado === 'convocada') notFound()

  const isAdmin = temPermissaoGestao(membro)
  const [condominio, acessosConvidado] = await Promise.all([
    getCondominioAtual(membro.condominioId),
    isAdmin && assembleia.estado === 'aprovada'
      ? getAcessosConvidadoDaAssembleia(assembleiaId)
      : Promise.resolve([]),
  ])
  const acessosAtivos = acessosConvidado.filter(acessoConvidadoAtivo)

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <VoltarButton />
        <div className="flex flex-wrap items-center gap-2">
          <LeituraVozControls targetId="ata-conteudo" label="Ler a ata" />
          {isAdmin && assembleia.estado === 'aprovada' && (
            <PartilharAtaDialog assembleiaId={assembleiaId} acessosAtivos={acessosAtivos} />
          )}
          <ImprimirButton />
        </div>
      </div>

      <AtaConteudo
        condominio={condominio}
        assembleia={assembleia}
        pontos={pontos}
        presencas={presencas}
        totalPermilagem={totalPermilagem}
        permilagemPresente={permilagemPresente}
        anexos={anexos}
      />
    </div>
  )
}
