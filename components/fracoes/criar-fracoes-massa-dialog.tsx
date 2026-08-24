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
import {
  parsearFracoes,
  planearImportacaoFracoes,
  validarConjuntoFracoes,
  type FracaoExistente,
} from '@/lib/fracoes-massa'
import { Checkbox } from '@/components/ui/checkbox'
import { MODELO_FRACOES } from '@/lib/modelo-csv'
import { ModeloCsvActions } from '@/components/ui/modelo-csv-actions'
import { ListPlus } from 'lucide-react'
import { toast } from 'sonner'

const EXEMPLO = `1ºDto; Maria Silva; 83,33; 123456789; maria@exemplo.pt; 910000000
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
  fracoesExistentes,
  somaPermilagemExistente,
}: {
  fracoesExistentes: FracaoExistente[]
  somaPermilagemExistente: number
}) {
  const [open, setOpen] = useState(false)
  const [texto, setTexto] = useState('')
  const [atualizarExistentes, setAtualizarExistentes] = useState(false)
  const [pending, startTransition] = useTransition()

  const identificacoesExistentes = useMemo(
    () => fracoesExistentes.map((f) => f.identificacao),
    [fracoesExistentes],
  )

  const { linhas, erros } = useMemo(() => parsearFracoes(texto), [texto])
  const errosConjunto = useMemo(
    () =>
      linhas.length > 0
        ? validarConjuntoFracoes(linhas, identificacoesExistentes, somaPermilagemExistente, {
            atualizarExistentes,
          })
        : [],
    [linhas, identificacoesExistentes, somaPermilagemExistente, atualizarExistentes],
  )

  const plano = useMemo(
    () =>
      atualizarExistentes
        ? planearImportacaoFracoes(linhas, fracoesExistentes)
        : { aCriar: linhas, aAtualizar: [], semAlteracao: [] },
    [linhas, fracoesExistentes, atualizarExistentes],
  )

  const somaNovas = plano.aCriar.reduce((s, l) => s + l.permilagem, 0)
  const haTrabalho = plano.aCriar.length > 0 || plano.aAtualizar.length > 0
  const podeCriar = haTrabalho && erros.length === 0 && errosConjunto.length === 0

  const criar = () => {
    startTransition(async () => {
      try {
        const r = await criarFracoesEmMassa(texto, { atualizarExistentes })
        const partes = []
        if (r.criadas > 0) partes.push(`${r.criadas} ${r.criadas === 1 ? 'criada' : 'criadas'}`)
        if (r.atualizadas > 0)
          partes.push(`${r.atualizadas} ${r.atualizadas === 1 ? 'atualizada' : 'atualizadas'}`)
        if (r.semAlteracao > 0) partes.push(`${r.semAlteracao} sem alterações`)
        toast.success(`Frações: ${partes.join(', ')}`)
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

        <ModeloCsvActions modelo={MODELO_FRACOES} onTextoCarregado={setTexto} />

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

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={atualizarExistentes}
              onCheckedChange={(valor) => setAtualizarExistentes(valor === true)}
            />
            Atualizar as frações que já existem, preenchendo o que estiver em falta
          </label>
          <p className="text-xs text-muted-foreground">
            Sem isto, uma fração que já exista dá erro. Com isto, é aproveitada para
            preencher <strong>apenas os campos vazios</strong>{' '}
            (NIF, email, telefone) — nunca substitui informação que já lá esteja. A permilagem e o proprietário
            nunca são alterados por aqui: a permilagem muda o cálculo de todas as quotas, e
            mudar de proprietário faz-se em &ldquo;Registar transmissão&rdquo;, que guarda
            o histórico.
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

            {plano.aAtualizar.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">
                  {plano.aAtualizar.length === 1
                    ? 'Vai ser atualizada 1 fração já existente:'
                    : `Vão ser atualizadas ${plano.aAtualizar.length} frações já existentes:`}
                </p>
                <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2 text-sm">
                  {plano.aAtualizar.map((a) => (
                    <li key={a.id}>
                      <span className="font-medium">{a.identificacao}</span>
                      <span className="text-muted-foreground">
                        {' — '}
                        {a.campos.map((c) => `${c.label}: ${c.novo}`).join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">
                  Só aparecem aqui campos que estavam vazios. Nada do que já estava
                  preenchido é tocado.
                </p>
              </div>
            )}

            {plano.semAlteracao.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {plano.semAlteracao.length}{' '}
                {plano.semAlteracao.length === 1 ? 'fração já existe' : 'frações já existem'}{' '}
                e o ficheiro não traz nada de novo ({plano.semAlteracao.join(', ')}) — ficam
                como estão.
              </p>
            )}

            {plano.aCriar.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">
                  Vão ser criadas {plano.aCriar.length}{' '}
                  {plano.aCriar.length === 1 ? 'fração' : 'frações'}, com um total de{' '}
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
                      {plano.aCriar.map((l) => (
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
              ? 'A gravar...'
              : plano.aAtualizar.length > 0 && plano.aCriar.length > 0
                ? `Criar ${plano.aCriar.length} e atualizar ${plano.aAtualizar.length}`
                : plano.aAtualizar.length > 0
                  ? `Atualizar ${plano.aAtualizar.length} ${plano.aAtualizar.length === 1 ? 'fração' : 'frações'}`
                  : `Criar ${plano.aCriar.length} ${plano.aCriar.length === 1 ? 'fração' : 'frações'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
