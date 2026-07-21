import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-serif text-lg font-bold text-foreground">GestCondo</span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-8">
          <div>
            <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
              Rascunho técnico — não é parecer jurídico
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              Este texto precisa de revisão por um jurista antes de ser usado com condóminos reais.
            </p>
          </div>

          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">Termos de Utilização</h1>
            <p className="mt-1 text-sm text-muted-foreground">Última atualização: 9 de julho de 2026</p>
          </div>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">1. Objeto</h2>
            <p>
              O GestCondo é uma aplicação de apoio à administração de condomínios: gestão de
              finanças, avisos, ocorrências, frações, condóminos e assembleias. É uma ferramenta de
              apoio à gestão, não substitui as obrigações legais da administração do condomínio nem
              o regime da propriedade horizontal (Código Civil arts. 1430º e seguintes).
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">2. Contas e acesso</h2>
            <p>
              Cada conta é pessoal e intransmissível. É responsável por manter a sua password
              confidencial e por toda a atividade realizada através da sua conta. O acesso a dados
              do condomínio depende do perfil atribuído (administrador, gestor, condómino, inquilino,
              fornecedor ou auditor) e da aprovação de um administrador do condomínio.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">3. Exatidão dos dados</h2>
            <p>
              Os dados financeiros, atas e deliberações registados na aplicação refletem o que é
              introduzido pelos administradores/gestores do condomínio. A aplicação regista quem
              introduziu ou alterou cada dado (auditoria), mas não valida a correção legal ou
              contabilística do seu conteúdo.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">4. Limitação de responsabilidade</h2>
            <p>
              O GestCondo é fornecido &ldquo;tal como está&rdquo;, sem garantias de disponibilidade contínua.
              Não nos responsabilizamos por decisões de gestão do condomínio tomadas com base na
              informação registada na aplicação, nem por conteúdo introduzido pelos próprios
              utilizadores (ex. texto de avisos ou ocorrências).
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">5. Alterações</h2>
            <p>
              Estes termos podem ser atualizados; alterações significativas serão comunicadas aos
              utilizadores ativos.
            </p>
          </section>

          <p className="text-center text-xs text-muted-foreground">
            Ver também a <Link href="/privacidade" className="text-primary underline-offset-4 hover:underline">Política de Privacidade</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
