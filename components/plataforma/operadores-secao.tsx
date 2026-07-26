import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdicionarOperadorDialog } from '@/components/plataforma/adicionar-operador-dialog'

type Operador = {
  id: string
  email: string
  twoFactorEnabled: boolean
}

export function OperadoresSecao({ operadores }: { operadores: Operador[] }) {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-sm font-bold text-foreground">Operadores da plataforma</h2>
          <AdicionarOperadorDialog />
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {operadores.map((op) => (
            <li key={op.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
              <span className="text-foreground">{op.email}</span>
              {op.twoFactorEnabled ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-800">
                  MFA ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
                  MFA por ativar
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
