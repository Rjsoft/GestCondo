'use client'

import { useState, useTransition } from 'react'
import { atualizarCondominio } from '@/app/actions/condominio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const CRITERIO_RATEIO_LABEL: Record<string, string> = {
  permilagem: 'Por permilagem (regra geral)',
  partes_iguais: 'Partes iguais',
}

export function EditarCondominioForm({
  nome,
  morada,
  nif,
  numeroMatricial,
  conservatoriaRegistoPredial,
  licencaHabitacao,
  projetoArquiteto,
  areaConstrucao,
  criterioRateio,
}: {
  nome: string
  morada: string | null
  nif: string | null
  numeroMatricial: string | null
  conservatoriaRegistoPredial: string | null
  licencaHabitacao: string | null
  projetoArquiteto: string | null
  areaConstrucao: string | null
  criterioRateio: string
}) {
  const [pending, startTransition] = useTransition()
  const [criterio, setCriterio] = useState(criterioRateio)

  const onSubmit = (formData: FormData) => {
    formData.set('criterioRateio', criterio)
    startTransition(async () => {
      try {
        await atualizarCondominio(formData)
        toast.success('Dados do condomínio atualizados')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao guardar')
      }
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nome">Nome do condomínio</Label>
        <Input id="nome" name="nome" defaultValue={nome} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="morada">Morada</Label>
        <Input id="morada" name="morada" defaultValue={morada ?? ''} placeholder="Opcional" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nif">NIF do condomínio</Label>
        <Input id="nif" name="nif" defaultValue={nif ?? ''} placeholder="Opcional — aparece nos recibos" />
      </div>

      <h3 className="mt-2 font-serif text-sm font-bold text-foreground">Dados formais do edifício</h3>

      <div className="flex flex-col gap-2">
        <Label htmlFor="numeroMatricial">Número matricial</Label>
        <Input
          id="numeroMatricial"
          name="numeroMatricial"
          defaultValue={numeroMatricial ?? ''}
          placeholder="Opcional"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="conservatoriaRegistoPredial">Conservatória do registo predial</Label>
        <Input
          id="conservatoriaRegistoPredial"
          name="conservatoriaRegistoPredial"
          defaultValue={conservatoriaRegistoPredial ?? ''}
          placeholder="Opcional — conservatória e número de registo"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="licencaHabitacao">Licença de habitação</Label>
        <Input
          id="licencaHabitacao"
          name="licencaHabitacao"
          defaultValue={licencaHabitacao ?? ''}
          placeholder="Opcional — número e data"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="projetoArquiteto">Projeto / arquiteto</Label>
        <Input
          id="projetoArquiteto"
          name="projetoArquiteto"
          defaultValue={projetoArquiteto ?? ''}
          placeholder="Opcional"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="areaConstrucao">Área de construção (m²)</Label>
        <Input
          id="areaConstrucao"
          name="areaConstrucao"
          type="number"
          step="0.01"
          min="0"
          defaultValue={areaConstrucao ?? ''}
          placeholder="Opcional"
        />
      </div>

      <h3 className="mt-2 font-serif text-sm font-bold text-foreground">Quotas</h3>

      <div className="flex flex-col gap-2">
        <Label>Critério de rateio das quotas e despesas comuns</Label>
        <Select value={criterio} onValueChange={(value) => value && setCriterio(value)}>
          <SelectTrigger>
            <SelectValue>{(v: string | null) => (v ? CRITERIO_RATEIO_LABEL[v] : '')}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="permilagem">Por permilagem (regra geral)</SelectItem>
            <SelectItem value="partes_iguais">Partes iguais</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          &ldquo;Partes iguais&rdquo; só é válido se estiver previsto no regulamento de
          condomínio, aprovado sem oposição por maioria dos condóminos que
          representem a maioria do valor total do prédio (art. 1424º n.º2 do
          Código Civil). Confirme isso antes de ativar — a aplicação não
          valida essa aprovação.
        </p>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'A guardar...' : 'Guardar alterações'}
        </Button>
      </div>
    </form>
  )
}
