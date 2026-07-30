'use client'

import { useMemo, useState, useTransition } from 'react'
import { ratearDespesaComum } from '@/app/actions/financas'
import { calcularRateioValor, type CriterioRateio } from '@/lib/rateio'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEuro } from '@/lib/format'
import { Split } from 'lucide-react'
import { toast } from 'sonner'

type FracaoOpcao = { id: number; identificacao: string; permilagem: number; isentaElevador: boolean }
type PontoAssembleiaOpcao = { id: number; titulo: string; assembleiaData: string }

const SEM_DELIBERACAO = '__sem_deliberacao__'

export function DividirDespesaDialog({
  fracoes,
  pontosAssembleia,
  criterioRateio,
}: {
  fracoes: FracaoOpcao[]
  pontosAssembleia: PontoAssembleiaOpcao[]
  criterioRateio: CriterioRateio
}) {
  const [open, setOpen] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [isentarElevador, setIsentarElevador] = useState(false)
  const [assembleiaPontoId, setAssembleiaPontoId] = useState(SEM_DELIBERACAO)
  const [pending, startTransition] = useTransition()

  const identificacaoPorId = useMemo(
    () => new Map(fracoes.map((f) => [f.id, f.identificacao])),
    [fracoes],
  )

  const valorNumero = Number(valorTotal.replace(',', '.'))
  let preview: { fracaoId: number; valor: number }[] = []
  let erroPreview: string | null = null
  if (valorNumero > 0) {
    try {
      preview = calcularRateioValor(fracoes, valorNumero, isentarElevador, criterioRateio)
    } catch (e) {
      erroPreview = e instanceof Error ? e.message : 'Erro ao calcular o rateio'
    }
  }
  const totalPreview = preview.reduce((s, f) => s + f.valor, 0)

  const onSubmit = (formData: FormData) => {
    formData.set('isentarElevador', String(isentarElevador))
    if (assembleiaPontoId !== SEM_DELIBERACAO) {
      formData.set('assembleiaPontoId', assembleiaPontoId)
    }
    startTransition(async () => {
      try {
        const { quantidade, total } = await ratearDespesaComum(formData)
        toast.success(`Dívida lançada em ${quantidade} fração(ões): ${formatEuro(total)}`)
        setOpen(false)
        setCategoria('')
        setDescricao('')
        setValorTotal('')
        setIsentarElevador(false)
        setAssembleiaPontoId(SEM_DELIBERACAO)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao dividir despesa')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Split className="h-4 w-4" />
        Dividir despesa por frações
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dividir despesa por frações</DialogTitle>
          <DialogDescription>
            Divide uma despesa extraordinária (ex: pintura da fachada) pelas
            frações {criterioRateio === 'partes_iguais' ? 'em partes iguais' : 'por permilagem'},
            criando uma dívida (quota extraordinária) por fração. Não lança a
            despesa em si — o pagamento ao fornecedor continua a
            registar-se à parte, como hoje.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                name="categoria"
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Obras extraordinárias"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="valorTotal">Valor total (€)</Label>
              <Input
                id="valorTotal"
                name="valorTotal"
                type="number"
                step="0.01"
                min="0"
                required
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              name="descricao"
              rows={2}
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pintura da fachada — rateio por permilagem"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="data">Data (opcional)</Label>
              <Input id="data" name="data" type="date" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Deliberação de assembleia (opcional)</Label>
              <Select
                value={assembleiaPontoId}
                onValueChange={(value) => value && setAssembleiaPontoId(value)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(v: string | null) => {
                      if (v === SEM_DELIBERACAO || v == null) return 'Sem ligação'
                      const p = pontosAssembleia.find((p) => String(p.id) === v)
                      return p ? p.titulo : 'Sem ligação'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_DELIBERACAO}>Sem ligação</SelectItem>
                  {pontosAssembleia.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={isentarElevador}
              onCheckedChange={(v) => setIsentarElevador(v === true)}
            />
            Despesa do elevador — excluir frações isentas do rateio
          </label>

          {valorNumero > 0 && (
            erroPreview ? (
              <p className="text-sm text-destructive">{erroPreview}</p>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fração</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((f) => (
                        <TableRow key={f.fracaoId}>
                          <TableCell className="font-medium">
                            {identificacaoPorId.get(f.fracaoId) ?? `Fração #${f.fracaoId}`}
                          </TableCell>
                          <TableCell className="text-right">{formatEuro(f.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Total a lançar: {formatEuro(totalPreview)}
                </p>
              </>
            )
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={pending || valorNumero <= 0 || !!erroPreview || !categoria || !descricao}
            >
              {pending ? 'A lançar...' : 'Confirmar e dividir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
