'use client'

import { useMemo, useState, useTransition } from 'react'
import { criarSaldosIniciaisEmMassa } from '@/app/actions/financas'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatEuro } from '@/lib/format'
import { MODELO_SALDOS } from '@/lib/modelo-csv'
import { ModeloCsvActions } from '@/components/ui/modelo-csv-actions'
import { parsearSaldosIniciais, validarConjuntoSaldos } from '@/lib/saldos-iniciais'
import { ListPlus } from 'lucide-react'
import { toast } from 'sonner'

const EXEMPLO = `1ºDto; 125,50
1ºEsq; 340,00
2ºDto; 1.234,56`

/**
 * Abertura de saldos iniciais por fração (`FUNCTIONAL_GAPS.md` secção 11):
 * um condomínio que muda para o GestCondo traz dívidas acumuladas, e
 * lançá-las uma a uma em "Novo movimento" era o passo mais penoso da
 * migração.
 *
 * A pré-visualização usa as mesmas funções puras do servidor
 * (`lib/saldos-iniciais.ts`), para os erros aparecerem enquanto se escreve.
 * O servidor revalida tudo — isto é conveniência, não confiança.
 */
export function SaldosIniciaisMassaDialog({
  identificacoesFracoes,
}: {
  identificacoesFracoes: string[]
}) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [data, setData] = useState('')
  const [descricao, setDescricao] = useState('')
  const [pending, startTransition] = useTransition()

  const { linhas, erros } = useMemo(() => parsearSaldosIniciais(texto), [texto])
  const errosConjunto = useMemo(
    () => (linhas.length > 0 ? validarConjuntoSaldos(linhas, identificacoesFracoes) : []),
    [linhas, identificacoesFracoes],
  )

  const total = linhas.reduce((s, l) => s + l.valor, 0)
  const podeCriar =
    linhas.length > 0 && erros.length === 0 && errosConjunto.length === 0 && data !== ''

  const lancar = () => {
    startTransition(async () => {
      try {
        const r = await criarSaldosIniciaisEmMassa(texto, data, descricao)
        toast.success(
          `${r.criados} ${r.criados === 1 ? 'saldo lançado' : 'saldos lançados'} — ${formatEuro(r.total)} em dívida`,
        )
        setTexto('')
        setDescricao('')
        setOpen(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao lançar os saldos iniciais')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ListPlus className="h-4 w-4" />
        Abrir saldos iniciais
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Abrir saldos iniciais</DialogTitle>
          <DialogDescription>
            Para trazer as dívidas que o condomínio já tinha antes de começar a usar a
            aplicação. Escreva ou cole uma linha por fração, com a identificação e o valor
            em dívida separados por ponto e vírgula: <strong>1ºDto; 125,50</strong>. Se
            copiar de uma folha de cálculo, cole diretamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1">
              <Label htmlFor="saldos-data">Data a que os saldos dizem respeito</Label>
              <Input
                id="saldos-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                aria-describedby="saldos-data-ajuda"
              />
              <p id="saldos-data-ajuda" className="mt-1 text-xs text-muted-foreground">
                Normalmente 31 de dezembro do ano anterior.
              </p>
            </div>
            <div className="flex-1">
              <Label htmlFor="saldos-descricao">Descrição (opcional)</Label>
              <Input
                id="saldos-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Saldo em dívida a 31/12/2025"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Se deixar vazio, é usada a data acima.
              </p>
            </div>
          </div>

          <ModeloCsvActions modelo={MODELO_SALDOS} onTextoCarregado={setTexto} />

          <div>
            <Label htmlFor="saldos-lista">Frações e valores em dívida</Label>
            <textarea
              id="saldos-lista"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={7}
              spellCheck={false}
              placeholder={EXEMPLO}
              aria-describedby="saldos-lista-ajuda"
              className="mt-1 w-full rounded-md border border-input bg-background p-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p id="saldos-lista-ajuda" className="mt-1 text-xs text-muted-foreground">
              A identificação tem de estar escrita como em &ldquo;Frações&rdquo;. Cada
              linha fica registada como uma quota por pagar dessa fração — com data, autor
              e histórico, como qualquer outro movimento.
            </p>
          </div>
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
                  Vão ser lançados {linhas.length}{' '}
                  {linhas.length === 1 ? 'saldo' : 'saldos'}, num total de{' '}
                  {formatEuro(total)} em dívida:
                </p>
                <div className="max-h-56 overflow-y-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <caption className="sr-only">
                      Pré-visualização dos saldos iniciais a lançar
                    </caption>
                    <thead className="bg-muted/50">
                      <tr>
                        <th scope="col" className="p-2 text-left font-medium">
                          Fração
                        </th>
                        <th scope="col" className="p-2 text-right font-medium">
                          Em dívida
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr key={l.numeroLinha} className="border-t border-border">
                          <td className="p-2">{l.identificacao}</td>
                          <td className="p-2 text-right">{formatEuro(l.valor)}</td>
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
          <Button type="button" onClick={lancar} disabled={pending || !podeCriar}>
            {pending ? 'A lançar...' : 'Lançar saldos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
