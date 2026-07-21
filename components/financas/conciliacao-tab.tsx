'use client'

import { useMemo, useState, useTransition } from 'react'
import { conciliarLinha, desfazerConciliacao, ignorarLinha } from '@/app/actions/extrato'
import { sugerirCorrespondencias } from '@/lib/extrato'
import { ImportarExtratoDialog } from '@/components/financas/importar-extrato-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { formatEuro, formatData } from '@/lib/format'
import { EyeOff } from 'lucide-react'
import { toast } from 'sonner'

type LinhaExtrato = {
  id: number
  data: Date
  descricao: string
  valor: string
}

type Movimento = {
  id: number
  data: Date
  valor: string
  tipo: string
  categoria: string
  descricao: string
}

type LinhaConciliada = LinhaExtrato & {
  movimento: { id: number; categoria: string; descricao: string } | null
}

export function ConciliacaoTab({
  linhas,
  movimentos,
  conciliadas,
  isAdmin,
}: {
  linhas: LinhaExtrato[]
  movimentos: Movimento[]
  conciliadas: LinhaConciliada[]
  isAdmin: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [selecoes, setSelecoes] = useState<Record<number, string>>({})

  const movimentosComSinal = useMemo(
    () =>
      movimentos.map((m) => ({
        ...m,
        valorAssinado: m.tipo === 'despesa' ? -Number(m.valor) : Number(m.valor),
      })),
    [movimentos],
  )

  const sugestoesPorLinha = useMemo(() => {
    const sugestoes = sugerirCorrespondencias(
      linhas.map((l) => ({ data: l.data, valor: Number(l.valor) })),
      movimentosComSinal.map((m) => ({ id: m.id, data: m.data, valor: m.valorAssinado })),
    )
    const mapa = new Map<number, number>()
    sugestoes.forEach((s) => mapa.set(s.linhaIndex, s.movimentoId))
    return mapa
  }, [linhas, movimentosComSinal])

  const conciliar = (linhaId: number, linhaIndex: number) => {
    // Cai para a sugestão automática se o utilizador nunca tiver interagido
    // com o select (a sugestão fica visível no ecrã, mas só passa a existir
    // no estado `selecoes` quando há uma escolha explícita).
    const selecionado = selecoes[linhaId] ?? sugestoesPorLinha.get(linhaIndex)
    const movimentoId = Number(selecionado)
    if (!movimentoId) {
      toast.error('Selecione o movimento correspondente')
      return
    }
    startTransition(async () => {
      try {
        await conciliarLinha(linhaId, movimentoId)
        toast.success('Linha conciliada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao conciliar')
      }
    })
  }

  const ignorar = (linhaId: number) => {
    startTransition(async () => {
      try {
        await ignorarLinha(linhaId, true)
        toast.success('Linha ignorada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao ignorar')
      }
    })
  }

  const desfazer = (linhaId: number) => {
    startTransition(async () => {
      try {
        await desfazerConciliacao(linhaId)
        toast.success('Conciliação desfeita')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao desfazer')
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Importe o extrato do banco (CSV) e concilie cada movimento bancário com o
          respetivo lançamento na app. Abrange só a conta corrente — o fundo de reserva
          fica de fora, por estar normalmente numa conta separada.
        </p>
        {isAdmin && <ImportarExtratoDialog />}
      </div>

      <div>
        <h3 className="mb-2 font-serif text-lg font-semibold">
          Linhas do extrato por conciliar ({linhas.length})
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {isAdmin && <TableHead>Conciliar com</TableHead>}
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhas.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 5 : 3}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Sem linhas por conciliar. Importe um extrato para começar.
                    </TableCell>
                  </TableRow>
                )}
                {linhas.map((linha, index) => {
                  const sugestao = sugestoesPorLinha.get(index)
                  const valorLinha = Number(linha.valor)
                  return (
                    <TableRow key={linha.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatData(linha.data)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{linha.descricao}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          valorLinha >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatEuro(valorLinha)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Select
                            value={selecoes[linha.id] ?? (sugestao ? String(sugestao) : '')}
                            onValueChange={(value) =>
                              value && setSelecoes((s) => ({ ...s, [linha.id]: value }))
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Selecione um movimento">
                                {(value: string | null) => {
                                  const m = movimentosComSinal.find((mv) => String(mv.id) === value)
                                  if (!m) return 'Selecione um movimento'
                                  return `${formatData(m.data)} — ${m.categoria} (${formatEuro(m.valorAssinado)})`
                                }}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {movimentosComSinal.map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  {formatData(m.data)} — {m.categoria} ({formatEuro(m.valorAssinado)})
                                  {m.id === sugestao ? ' ✓ sugerido' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                      {isAdmin && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() => conciliar(linha.id, index)}
                            >
                              Conciliar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Ignorar (sem correspondência esperada)"
                              disabled={pending}
                              onClick={() => ignorar(linha.id)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-2 font-serif text-lg font-semibold">
          Movimentos por conciliar ({movimentos.length})
        </h3>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      Sem movimentos pagos por conciliar.
                    </TableCell>
                  </TableRow>
                )}
                {movimentosComSinal.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatData(m.data)}
                    </TableCell>
                    <TableCell className="font-medium">{m.categoria}</TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground sm:table-cell">
                      {m.descricao}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        m.valorAssinado >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatEuro(m.valorAssinado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {conciliadas.length > 0 && (
        <div>
          <h3 className="mb-2 font-serif text-lg font-semibold">
            Já conciliadas ({conciliadas.length})
          </h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Extrato</TableHead>
                    <TableHead>Movimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    {isAdmin && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conciliadas.map((linha) => (
                    <TableRow key={linha.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatData(linha.data)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{linha.descricao}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {linha.movimento
                          ? `${linha.movimento.categoria} — ${linha.movimento.descricao}`
                          : '—'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          Number(linha.valor) >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatEuro(Number(linha.valor))}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => desfazer(linha.id)}
                          >
                            Desfazer
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
