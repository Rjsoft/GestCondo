import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CabecalhoDocumento } from '@/components/print/cabecalho-documento'
import { formatDataHora } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

const RESULTADO_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  adiado: 'Adiado',
}

type Presenca = {
  id: number
  identificacao: string
  tipo: string
  permilagem: number
}

type Ponto = {
  id: number
  ordem: number
  titulo: string
  descricao: string | null
  resultado: string | null
  permilagemFavor: number
  permilagemContra: number
  permilagemAbstencao: number
}

type Anexo = { id: number; titulo: string; url: string }

/**
 * Conteúdo apresentacional da ata — extraído para ser partilhado entre
 * `/assembleias/ata/[id]` (autenticado) e `/partilha/[token]` (achado F13,
 * link público sem sessão). Os anexos ficam sempre de fora da vista
 * pública: os links passam por `/api/ficheiros`, que exige sessão, e
 * alargar isso ao acesso convidado ficava fora do âmbito pedido.
 */
export function AtaConteudo({
  condominio,
  assembleia,
  pontos,
  presencas,
  totalPermilagem,
  permilagemPresente,
  anexos,
  mostrarAnexos = true,
}: {
  condominio: { nome: string; morada: string | null; nif: string | null } | null | undefined
  assembleia: {
    tipo: string
    numero: number | null
    dataPrimeiraConvocatoria: Date
    local: string
    estado: string
    textoAta: string | null
  }
  pontos: Ponto[]
  presencas: Presenca[]
  totalPermilagem: number
  permilagemPresente: number
  anexos: Anexo[]
  mostrarAnexos?: boolean
}) {
  const quorumPct = totalPermilagem > 0 ? (permilagemPresente / totalPermilagem) * 100 : 0

  return (
    <Card
      className={`relative overflow-hidden print:border-0 print:shadow-none ${
        assembleia.estado !== 'aprovada' ? 'bg-amber-50/60' : ''
      }`}
    >
      {assembleia.estado !== 'aprovada' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex flex-wrap content-around justify-around gap-8 overflow-hidden opacity-[0.07]"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="whitespace-nowrap font-serif text-4xl font-bold text-amber-900 select-none"
              style={{ transform: 'rotate(-25deg)' }}
            >
              RASCUNHO
            </span>
          ))}
        </div>
      )}
      <CardContent id="ata-conteudo" data-speech-content className="relative z-10 flex flex-col gap-6 p-8 print:p-0">
        <CabecalhoDocumento
          condominio={condominio}
          titulo={`Ata de Assembleia ${TIPO_LABEL[assembleia.tipo] ?? assembleia.tipo}${assembleia.numero ? ` nº ${assembleia.numero}` : ''}`}
          subtitulo={`${formatDataHora(assembleia.dataPrimeiraConvocatoria)} — ${assembleia.local}`}
        />
        {assembleia.estado !== 'aprovada' && (
          <div className="-mt-4 text-center">
            <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
              Rascunho — ata ainda não aprovada
            </Badge>
          </div>
        )}

        <div>
          <h2 className="mb-2 font-serif text-sm font-bold text-foreground">Presenças e quórum</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Quórum: {quorumPct.toFixed(1)}% ({permilagemPresente.toFixed(2)}‰ de{' '}
            {totalPermilagem.toFixed(2)}‰)
          </p>
          <dl className="flex flex-col gap-2 text-sm">
            {presencas.length === 0 && (
              <p className="text-muted-foreground">Nenhuma presença registada.</p>
            )}
            {presencas.map((p) => (
              <div key={p.id} className="flex justify-between border-b border-border pb-1">
                <dt className="text-foreground">
                  {p.identificacao}
                  {p.tipo === 'procuracao' && (
                    <span className="text-muted-foreground"> (procuração)</span>
                  )}
                </dt>
                <dd className="text-muted-foreground">{p.permilagem.toFixed(2)}‰</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="mb-2 font-serif text-sm font-bold text-foreground">
            Ordem de trabalhos e deliberações
          </h2>
          <div className="flex flex-col gap-3">
            {pontos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum ponto na ordem de trabalhos.</p>
            )}
            {pontos.map((p) => (
              <div key={p.id} className="border-b border-border pb-3 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium text-foreground">
                    {p.ordem}. {p.titulo}
                  </p>
                  {p.resultado && (
                    <span className="shrink-0 font-medium text-foreground">
                      {RESULTADO_LABEL[p.resultado] ?? p.resultado}
                    </span>
                  )}
                </div>
                {p.descricao && <p className="mt-1 text-muted-foreground">{p.descricao}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  A favor: {p.permilagemFavor.toFixed(2)}‰ · Contra:{' '}
                  {p.permilagemContra.toFixed(2)}‰ · Abstenção:{' '}
                  {p.permilagemAbstencao.toFixed(2)}‰
                </p>
              </div>
            ))}
          </div>
        </div>

        {assembleia.textoAta && (
          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">Texto da ata</h2>
            <p className="whitespace-pre-wrap text-sm text-foreground">{assembleia.textoAta}</p>
          </div>
        )}

        {mostrarAnexos && anexos.length > 0 && (
          <div>
            <h2 className="mb-2 font-serif text-sm font-bold text-foreground">Anexos</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {anexos.map((a) => (
                <li key={a.id}>
                  <a
                    href={`/api/ficheiros?url=${encodeURIComponent(a.url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline print:text-foreground"
                  >
                    {a.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Documento gerado automaticamente pelo GestCondo a partir do registo de presenças e
          votação da assembleia.
        </p>
      </CardContent>
    </Card>
  )
}
