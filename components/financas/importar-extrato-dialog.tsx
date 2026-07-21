'use client'

import { useState, useTransition } from 'react'
import { importarLinhas } from '@/app/actions/extrato'
import { mapearLinhas, parseCsv, type MapeamentoColunas } from '@/lib/extrato'
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
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

const SEM_COLUNA = '__nenhuma__'

const DELIMITADOR_LABEL: Record<string, string> = {
  ',': 'Vírgula (,)',
  ';': 'Ponto e vírgula (;)',
  '\t': 'Tabulador',
}

const MODO_LABEL: Record<string, string> = {
  valorUnico: 'Uma coluna de Valor (positivo/negativo)',
  debitoCredito: 'Colunas separadas de Débito e Crédito',
}

function colunaLabel(value: string | null) {
  if (value === null || value === SEM_COLUNA) return 'Selecione'
  return `Coluna ${Number(value) + 1}`
}

export function ImportarExtratoDialog() {
  const [open, setOpen] = useState(false)
  const [passo, setPasso] = useState<1 | 2>(1)
  const [delimitador, setDelimitador] = useState(',')
  const [temCabecalho, setTemCabecalho] = useState(true)
  const [linhasBrutas, setLinhasBrutas] = useState<string[][]>([])
  const [modo, setModo] = useState<'valorUnico' | 'debitoCredito'>('valorUnico')
  const [colData, setColData] = useState(SEM_COLUNA)
  const [colDescricao, setColDescricao] = useState(SEM_COLUNA)
  const [colValor, setColValor] = useState(SEM_COLUNA)
  const [colDebito, setColDebito] = useState(SEM_COLUNA)
  const [colCredito, setColCredito] = useState(SEM_COLUNA)
  const [pending, startTransition] = useTransition()

  const reset = () => {
    setPasso(1)
    setLinhasBrutas([])
    setColData(SEM_COLUNA)
    setColDescricao(SEM_COLUNA)
    setColValor(SEM_COLUNA)
    setColDebito(SEM_COLUNA)
    setColCredito(SEM_COLUNA)
  }

  const onFicheiroSelecionado = async (file: File) => {
    const texto = await file.text()
    const linhas = parseCsv(texto, delimitador)
    if (linhas.length === 0) {
      toast.error('Não foi possível ler nenhuma linha deste ficheiro')
      return
    }
    setLinhasBrutas(temCabecalho ? linhas.slice(1) : linhas)
    setPasso(2)
  }

  const numColunas = linhasBrutas[0]?.length ?? 0
  const opcoesColuna = Array.from({ length: numColunas }, (_, i) => i)

  const mapeamentoValido =
    colData !== SEM_COLUNA &&
    colDescricao !== SEM_COLUNA &&
    (modo === 'valorUnico'
      ? colValor !== SEM_COLUNA
      : colDebito !== SEM_COLUNA && colCredito !== SEM_COLUNA)

  const confirmar = () => {
    if (!mapeamentoValido) return

    const mapeamento: MapeamentoColunas =
      modo === 'valorUnico'
        ? {
            modo: 'valorUnico',
            colData: Number(colData),
            colDescricao: Number(colDescricao),
            colValor: Number(colValor),
          }
        : {
            modo: 'debitoCredito',
            colData: Number(colData),
            colDescricao: Number(colDescricao),
            colDebito: Number(colDebito),
            colCredito: Number(colCredito),
          }

    startTransition(async () => {
      try {
        const mapeadas = mapearLinhas(linhasBrutas, mapeamento)
        const paraEnviar = mapeadas.map((l) => ({
          data: l.data.toISOString(),
          descricao: l.descricao,
          valor: l.valor,
        }))
        const { importadas, duplicadas } = await importarLinhas(paraEnviar)
        toast.success(
          `${importadas} linha(s) importada(s)` +
            (duplicadas > 0 ? ` (${duplicadas} já existente(s), ignorada(s))` : ''),
        )
        setOpen(false)
        reset()
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : 'Erro ao importar — verifique o mapeamento das colunas',
        )
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="h-4 w-4" />
        Importar extrato
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar extrato bancário</DialogTitle>
          <DialogDescription>
            Carregue o ficheiro CSV exportado do seu banco. Não assumimos o formato de
            nenhum banco em particular — indica a seguir a que corresponde cada coluna.
          </DialogDescription>
        </DialogHeader>

        {passo === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ficheiro">Ficheiro CSV</Label>
              <Input
                id="ficheiro"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onFicheiroSelecionado(file)
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Delimitador</Label>
                <Select value={delimitador} onValueChange={(v) => v && setDelimitador(v)}>
                  <SelectTrigger>
                    <SelectValue>
                      {(value: string | null) => (value ? DELIMITADOR_LABEL[value] : '')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=",">Vírgula (,)</SelectItem>
                    <SelectItem value=";">Ponto e vírgula (;)</SelectItem>
                    <SelectItem value="\t">Tabulador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  id="temCabecalho"
                  type="checkbox"
                  checked={temCabecalho}
                  onChange={(e) => setTemCabecalho(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="temCabecalho" className="font-normal">
                  A primeira linha é um cabeçalho
                </Label>
              </div>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="flex flex-col gap-4">
            <div className="max-h-40 overflow-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {opcoesColuna.map((i) => (
                      <TableHead key={i}>Coluna {i + 1}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasBrutas.slice(0, 5).map((linha, i) => (
                    <TableRow key={i}>
                      {linha.map((campo, j) => (
                        <TableCell key={j} className="max-w-[10rem] truncate">
                          {campo}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Coluna Data</Label>
                <Select value={colData} onValueChange={(v) => v && setColData(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
                      {(value: string | null) => colunaLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesColuna.map((i) => (
                      <SelectItem key={i} value={String(i)}>
                        Coluna {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Coluna Descrição</Label>
                <Select value={colDescricao} onValueChange={(v) => v && setColDescricao(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
                      {(value: string | null) => colunaLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesColuna.map((i) => (
                      <SelectItem key={i} value={String(i)}>
                        Coluna {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>O extrato tem</Label>
              <Select value={modo} onValueChange={(v) => v && setModo(v as typeof modo)}>
                <SelectTrigger>
                  <SelectValue>{(value: string | null) => (value ? MODO_LABEL[value] : '')}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valorUnico">Uma coluna de Valor (positivo/negativo)</SelectItem>
                  <SelectItem value="debitoCredito">Colunas separadas de Débito e Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modo === 'valorUnico' ? (
              <div className="flex flex-col gap-2">
                <Label>Coluna Valor</Label>
                <Select value={colValor} onValueChange={(v) => v && setColValor(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
                      {(value: string | null) => colunaLabel(value)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesColuna.map((i) => (
                      <SelectItem key={i} value={String(i)}>
                        Coluna {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Coluna Débito</Label>
                  <Select value={colDebito} onValueChange={(v) => v && setColDebito(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione">
                      {(value: string | null) => colunaLabel(value)}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesColuna.map((i) => (
                        <SelectItem key={i} value={String(i)}>
                          Coluna {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Coluna Crédito</Label>
                  <Select value={colCredito} onValueChange={(v) => v && setColCredito(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione">
                      {(value: string | null) => colunaLabel(value)}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {opcoesColuna.map((i) => (
                        <SelectItem key={i} value={String(i)}>
                          Coluna {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {passo === 2 && (
            <Button variant="outline" onClick={reset} disabled={pending}>
              Voltar
            </Button>
          )}
          {passo === 2 && (
            <Button onClick={confirmar} disabled={!mapeamentoValido || pending}>
              {pending ? 'A importar...' : `Importar ${linhasBrutas.length} linha(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
