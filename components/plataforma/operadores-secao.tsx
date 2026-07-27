import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdicionarOperadorDialog } from '@/components/plataforma/adicionar-operador-dialog'
import { OperadorActions } from '@/components/plataforma/operador-actions'
import { HistoricoPlataformaDialog } from '@/components/plataforma/historico-plataforma-dialog'

type Operador = {
  id: string
  email: string
  twoFactorEnabled: boolean
}

type LogEntrada = {
  id: number
  acao: string
  operadorEmail: string
  autorEmail: string
  createdAt: Date
}

export function OperadoresSecao({
  operadores,
  currentUserId,
  log,
}: {
  operadores: Operador[]
  currentUserId: string
  log: LogEntrada[]
}) {
  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-sm font-bold text-foreground">Operadores da plataforma</h2>
          <div className="flex gap-2">
            <HistoricoPlataformaDialog log={log} />
            <AdicionarOperadorDialog />
          </div>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          {operadores.map((op) => (
            <li
              key={op.id}
              className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0"
            >
              <span className="text-foreground">{op.email}</span>
              <div className="flex items-center gap-2">
                {op.twoFactorEnabled ? (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-800">
                    MFA ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
                    MFA por ativar
                  </Badge>
                )}
                {/* Nunca mostrada para a própria conta nem quando só resta um
                    operador — mesmas duas salvaguardas validadas de novo no
                    servidor (removerOperadorPlataforma), esta é só a UI. */}
                {op.id !== currentUserId && operadores.length > 1 && (
                  <OperadorActions userId={op.id} email={op.email} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
