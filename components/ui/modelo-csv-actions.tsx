'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { descarregarModelo, lerFicheiroTexto, type ModeloCsv } from '@/lib/modelo-csv'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Descarregar um modelo para preencher no Excel e voltar a carregá-lo —
 * partilhado pelos diálogos de criação de frações e de abertura de saldos
 * (`FUNCTIONAL_GAPS.md` secção 11), para os dois se comportarem igual.
 *
 * O ficheiro carregado não é enviado para lado nenhum: é lido no browser e
 * o texto vai para a mesma caixa onde a pessoa colaria à mão, passando
 * pelas mesmas validações e pela mesma pré-visualização. Não há caminho de
 * gravação novo — é só outra forma de encher a caixa.
 *
 * Usa um `input type="file"` nativo, com etiqueta visível, em vez de um
 * botão falso a disparar um input escondido: o nativo é o que os leitores
 * de ecrã anunciam corretamente (ver `docs/audit/ACCESSIBILITY_AUDIT.md`).
 */
export function ModeloCsvActions({
  modelo,
  onTextoCarregado,
}: {
  modelo: ModeloCsv
  onTextoCarregado: (texto: string) => void
}) {
  const idInput = useId()
  const [aLer, setALer] = useState(false)

  const carregar = async (ficheiro: File | undefined) => {
    if (!ficheiro) return
    setALer(true)
    try {
      const texto = await lerFicheiroTexto(ficheiro)
      if (!texto.trim()) {
        toast.error('O ficheiro está vazio.')
        return
      }
      onTextoCarregado(texto)
      toast.success(`"${ficheiro.name}" carregado — confira a pré-visualização antes de gravar.`)
    } catch {
      toast.error('Não foi possível ler o ficheiro. Guarde-o como CSV e tente de novo.')
    } finally {
      setALer(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3">
      <p className="text-sm text-foreground">
        Prefere preencher numa folha de cálculo? Descarregue o modelo, preencha-o no Excel,
        guarde-o como CSV e carregue-o aqui.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => descarregarModelo(modelo)}>
          <Download className="h-4 w-4" />
          Descarregar modelo
        </Button>
        <div className="flex-1">
          <Label htmlFor={idInput} className="text-xs">
            Ficheiro preenchido (.csv)
          </Label>
          <input
            id={idInput}
            type="file"
            accept=".csv,text/csv,.txt"
            disabled={aLer}
            onChange={(e) => {
              void carregar(e.target.files?.[0])
              // Permite escolher o mesmo ficheiro outra vez depois de o corrigir.
              e.target.value = ''
            }}
            className="mt-1 block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1 file:text-sm file:text-foreground hover:file:bg-accent"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        O ficheiro é lido aqui no seu computador e o conteúdo aparece na caixa abaixo, para
        conferir antes de gravar. A linha de cabeçalho do modelo é ignorada.
      </p>
    </div>
  )
}
