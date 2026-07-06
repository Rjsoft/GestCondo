import { getMembroAtual, temPermissaoGestao } from '@/lib/session'
import { getDocumentos } from '@/app/actions/documentos'
import { PageHeader } from '@/components/page-header'
import { NovoDocumentoDialog } from '@/components/documentos/novo-documento-dialog'
import { DocumentoActions } from '@/components/documentos/documento-actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatData } from '@/lib/format'
import { FileText, ExternalLink } from 'lucide-react'

const CATEGORIA_LABEL: Record<string, string> = {
  ata: 'Ata',
  regulamento: 'Regulamento',
  orcamento: 'Orçamento',
  outro: 'Outro',
}

export default async function DocumentosPage() {
  const membro = (await getMembroAtual())!
  const isAdmin = temPermissaoGestao(membro)
  const documentos = await getDocumentos()

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Atas, regulamentos e outros documentos do condomínio."
      >
        {isAdmin && <NovoDocumentoDialog />}
      </PageHeader>

      {documentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <FileText className="h-8 w-8" />
            <p>Ainda não existem documentos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {documentos.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-foreground">{d.titulo}</h3>
                    <Badge variant="outline">
                      {CATEGORIA_LABEL[d.categoria] ?? d.categoria}
                    </Badge>
                  </div>
                  {d.descricao && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {d.descricao}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatData(d.createdAt)}</span>
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        Abrir documento <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                {isAdmin && <DocumentoActions id={d.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
