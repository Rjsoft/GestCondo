import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'

export default function PrivacidadePage() {
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
              Este texto foi escrito a partir do inventário de dados efetivamente recolhidos pela
              aplicação, para ser tecnicamente exato — não substitui a revisão de um jurista
              especializado em RGPD/direito do condomínio em Portugal, obrigatória antes de operar
              com condóminos reais.
            </p>
          </div>

          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">Política de Privacidade</h1>
            <p className="mt-1 text-sm text-muted-foreground">Última atualização: 9 de julho de 2026</p>
          </div>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">1. Responsável pelo tratamento</h2>
            <p>
              O responsável pelo tratamento dos dados é a administração do condomínio (ou a empresa
              de administração) que opera esta instância do GestCondo, não o fabricante do software.
              Para exercer qualquer direito abaixo, contacte o administrador do seu condomínio ou use
              a página <Link href="/os-meus-dados" className="text-primary underline-offset-4 hover:underline">Os meus dados</Link>.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">2. Que dados recolhemos</h2>
            <ul className="list-disc pl-5">
              <li>Identificação: nome, email, telefone.</li>
              <li>Ligação a uma fração do condomínio (proprietário ou inquilino).</li>
              <li>Dados financeiros associados à sua fração (quotas, dívidas, recibos).</li>
              <li>Conteúdo que introduz na aplicação: avisos, ocorrências reportadas, votos e presenças em assembleias, ficheiros que carrega (documentos, fotos, apólices).</li>
              <li>Dados técnicos de sessão (endereço IP, tipo de navegador) para autenticação e segurança.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">3. Porque tratamos estes dados</h2>
            <p>
              A generalidade destes dados é tratada com base na <strong>execução do contrato</strong>{' '}
              de administração do condomínio e no <strong>cumprimento de obrigações legais</strong>{' '}
              (regime da propriedade horizontal, Código Civil arts. 1430º e seguintes), não com base
              no seu consentimento — pelo que, para estes casos, não é possível &ldquo;retirar consentimento&rdquo;
              enquanto for condómino/inquilino do prédio, ainda que possa exercer os direitos abaixo.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">4. Com quem partilhamos dados</h2>
            <p>
              Dentro do condomínio, só com os outros membros aprovados e apenas na medida do seu
              perfil de acesso (ex. inquilinos não veem dados financeiros). Fora do condomínio,
              partilhamos dados com os subprocessadores técnicos que tornam o serviço possível:
              alojamento de base de dados (Neon/PostgreSQL), envio de email (Resend) e armazenamento
              de ficheiros (Vercel Blob). Nunca vendemos dados a terceiros.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">5. Prazo de conservação</h2>
            <p>
              Dados financeiros são conservados pelo prazo de retenção legal contabilística/fiscal,
              mesmo depois de &ldquo;eliminados&rdquo; na aplicação. Os restantes dados são conservados enquanto a
              sua conta existir. Pode pedir a eliminação da sua conta a qualquer momento em{' '}
              <Link href="/os-meus-dados" className="text-primary underline-offset-4 hover:underline">Os meus dados</Link>.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">6. Os seus direitos</h2>
            <p>
              Tem direito de acesso, retificação, apagamento, oposição e portabilidade dos seus
              dados. Pode consultar e corrigir os seus próprios dados, exportá-los e pedir a
              eliminação da sua conta em{' '}
              <Link href="/os-meus-dados" className="text-primary underline-offset-4 hover:underline">Os meus dados</Link>.
              Para pedidos que não estejam disponíveis por autogestão, contacte o administrador do
              seu condomínio.
            </p>
          </section>

          <p className="text-center text-xs text-muted-foreground">
            Ver também os <Link href="/termos" className="text-primary underline-offset-4 hover:underline">Termos de Utilização</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
