import { Building2 } from 'lucide-react'
import { formatData } from '@/lib/format'

// Cabeçalho normalizado de todos os documentos imprimíveis (recibo, ata,
// balanço, relatório, declaração de dívida, minutas de assembleia), no
// padrão dos documentos profissionais de administração de condomínios:
// identificação do condomínio + data de emissão à direita, seguido do
// título do documento. O rodapé (paginação) é comum e vive no CSS de
// impressão em app/globals.css (@page margin boxes).
export function CabecalhoDocumento({
  condominio,
  titulo,
  notaLegal,
  subtitulo,
}: {
  condominio:
    | { nome: string; morada: string | null; nif: string | null }
    | null
    | undefined
  titulo: string
  // Referência legal ou número do documento, em letra pequena sob o título.
  notaLegal?: string
  subtitulo?: string
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">
              {condominio?.nome ?? 'Condomínio'}
            </p>
            {condominio?.morada && (
              <p className="text-xs text-muted-foreground">{condominio.morada}</p>
            )}
            {condominio?.nif && (
              <p className="text-xs text-muted-foreground">NIF {condominio.nif}</p>
            )}
          </div>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          Emitido em {formatData(new Date())}
        </p>
      </div>
      <div className="text-center">
        <h1 className="font-serif text-xl font-bold text-foreground">{titulo}</h1>
        {notaLegal && <p className="text-xs text-muted-foreground">{notaLegal}</p>}
        {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
    </>
  )
}
