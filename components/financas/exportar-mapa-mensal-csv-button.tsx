'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type LinhaMapaMensal = {
  fracaoId: number
  letra: string | null
  identificacao: string
  proprietario: string
  meses: { mes: number; valor: number }[]
  totalAno: number
}

function escaparCampo(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

// Formato inspirado no mapa "Quotas" das administrações externas (fração
// em linhas, meses em colunas, total à direita) — ver Exemplo MBD.pdf.
export function ExportarMapaMensalCsvButton({ ano, linhas }: { ano: number; linhas: LinhaMapaMensal[] }) {
  const exportar = () => {
    const cabecalho = ['Fração', 'Proprietário', ...MESES, 'Total']
    const conteudoLinhas = linhas.map((l) => {
      const identificacao = l.letra ? `${l.letra} — ${l.identificacao}` : l.identificacao
      const valoresPorMes = MESES.map((_, mes) => {
        const celula = l.meses.find((c) => c.mes === mes)
        return celula ? String(celula.valor.toFixed(2)).replace('.', ',') : ''
      })
      return [identificacao, l.proprietario, ...valoresPorMes, String(l.totalAno.toFixed(2)).replace('.', ',')]
        .map((campo) => escaparCampo(campo))
        .join(',')
    })
    const conteudo = '﻿' + [cabecalho.join(','), ...conteudoLinhas].join('\r\n')
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mapa-mensal-quotas-${ano}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={exportar} disabled={linhas.length === 0}>
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  )
}
