'use client'

import { useMemo, useState, useTransition } from 'react'
import { criarFracoesEmMassa } from '@/app/actions/fracoes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { parsearFracoes, validarConjuntoFracoes } from '@/lib/fracoes-massa'
import { ListPlus } from 'lucide-react'
import { toast } from 'sonner'

const EXEMPLO = `1ºDto; Maria Silva; 83,33
1ºEsq; João Costa; 83,33
2ºDto; Ana Sousa; 83,33`

/**
 * Criação de várias frações de uma vez, colando a lista (`FUNCTIONAL_GAPS.md`
 * secção 11). O condomínio novo traz quase sempre a lista já feita numa folha
 * de cálculo — copiar e colar evita 40 preenchimentos do diálogo "Nova
 * fração", que era o passo mais penoso do primeiro dia.
 *
 * A pré-visualização é calculada aqui com as mesmas funções puras que o
 * servidor usa (`lib/fracoes-massa.ts`), para a pessoa ver os erros
 * enquanto escreve em vez de os descobrir ao submeter. O servidor volta a
 * validar tudo — isto é conveniência, não confiança.
 */
export function CriarFracoesMassaDialog({
  identificacoesExistentes,
  somaPermilagemExistente,
}: {
  identificacoesExistentes: string[]
  somaPermilagemExistente: number
}) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [pending, startTransition] = useTransition()

  const { linhas, erros } = useMemo(() => parsearFracoes(texto), [texto])
  const errosConjunto = useMemo(
    () =>
      linhas.length > 0
        ? validarConjuntoFracoes(linhas, identificacoesExistentes, somaPermilagemExistente)
        : [],
    [linhas, identificacoesExistentes, somaPermilagemExistente],
  )

  const somaNovas = linhas.reduce((s, l) => s + l.permilagem, 0)
  const podeCriar = linhas.length > 0 && erros.length === 0 && errosConjunto.length === 0

  const criar = () => {
    startTransition(async () => {
      try {
        const { criadas } = await criarFracoesEmMassa(texto)
        toast.success(`${criadas} ${criadas === 1 ? 'fração criada' : 'frações criadas'}`)
        setTexto('')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao criar as frações')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ListPlus className="mr-2 h-4 w-4" />
        Criar várias
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar várias frações de uma vez</DialogTitle>
          <DialogDescription>
            Escreva ou cole uma fração por linha, com três dados separados por ponto e
            vírgula: <strong>identificação; proprietário; permilagem</strong>. Se quiser,
            pode acrescentar o NIF numa quarta coluna. Se copiar de uma folha de cálculo
            (Excel), cole diretamente — as colunas são reconhecidas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="fracoes-massa">Lista de frações</Label>
          <textarea
            id="fracoes-massa"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={EXEMPLO}
            aria-describedby="fracoes-massa-ajuda"
            className="w-full rounded-md border border-input bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p id="fracoes-massa-ajuda" className="text-xs text-muted-foreground">
            A permilagem escreve-se como o resto dos números em Portugal, com vírgula:
            83,33. As restantes informações de cada fração (área, contactos, isenção de
            elevador) acrescentam-se depois, em &ldquo;Editar fração&rdquo;.
          </p>
        </div>

        {texto.trim() !== '' && (
          <div className="flex flex-col gap-3" aria-live="polite">
            {erros.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">
                  {erros.length} linha(s) por corrigir:
                </p>
                <ul className="mt-1 flex flex-col gap-1 text-xs text-destructive">
                  {erros.map((e) => (
                    <li key={e.numeroLinha}>
                      Linha {e.numeroLinha}: {e.erro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errosConjunto.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <ul className="flex flex-col gap-1 text-xs text-destructive">
                  {errosConjunto.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {linhas.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">
                  Vão ser criadas {linhas.length}{' '}
                  {linhas.length === 1 ? 'fração' : 'frações'}, com um total de{' '}
                  {somaNovas.toFixed(2)}‰
                  {somaPermilagemExistente > 0 && (
                    <>
                      {' '}
                      (ficando o condomínio em{' '}
                      {(somaPermilagemExistente + somaNovas).toFixed(2)}‰ de 1000‰)
                    </>
                  )}
                  :
                </p>
                <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <caption className="sr-only">
                      Pré-visualização das frações a criar
                    </caption>
                    <thead className="bg-muted/50">
                      <tr>
                        <th scope="col" className="p-2 text-left font-medium">
                          Identificação
                        </th>
                        <th scope="col" className="p-2 text-left font-medium">
                          Proprietário
                        </th>
                        <th scope="col" className="p-2 text-right font-medium">
                          Permilagem
                        </th>
                        <th scope="col" className="p-2 text-left font-medium">
                          NIF
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr key={l.numeroLinha} className="border-t border-border">
                          <td className="p-2">{l.identificacao}</td>
                          <td className="p-2">{l.proprietario}</td>
                          <td className="p-2 text-right">{l.permilagem.toFixed(2)} ‰</td>
                          <td className="p-2 text-muted-foreground">{l.nif ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={criar} disabled={pending || !podeCriar}>
            {pending
              ? 'A criar...'
              : `Criar ${linhas.length > 0 ? linhas.length : ''} ${
                  linhas.length === 1 ? 'fração' : 'frações'
                }`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
