'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { getMapaMensalQuotas } from '@/app/actions/financas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MovimentoActions } from '@/components/financas/movimento-actions'
import { ExportarMapaMensalCsvButton } from '@/components/financas/exportar-mapa-mensal-csv-button'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { formatEuro, formatData } from '@/lib/format'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type Movimento = {
  id: number
  data: Date
  categoria: string
  descricao: string
  tipo: string
  pago: boolean
  valor: string
  destino: string
  meioPagamento: string | null
  dataLiquidacao: Date | null
  fracaoId: number | null
  fornecedorId: number | null
  fornecedorNome?: string | null
}

type CelulaMapaMensal = {
  mes: number
  valor: number
  estado: 'vazio' | 'pago' | 'parcial' | 'pendente'
  movimentos: Movimento[]
}

type LinhaMapaMensal = {
  fracaoId: number
  letra: string | null
  identificacao: string
  proprietario: string
  meses: CelulaMapaMensal[]
  totalAno: number
  totalPagoAno: number
}

const ESTADO_CLASSE: Record<CelulaMapaMensal['estado'], string> = {
  vazio: 'text-muted-foreground',
  pago: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  parcial: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  pendente: 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300',
}

export function MapaMensalTab({
  dadosIniciais,
  anoInicial,
  fracoes,
  fornecedores,
  isAdmin,
}: {
  dadosIniciais: LinhaMapaMensal[]
  anoInicial: number
  fracoes: { id: number; identificacao: string }[]
  fornecedores: { id: number; nome: string }[]
  isAdmin: boolean
}) {
  const [ano, setAno] = useState(anoInicial)
  const [dados, setDados] = useState(dadosIniciais)
  const [pending, startTransition] = useTransition()
  const [celula, setCelula] = useState<{ linha: LinhaMapaMensal; mes: number } | null>(null)

  const mudarAno = (novoAno: number) => {
    setAno(novoAno)
    startTransition(async () => {
      setDados(await getMapaMensalQuotas(novoAno))
    })
  }

  // Fechar o popup da célula é o momento em que se sabe que o utilizador
  // terminou de editar/marcar pago/eliminar através do MovimentoActions lá
  // dentro — recarrega a grelha para não ficar com valores desatualizados
  // (este componente guarda os dados em estado próprio, não é redesenhado
  // automaticamente pelo revalidatePath do servidor).
  const fecharCelula = () => {
    setCelula(null)
    startTransition(async () => {
      setDados(await getMapaMensalQuotas(ano))
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => mudarAno(ano - 1)} disabled={pending}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-16 text-center font-serif text-lg font-bold text-foreground">
            {ano}
          </span>
          <Button variant="outline" size="icon" onClick={() => mudarAno(ano + 1)} disabled={pending}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href={`/financas/mapa-mensal?ano=${ano}`} />}>
            <FileText className="h-4 w-4" />
            Imprimir / PDF
          </Button>
          <ExportarMapaMensalCsvButton ano={ano} linhas={dados} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fração</TableHead>
                {MESES.map((mes) => (
                  <TableHead key={mes} className="text-right">
                    {mes}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="py-10 text-center text-muted-foreground">
                    Ainda não existem frações registadas.
                  </TableCell>
                </TableRow>
              )}
              {dados.map((linha) => (
                <TableRow key={linha.fracaoId}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {linha.letra ? `${linha.letra} — ${linha.identificacao}` : linha.identificacao}
                  </TableCell>
                  {linha.meses.map((c) => (
                    <TableCell key={c.mes} className="p-1 text-right">
                      {c.estado === 'vazio' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCelula({ linha, mes: c.mes })}
                          className={`w-full rounded px-1.5 py-1 text-right text-xs font-medium ${ESTADO_CLASSE[c.estado]}`}
                        >
                          {formatEuro(c.valor)}
                        </button>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium">{formatEuro(linha.totalAno)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={celula !== null} onOpenChange={(open) => !open && fecharCelula()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {celula &&
                `${celula.linha.letra ? `${celula.linha.letra} — ` : ''}${celula.linha.identificacao} — ${MESES[celula.mes]}/${ano}`}
            </DialogTitle>
            <DialogDescription>Movimentos lançados nesta fração e mês.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {celula?.linha.meses[celula.mes].movimentos.map((mv) => (
              <div
                key={mv.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{mv.categoria}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {mv.descricao} · {formatData(mv.data)} · {mv.pago ? 'Pago' : 'Pendente'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium text-foreground">{formatEuro(Number(mv.valor))}</span>
                  {isAdmin && (
                    <MovimentoActions
                      id={mv.id}
                      pago={mv.pago}
                      tipo={mv.tipo}
                      categoria={mv.categoria}
                      descricao={mv.descricao}
                      valor={mv.valor}
                      data={mv.data}
                      destino={mv.destino}
                      fracaoId={mv.fracaoId}
                      fornecedorId={mv.fornecedorId}
                      fracoes={fracoes}
                      fornecedores={fornecedores}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
