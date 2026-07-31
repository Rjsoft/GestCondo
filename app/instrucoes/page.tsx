import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { VoltarButton } from '@/components/voltar-button'

export default function InstrucoesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4">
        <VoltarButton />
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-serif text-lg font-bold text-foreground">GestCondo</span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-8">
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">
              Como começar: criar o seu condomínio do zero
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Um guia simples, passo a passo, para quem nunca usou o GestCondo.
              Não precisa de conhecimentos técnicos.
            </p>
          </div>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">1. Criar a sua conta</h2>
            <p>
              Abra{' '}
              <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
                a página de registo
              </Link>{' '}
              e preencha o seu nome, email e uma palavra-passe (mínimo 10
              caracteres). Depois de submeter, vai receber um email de
              confirmação — abra-o e clique no link para confirmar a conta
              antes de continuar.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">2. Criar o condomínio</h2>
            <p>
              Depois de confirmar a conta e entrar, aparece o ecrã &ldquo;Falta
              só mais um passo&rdquo;. Escolha &ldquo;Quero criar um condomínio
              novo&rdquo;, escreva o nome do condomínio (por exemplo, &ldquo;Rua
              das Flores, Nº 12&rdquo;) e clique em &ldquo;Criar
              condomínio&rdquo;. Fica automaticamente como administrador. Pode
              corrigir a morada e o NIF mais tarde.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">3. Completar os dados do condomínio</h2>
            <p>
              No menu lateral, abra &ldquo;Condomínio&rdquo;. Aí pode corrigir
              o nome, a morada e o NIF, e preencher (opcionalmente) dados como
              o número matricial ou a licença de habitação. Não é obrigatório
              preencher tudo já — pode voltar aqui mais tarde.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">4. Registar as frações</h2>
            <p>
              Abra &ldquo;Frações&rdquo; no menu lateral e clique em &ldquo;Nova
              fração&rdquo; para cada apartamento ou loja do prédio. Indique a
              identificação (ex: &ldquo;2º Esq&rdquo;), a permilagem e o nome
              do proprietário. A soma das permilagens de todas as frações nunca
              pode ultrapassar 1000‰.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">5. Convidar os condóminos</h2>
            <p>
              Em &ldquo;Condomínio&rdquo;, gere o código de convite e
              partilhe-o com os moradores (por exemplo, por email ou no grupo
              do prédio). Cada condómino cria a sua própria conta em{' '}
              <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
                sign-up
              </Link>{' '}
              e, no ecrã &ldquo;Falta só mais um passo&rdquo;, escolhe
              &ldquo;Tenho um código de convite&rdquo;. O pedido fica
              &ldquo;Pendente&rdquo; em &ldquo;Condóminos&rdquo; até o
              administrador o aprovar; depois de aprovar, use &ldquo;Editar&rdquo;
              para associar essa conta à fração correta.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">6. Criar o orçamento e gerar as quotas</h2>
            <p>
              Em &ldquo;Finanças&rdquo; → &ldquo;Orçamentos&rdquo;, crie o
              orçamento anual do condomínio. As quotas mensais de cada fração
              são calculadas automaticamente a partir da permilagem. Pode
              indicar também uma percentagem para o fundo de reserva (sugestão:
              10%, o mínimo exigido por lei).
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">7. Publicar o primeiro aviso</h2>
            <p>
              Em &ldquo;Avisos&rdquo;, clique em &ldquo;Novo aviso&rdquo; para
              comunicar algo a todos os condóminos — por exemplo, dar as boas-vindas
              e explicar que a partir de agora o condomínio passa a usar o
              GestCondo.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">Precisa de mais ajuda?</h2>
            <p>
              Depois de entrar na aplicação, o menu lateral tem uma secção
              &ldquo;Ajuda&rdquo; com uma explicação simples de cada módulo
              (Avisos, Ocorrências, Assembleias, Finanças, Documentos, entre
              outros).
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
