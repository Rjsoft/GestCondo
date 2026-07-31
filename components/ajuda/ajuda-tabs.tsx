'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SECOES_AJUDA } from '@/components/ajuda/secoes'
import { SecaoComSimplificacao } from '@/components/ajuda/secao-com-simplificacao'
import { pararLeituraAoMudarSecao } from '@/components/leitura-voz/use-leitura-voz'

export function AjudaTabs({ secaoInicial }: { secaoInicial?: string }) {
  const valorInicial = SECOES_AJUDA.some((s) => s.value === secaoInicial)
    ? secaoInicial
    : SECOES_AJUDA[0].value

  return (
    <Tabs
      defaultValue={valorInicial}
      className="mt-4"
      onValueChange={() => pararLeituraAoMudarSecao()}
    >
      <TabsList className="h-auto flex-wrap">
        {SECOES_AJUDA.map((s) => (
          <TabsTrigger key={s.value} value={s.value} className="flex-none">
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SECOES_AJUDA.map((s) => (
        <TabsContent key={s.value} value={s.value} className="mt-4">
          <div
            id="ajuda-conteudo"
            data-speech-content
            className="flex max-w-2xl flex-col gap-3 text-sm text-foreground"
          >
            {s.conteudoSimplificado ? (
              <SecaoComSimplificacao original={s.conteudo} simplificado={s.conteudoSimplificado} />
            ) : (
              s.conteudo
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
