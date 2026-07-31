import Link from 'next/link'
import { getAtaPorToken } from '@/app/actions/acesso-convidado'
import { AtaConteudo } from '@/components/assembleias/ata-conteudo'
import { ImprimirButton } from '@/components/imprimir-button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2 } from 'lucide-react'

export default async function PartilhaTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const detalhe = await getAtaPorToken(token)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center gap-3 print:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-serif text-lg font-bold text-foreground">GestCondo</span>
      </div>

      {!detalhe ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-medium text-foreground">Este link não está disponível</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Pode ter expirado, ter sido revogado pela administração do condomínio, ou o
              endereço pode estar incorreto. Contacte quem lhe enviou este link para pedir um
              novo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex justify-end print:hidden">
            <ImprimirButton />
          </div>
          <AtaConteudo
            condominio={detalhe.condominio}
            assembleia={detalhe.assembleia}
            pontos={detalhe.pontos}
            presencas={detalhe.presencas}
            totalPermilagem={detalhe.totalPermilagem}
            permilagemPresente={detalhe.permilagemPresente}
            anexos={[]}
            mostrarAnexos={false}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground print:hidden">
            Está a ver uma versão limitada e temporária desta ata, partilhada pela
            administração do condomínio.{' '}
            <Link href="/" className="underline-offset-4 hover:underline">
              Saiba mais sobre o GestCondo
            </Link>
            .
          </p>
        </>
      )}
    </div>
  )
}
