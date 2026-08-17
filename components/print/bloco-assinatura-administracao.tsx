import { formatData } from '@/lib/format'

/**
 * Bloco de assinatura comum aos documentos formais assinados "pela
 * Administração" (interpelação, declaração de dívida, convocatória, carta
 * de comunicação de deliberação) — dois campos em branco, para condomínios
 * com administração externa (empresa) e/ou administração interna (condómino
 * eleito), já que muitos têm as duas em simultâneo e outros só uma (achado
 * 2026-08-17, pedido do utilizador). Ambos ficam em branco mesmo quando só
 * um se aplica — a app não força o preenchimento de nenhum.
 */
export function BlocoAssinaturaAdministracao({ data = new Date() }: { data?: Date }) {
  return (
    <div className="mt-4 flex flex-col gap-8 text-sm text-foreground">
      <p>{formatData(data)}</p>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <div className="h-10" />
          <div className="border-b border-foreground" />
          <p className="mt-1 text-xs text-muted-foreground">Administração Externa</p>
        </div>
        <div>
          <div className="h-10" />
          <div className="border-b border-foreground" />
          <p className="mt-1 text-xs text-muted-foreground">Administração Interna do Condomínio</p>
        </div>
      </div>
    </div>
  )
}
