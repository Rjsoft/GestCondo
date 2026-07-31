'use client'

import { Info, Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from '@/components/ui/collapsible'
import { useLeituraVoz } from '@/components/leitura-voz/use-leitura-voz'
import { VELOCIDADES, type VelocidadeChave } from '@/lib/leitura-voz'

const LABEL_VELOCIDADE: Record<VelocidadeChave, string> = {
  lenta: 'Lenta',
  normal: 'Normal',
  rapida: 'Rápida',
}

const LABEL_ESTADO: Record<string, string> = {
  idle: 'Parado',
  speaking: 'A ler',
  paused: 'Em pausa',
  error: 'Parado',
}

export function LeituraVozControls({ targetId }: { targetId: string }) {
  const {
    estado,
    erro,
    avisoSemVozPt,
    velocidade,
    vozesPortuguesas,
    vozPreferidaURI,
    iniciarSecao,
    pausar,
    retomar,
    parar,
    reiniciarSecao,
    definirVelocidade,
    definirVoz,
  } = useLeituraVoz(targetId)

  if (estado === 'indisponivel') return null

  const aLer = estado === 'speaking'
  const emPausa = estado === 'paused'
  const parado = estado === 'idle' || estado === 'error'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {parado && (
          <Button variant="outline" size="sm" onClick={iniciarSecao} aria-pressed={false}>
            <Volume2 className="h-4 w-4" />
            Ler esta secção
          </Button>
        )}
        {aLer && (
          <Button variant="outline" size="sm" onClick={pausar} aria-pressed={true}>
            <Pause className="h-4 w-4" />
            Pausar
          </Button>
        )}
        {emPausa && (
          <Button variant="outline" size="sm" onClick={retomar} aria-pressed={true}>
            <Play className="h-4 w-4" />
            Continuar
          </Button>
        )}
        {(aLer || emPausa) && (
          <>
            <Button variant="ghost" size="sm" onClick={parar}>
              <Square className="h-4 w-4" />
              Parar
            </Button>
            <Button variant="ghost" size="sm" onClick={reiniciarSecao} title="Reiniciar a leitura desta secção desde o início">
              <RotateCcw className="h-4 w-4" />
              Reiniciar secção
            </Button>
          </>
        )}

        {(aLer || emPausa) && (
          <div className="flex items-center gap-1" role="group" aria-label="Velocidade da leitura">
            {(Object.keys(VELOCIDADES) as VelocidadeChave[]).map((v) => (
              <Button
                key={v}
                variant={velocidade === v ? 'secondary' : 'ghost'}
                size="xs"
                aria-pressed={velocidade === v}
                onClick={() => definirVelocidade(v)}
              >
                {LABEL_VELOCIDADE[v]}
              </Button>
            ))}
          </div>
        )}

        {(aLer || emPausa) && vozesPortuguesas.length > 1 && (
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            Voz
            <select
              className="rounded-md border border-border bg-background px-1.5 py-1 text-xs text-foreground"
              value={vozPreferidaURI ?? ''}
              onChange={(e) => {
                const voz = vozesPortuguesas.find((v) => v.voiceURI === e.target.value)
                if (voz) definirVoz({ voiceURI: voz.voiceURI, nome: voz.name, lang: voz.lang })
              }}
            >
              {vozesPortuguesas.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <Collapsible>
          <CollapsibleTrigger>
            <Info className="h-3.5 w-3.5" />
            Sobre a leitura em voz alta
          </CollapsibleTrigger>
          <CollapsiblePanel className="max-w-md text-xs text-muted-foreground">
            <p>
              Lê em voz alta o conteúdo desta secção, usando a funcionalidade
              de voz já incluída no seu browser — não é enviado nenhum texto
              para a GestCondo nem para nenhum serviço externo. O
              processamento da voz depende do browser, do sistema operativo
              e das vozes instaladas ou disponibilizadas pelo fabricante do
              seu dispositivo.
            </p>
            <p className="mt-2">
              Está a utilizar uma funcionalidade de leitura do browser. Caso
              já use um leitor de ecrã (como o NVDA), poderá preferir manter
              esta função desligada — o seu leitor de ecrã já lê o conteúdo
              da página.
            </p>
            <p className="mt-2">
              Atalho de teclado: <strong>Alt+Shift+R</strong> inicia, pausa
              ou continua a leitura (não funciona dentro de campos de
              texto). A funcionalidade continua totalmente utilizável só com
              Tab e clique, sem usar o atalho.
            </p>
          </CollapsiblePanel>
        </Collapsible>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {LABEL_ESTADO[estado] ?? ''}
      </div>

      {avisoSemVozPt && (
        <p className="text-xs text-muted-foreground">
          Voz em português não disponível neste dispositivo — a usar outra
          voz do sistema.
        </p>
      )}
      {erro && (
        <p className="text-xs text-destructive" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}
