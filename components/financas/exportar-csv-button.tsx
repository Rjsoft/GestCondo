'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

type MovimentoCsv = {
  data: string | Date
  tipo: string
  categoria: string
  descricao: string
  valor: string | number
  pago: boolean
  destino: string
}

function escaparCampo(valor: string) {
  // CSV básico: só precisa de aspas quando o campo tem vírgula, aspas ou
  // quebra de linha — evita "sobre-envolver" tudo em aspas sem necessidade.
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

export function ExportarCsvButton({ movimentos }: { movimentos: MovimentoCsv[] }) {
  const exportar = () => {
    const cabecalho = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (€)', 'Estado', 'Destino']
    const linhas = movimentos.map((m) => {
      const data = new Date(m.data).toLocaleDateString('pt-PT')
      const tipo = m.tipo === 'receita' ? 'Receita' : 'Despesa'
      const estado = m.tipo === 'receita' ? (m.pago ? 'Pago' : 'Pendente') : ''
      const destino = m.destino === 'reserva' ? 'Fundo de reserva' : 'Conta corrente'
      return [data, tipo, m.categoria, m.descricao, String(m.valor).replace('.', ','), estado, destino]
        .map((campo) => escaparCampo(campo))
        .join(',')
    })
    // BOM (﻿) para o Excel reconhecer o ficheiro como UTF-8 e mostrar
    // acentos/€ corretamente em vez de caracteres estranhos.
    const conteudo = '﻿' + [cabecalho.join(','), ...linhas].join('\r\n')
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financas-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={exportar} disabled={movimentos.length === 0}>
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  )
}
