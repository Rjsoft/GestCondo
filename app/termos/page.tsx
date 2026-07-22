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
            <p className="mt-1 text-sm text-muted-foreground">Última atualização: 22 de julho de 2026</p>
          </div>

          <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <strong>[A preencher]</strong> Identificação legal do operador do GestCondo (nome, NIF,
            morada) e o foro competente (secção 8) ainda não estão definidos.
          </p>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">1. Objeto</h2>
            <p>
              O GestCondo é uma aplicação de apoio à administração de condomínios: gestão de
              finanças, avisos, ocorrências, frações, condóminos e assembleias. É uma ferramenta de
              apoio à gestão, não substitui as obrigações legais da administração do condomínio nem
              o regime da propriedade horizontal (Código Civil arts. 1430º e seguintes). Hoje a
              aplicação é disponibilizada em regime de piloto gratuito, sem qualquer modelo de
              pagamento definido; se e quando existir um modelo pago, estes termos serão atualizados
              antes de entrar em vigor.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">2. Contas e acesso</h2>
            <p>
              Cada conta é pessoal e intransmissível. É responsável por manter a sua palavra-passe
              confidencial e por toda a atividade realizada através da sua conta. O acesso a dados
              do condomínio depende do perfil atribuído (administrador, gestor, condómino, inquilino,
              fornecedor ou auditor) e da aprovação de um administrador do condomínio. Quem cria um
              condomínio na aplicação declara e garante que tem legitimidade para o representar (ex.
              é o administrador eleito ou foi por este autorizado); a responsabilidade por uma
              declaração falsa é de quem a fizer.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">3. Utilização proibida</h2>
            <p>
              Não pode usar o GestCondo para introduzir dados de terceiros sem legitimidade para o
              fazer, para fins ilícitos, ou para tentar aceder a dados de condomínios aos quais não
              pertence.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">4. Propriedade intelectual</h2>
            <p>
              O software, a marca &ldquo;GestCondo&rdquo; e os restantes conteúdos próprios da plataforma
              pertencem ao seu operador. Os documentos, fotografias e demais conteúdos que os
              utilizadores ou condomínios carregam permanecem propriedade destes, que concedem ao
              operador uma licença de utilização técnica estritamente necessária para prestar o
              serviço (armazenar, apresentar e permitir o descarregamento desse conteúdo).
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">5. Exatidão dos dados</h2>
            <p>
              Os dados financeiros, atas e deliberações registados na aplicação refletem o que é
              introduzido pelos administradores/gestores do condomínio. A aplicação regista quem
              introduziu ou alterou cada dado (auditoria), mas não valida a correção legal ou
              contabilística do seu conteúdo.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">6. Limitação de responsabilidade</h2>
            <p>
              O GestCondo é fornecido &ldquo;tal como está&rdquo;, sem garantias de disponibilidade contínua.
              Não nos responsabilizamos por decisões de gestão do condomínio tomadas com base na
              informação registada na aplicação, nem por conteúdo introduzido pelos próprios
              utilizadores (ex. texto de avisos ou ocorrências).
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">7. Fim da relação, exportação e eliminação</h2>
            <p>
              Se deixar de usar o GestCondo, pode a qualquer momento exportar os dados da sua conta
              em <Link href="/os-meus-dados" className="text-primary underline-offset-4 hover:underline">Os meus dados</Link>. A eliminação de uma conta ou de um condomínio remove o
              acesso à aplicação; dados financeiros são conservados pelo prazo de retenção legal
              contabilística/fiscal mesmo depois disso, conforme descrito na{' '}
              <Link href="/privacidade" className="text-primary underline-offset-4 hover:underline">Política de Privacidade</Link>.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">8. Lei aplicável e foro</h2>
            <p>
              Estes termos regem-se pela lei portuguesa. Em caso de litígio, é competente o tribunal
              da comarca da sede/domicílio do operador da plataforma (a definir, ver nota no topo),
              sem prejuízo das regras imperativas de proteção do consumidor. Em alternativa aos
              tribunais, pode recorrer a uma entidade de Resolução Alternativa de Litígios de
              consumo (lista em{' '}
              <a
                href="https://www.consumidor.gov.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                www.consumidor.gov.pt
              </a>
              ) ou à plataforma europeia de Resolução de Litígios em Linha (
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
              ).
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">9. Força maior e notificações</h2>
            <p>
              Nenhuma das partes é responsável por incumprimentos causados por circunstâncias fora do
              seu controlo razoável. Notificações formais ao operador devem ser feitas para o
              contacto indicado na secção 1 da Política de Privacidade.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">10. Alterações</h2>
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
