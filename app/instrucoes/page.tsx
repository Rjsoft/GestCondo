import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { VoltarButton } from '@/components/voltar-button'
import { LeituraVozControls } from '@/components/leitura-voz/leitura-voz-controls'

export default function InstrucoesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <VoltarButton />
        <LeituraVozControls targetId="instrucoes-conteudo" />
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-serif text-lg font-bold text-foreground">GestCondo</span>
      </div>

      <Card>
        <CardContent id="instrucoes-conteudo" data-speech-content className="flex flex-col gap-6 p-8">
          <div>
            <h1 className="font-serif text-xl font-bold text-foreground">
              Como começar: criar o seu condomínio do zero
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Um guia simples, passo a passo, para quem nunca usou o GestCondo
              nem geriu um condomínio antes. Não precisa de conhecimentos
              técnicos nem de saber o que é um &ldquo;condomínio&rdquo; em
              termos legais — cada palavra nova é explicada quando aparece.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Nota para quem lê num telemóvel: sempre que este guia disser
              &ldquo;no menu lateral&rdquo;, esse menu fica escondido —
              toque primeiro no ícone com três linhas (☰), no canto
              superior esquerdo do ecrã, para o abrir.
            </p>
          </div>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">
              Um exemplo que vai acompanhar todo o guia
            </h2>
            <p>
              Para tornar tudo mais concreto, vamos imaginar um prédio
              pequeno, o &ldquo;Prédio das Amendoeiras&rdquo;, com 3
              frações (um nome técnico para cada apartamento ou loja do
              prédio, cada um com o seu próprio dono):
            </p>
            <ul className="list-disc pl-5">
              <li>R/C Dto — proprietária Ana Martins</li>
              <li>1º Esq — proprietário João Sousa</li>
              <li>2º Dto — proprietária Marta Pinto</li>
            </ul>
            <p>
              Sempre que um passo abaixo tiver um exemplo com números, é
              deste prédio imaginário que estamos a falar.
            </p>
          </section>

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
              novo&rdquo; e escreva o nome do condomínio — no nosso exemplo,
              &ldquo;Prédio das Amendoeiras&rdquo;. Clique em &ldquo;Criar
              condomínio&rdquo;.
            </p>
            <p className="text-xs text-muted-foreground">
              Porquê: um &ldquo;condomínio&rdquo;, aqui, é só o espaço da
              aplicação que representa o prédio todo — é onde vão ficar
              guardadas as frações, as contas, os avisos e tudo o resto. Ao
              criá-lo, fica automaticamente definido como
              &ldquo;administrador&rdquo;, ou seja, a pessoa responsável por
              gerir essa informação. Pode corrigir a morada e o NIF mais
              tarde, não precisa de os saber já.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">3. Completar os dados do condomínio</h2>
            <p>
              No menu lateral, abra &ldquo;Condomínio&rdquo;. Aí pode corrigir
              o nome, a morada e o NIF, e preencher (opcionalmente) dados como
              o número matricial ou a licença de habitação (referências do
              registo predial e da câmara municipal — se não souber o que
              são, não se preocupe, pode deixá-las em branco por agora).
            </p>
            <p className="text-xs text-muted-foreground">
              Porquê: estes dados servem sobretudo para documentos formais
              (ex: convocatórias, recibos). Não são obrigatórios para começar
              a usar a aplicação — pode voltar aqui mais tarde, quando os
              tiver à mão.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">4. Registar as frações</h2>
            <p>
              Abra &ldquo;Frações&rdquo; no menu lateral e clique em &ldquo;Nova
              fração&rdquo; para cada apartamento ou loja do prédio. Para
              cada uma, indique:
            </p>
            <ul className="list-disc pl-5">
              <li>a identificação (ex: &ldquo;R/C Dto&rdquo;);</li>
              <li>a permilagem;</li>
              <li>o nome do proprietário.</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              O que é a permilagem: é o peso de cada fração no total do
              prédio, medido em milésimos (de 0 a 1000). Normalmente já está
              definida no título de propriedade de cada fração ou no
              regulamento do condomínio — se não souber, é essa a informação
              a procurar antes deste passo. Serve para duas coisas: dividir
              as despesas de forma proporcional (quem tem uma fração maior
              paga mais) e contar os votos numa assembleia. A soma das
              permilagens de todas as frações tem sempre de dar exatamente
              1000‰ (ou seja, 100% do prédio) — a aplicação recusa guardar
              uma fração que ultrapasse esse limite.
            </p>
            <p className="text-xs text-muted-foreground">
              No nosso exemplo: R/C Dto tem 250‰, 1º Esq tem 375‰ e 2º Dto
              tem 375‰ — 250 + 375 + 375 = 1000‰, o total do prédio.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">5. Convidar os condóminos</h2>
            <p>
              Em &ldquo;Condomínio&rdquo;, copie o código de convite que já
              lá está — é criado automaticamente assim que cria o
              condomínio, não precisa de fazer nada para o gerar. Partilhe-o
              com os restantes moradores (por exemplo, por email ou no grupo
              do prédio) — no nosso exemplo, com o João e a Marta. Cada um
              cria a sua própria conta na{' '}
              <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
                página de registo
              </Link>{' '}
              (a mesma do passo 1) e, no ecrã &ldquo;Falta só mais um
              passo&rdquo;, escolhe
              &ldquo;Tenho um código de convite&rdquo; em vez de criar um
              condomínio novo.
            </p>
            <p className="text-xs text-muted-foreground">
              Porquê: só quem tem o código consegue juntar-se ao seu
              condomínio, o que evita que alguém estranho aceda por engano.
              Se alguma vez precisar de invalidar o código antigo (ex:
              partilhou-o por engano), há um botão &ldquo;Gerar novo
              código&rdquo; na mesma página. Depois de alguém usar o código,
              o pedido fica &ldquo;Pendente&rdquo; em &ldquo;Condóminos&rdquo;
              até o administrador o aprovar manualmente — só depois de
              aprovado é que essa pessoa vê a informação do condomínio.
              Depois de aprovar, clique no ícone de lápis junto ao nome, na
              tabela de condóminos, para associar essa conta à fração
              correta (ex: ligar a conta do João à fração &ldquo;1º
              Esq&rdquo;) — sem isso, a aplicação não sabe de que fração
              essa pessoa é dona.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">6. Criar o orçamento e gerar as quotas</h2>
            <p>
              Em &ldquo;Finanças&rdquo; → &ldquo;Orçamentos&rdquo;, crie o
              orçamento anual do condomínio: uma estimativa de quanto o
              prédio vai gastar durante o ano (limpeza, eletricidade das
              partes comuns, seguro, manutenção, entre outros).
            </p>
            <p className="text-xs text-muted-foreground">
              O que é o fundo de reserva: ao criar o orçamento, pode
              também indicar uma percentagem para o fundo de reserva — uma
              poupança obrigatória por lei (mínimo 10% do orçamento) para
              despesas grandes e imprevistas no futuro (ex: arranjar o
              telhado), separada do dinheiro do dia a dia. A aplicação
              separa essa percentagem automaticamente, não precisa de o
              fazer à mão.
            </p>
            <p className="text-xs text-muted-foreground">
              O que são as quotas: é o valor que cada fração paga
              periodicamente. A aplicação calcula sozinha quanto cada
              fração deve pagar por mês, repartindo o valor
              proporcionalmente à permilagem de cada uma — quem tem uma
              fração maior paga uma parte maior. Não precisa de fazer essa
              conta à mão.
            </p>
            <p className="text-xs text-muted-foreground">
              No nosso exemplo: um orçamento anual de 3.600 € dá um total
              mensal de 300 €. Reservando 10% para o fundo de reserva (30
              €/mês), sobram 270 €/mês a repartir pelas 3 frações
              proporcionalmente à permilagem: R/C Dto (250‰) paga 67,50
              €/mês, e 1º Esq e 2º Dto (375‰ cada) pagam 101,25 €/mês cada
              uma.
            </p>
            <p className="text-xs text-muted-foreground">
              Importante: guardar o orçamento ainda não cria as quotas.
              Depois de o guardar, clique no menu &ldquo;⋮&rdquo; junto ao
              orçamento e escolha &ldquo;Gerar quotas mensais&rdquo; — só
              nesse momento é que as 12 quotas de cada fração são
              realmente criadas. Antes de confirmar, a aplicação mostra
              uma pré-visualização dos valores para rever.
            </p>
          </section>

          <section className="flex flex-col gap-2 text-sm text-foreground">
            <h2 className="font-serif text-sm font-bold">7. Publicar o primeiro aviso</h2>
            <p>
              Em &ldquo;Avisos&rdquo;, clique em &ldquo;Novo aviso&rdquo; para
              comunicar algo a todos os condóminos — por exemplo, dar as
              boas-vindas e explicar que a partir de agora o condomínio passa
              a usar o GestCondo.
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
