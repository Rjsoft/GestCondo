import { requireOperadorPlataforma } from '@/lib/session'
import { listarCondominiosPlataforma } from '@/app/actions/plataforma'
import { PlataformaTabela } from '@/components/plataforma/plataforma-tabela'
import { Building2 } from 'lucide-react'

export default async function PlataformaPage() {
  await requireOperadorPlataforma()
  const condominios = await listarCondominiosPlataforma()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground">Plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Estado de subscrição de todos os condomínios — visível só ao operador da plataforma.
          </p>
        </div>
      </div>

      <PlataformaTabela condominios={condominios} />
    </div>
  )
}
