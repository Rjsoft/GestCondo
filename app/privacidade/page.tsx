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
            <p className="mt-1 text-sm text-muted-foreground">Última atualização: 22 de julho de 2026</p>
          </div>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">1. Responsável pelo tratamento</h2>
            <p>
              Consoante o cenário de utilização, o responsável pelo tratamento dos dados dos
              condóminos é a administração do condomínio ou a empresa de administração que opera esta
              instância do GestCondo — nunca o fabricante do software, que atua como subcontratante
              técnico nesses casos. Já para as métricas de utilização da própria plataforma (ver secção
              5), o operador do GestCondo é o responsável.
            </p>
            <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>[A preencher]</strong> Identificação legal do operador do GestCondo (nome, NIF,
              morada) e um contacto de privacidade dedicado — ainda não definidos. Até lá, para exercer
              qualquer direito abaixo, contacte o administrador do seu condomínio ou use a página{' '}
              <Link href="/os-meus-dados" className="text-primary underline-offset-4 hover:underline">Os meus dados</Link>.
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
              alojamento de base de dados (Neon/PostgreSQL), envio de email (Resend), armazenamento de
              ficheiros (Vercel Blob) e métricas de utilização agregadas (Vercel Analytics, ver secção
              5). Nunca vendemos dados a terceiros.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">5. Cookies e métricas</h2>
            <p>
              A aplicação usa um cookie técnico de sessão, estritamente necessário para manter a sua
              autenticação — está isento de consentimento nos termos do art. 5º/3 da Diretiva
              ePrivacy. Não usamos cookies de publicidade ou de rastreamento entre sites. Usamos o
              Vercel Analytics para medir visitas de forma agregada (páginas visitadas, país
              aproximado); segundo o fornecedor, este serviço não usa cookies nem identifica
              individualmente o visitante.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">6. Segurança</h2>
            <p>
              Aplicamos medidas técnicas e organizativas proporcionais ao risco: isolamento dos dados
              entre condomínios, autenticação com palavra-passe e verificação de email, cifra em trânsito
              (TLS/HTTPS) entre a aplicação e a base de dados, e registo de auditoria de todas as
              alterações relevantes. Nenhum sistema é absolutamente seguro — não prometemos segurança
              absoluta, mas mantemos estas medidas em revisão.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">7. Transferências internacionais</h2>
            <p>
              Os subprocessadores técnicos indicados na secção 4 operam sobre infraestrutura que pode,
              em alguns casos, envolver processamento fora do Espaço Económico Europeu. Estamos a
              confirmar formalmente com cada fornecedor a região exata de processamento e as
              salvaguardas aplicáveis (ex. cláusulas contratuais-tipo da Comissão Europeia); esta
              secção será atualizada assim que essa confirmação estiver concluída.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">8. Decisões automatizadas</h2>
            <p>
              Não tomamos decisões automatizadas com efeitos jurídicos ou impacto significativo sobre
              si sem intervenção humana. Todos os cálculos apresentados (quotas, saldos, dívidas) são
              informativos, a partir de dados introduzidos por uma pessoa.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">9. Prazo de conservação</h2>
            <p>
              Dados financeiros são conservados pelo prazo de retenção legal contabilística/fiscal,
              mesmo depois de &ldquo;eliminados&rdquo; na aplicação. Os restantes dados são conservados enquanto a
              sua conta existir. Pode pedir a eliminação da sua conta a qualquer momento em{' '}
              <Link href="/os-meus-dados" className="text-primary underline-offset-4 hover:underline">Os meus dados</Link>.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">10. Os seus direitos</h2>
            <p>
              Tem direito de acesso, retificação, apagamento, oposição e portabilidade dos seus
              dados. Pode consultar e corrigir os seus próprios dados, exportá-los e pedir a
              eliminação da sua conta em{' '}
              <Link href="/os-meus-dados" className="text-primary underline-offset-4 hover:underline">Os meus dados</Link>.
              Para pedidos que não estejam disponíveis por autogestão, contacte o administrador do
              seu condomínio.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">11. Reclamações</h2>
            <p>
              Sem prejuízo de qualquer outra via de recurso, tem o direito de apresentar reclamação à
              Comissão Nacional de Proteção de Dados (CNPD),{' '}
              <a
                href="https://www.cnpd.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                www.cnpd.pt
              </a>
              , se considerar que o tratamento dos seus dados viola o RGPD.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">12. Alterações a esta política</h2>
            <p>
              Esta política pode ser atualizada; alterações significativas serão comunicadas aos
              utilizadores ativos.
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
