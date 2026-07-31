import type { ReactNode } from 'react'

export type SecaoAjuda = {
  value: string
  label: string
  conteudo: ReactNode
  // Versão resumida e reescrita à mão (não gerada por IA), só para as
  // secções mais densas — alterna com o texto completo através de
  // SecaoComSimplificacao (components/ajuda/secao-com-simplificacao.tsx).
  // Sempre disponível o texto original; nunca substitui, só oferece
  // alternativa. Ver docs/audit/AI_FEATURES_VIABILITY.md, item P1
  // "explicação simplificada".
  conteudoSimplificado?: ReactNode
}

// Texto descritivo de cada módulo, escrito com base no que a funcionalidade
// faz hoje na aplicação — atualizar sempre que um módulo mudar de forma
// relevante para quem o usa. Linguagem deliberadamente simples e passo a
// passo (destinatário: alguém sem experiência nenhuma com aplicações deste
// tipo), com cabeçalhos semânticos (h2/h3) para navegação por leitor de
// ecrã (NVDA).
function Titulo({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-serif text-base font-bold text-foreground">
      {children}
    </h2>
  )
}

function Subtitulo({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-2 text-sm font-bold text-foreground">{children}</h3>
  )
}

export const SECOES_AJUDA: SecaoAjuda[] = [
  {
    value: 'introducao',
    label: 'Começar aqui',
    conteudo: (
      <>
        <Titulo>O que é o GestCondo</Titulo>
        <p>
          O GestCondo é a aplicação onde o seu condomínio trata tudo:
          finanças, avisos, assembleias, ocorrências e documentos. Cada
          condomínio só vê os seus próprios dados — nunca os de outro
          condomínio.
        </p>

        <Subtitulo>Como me movimento na aplicação</Subtitulo>
        <ul className="list-disc pl-5">
          <li>
            No computador, o menu com todas as secções (Painel, Avisos,
            Finanças, etc.) está sempre visível do lado esquerdo do ecrã.
          </li>
          <li>
            No telemóvel, esse menu fica escondido: toque no botão com três
            linhas (☰), no canto superior esquerdo, para o abrir. Toque fora
            do menu, ou numa opção, para o fechar.
          </li>
          <li>
            O seu nome e a sua função (por exemplo &ldquo;Administrador&rdquo;
            ou &ldquo;Condómino&rdquo;) aparecem em baixo, no menu lateral.
            Junto ao seu nome há um botão para terminar sessão.
          </li>
          <li>
            Só vê as secções do menu que fazem sentido para si — por
            exemplo, só administradores e gestores veem &ldquo;Condomínio&rdquo;.
            Não é um erro se não vir uma secção que outra pessoa vê.
          </li>
          <li>
            Se não souber onde uma coisa está guardada, use
            &ldquo;Pesquisa&rdquo; no menu lateral — procura ao mesmo tempo
            em avisos, documentos, ocorrências, condóminos, movimentos
            financeiros e nesta própria Ajuda.
          </li>
          <li>
            &ldquo;Notificações&rdquo; no menu lateral junta, num só sítio,
            as mensagens por ler, os avisos importantes ou urgentes que
            ainda não confirmou e as ocorrências que precisam de si — o
            número junto ao nome mostra quantas tem.
          </li>
        </ul>

        <Subtitulo>Algumas palavras que vai encontrar</Subtitulo>
        <ul className="list-disc pl-5">
          <li>
            <strong>Condomínio</strong>: o prédio/edifício gerido nesta
            aplicação.
          </li>
          <li>
            <strong>Fração</strong>: uma unidade do prédio (um apartamento,
            uma loja, etc.), identificada por uma letra ou número (ex: &ldquo;2º
            Esq&rdquo;).
          </li>
          <li>
            <strong>Permilagem</strong>: a percentagem (em milésimos) que
            cada fração representa no condomínio — usada para dividir
            quotas e para contar votos em assembleia.
          </li>
          <li>
            <strong>Quota</strong>: o valor que cada fração paga
            periodicamente para as despesas do condomínio.
          </li>
          <li>
            <strong>Membro</strong>: qualquer pessoa com conta nesta
            aplicação ligada ao condomínio — condómino, inquilino,
            administrador, gestor, fornecedor ou auditor.
          </li>
          <li>
            <strong>NIF</strong>: Número de Identificação Fiscal — o número
            que identifica uma pessoa ou empresa perante as Finanças em
            Portugal. Vai encontrá-lo pedido em vários sítios da
            aplicação (condomínio, frações, pagamentos).
          </li>
        </ul>

        <Subtitulo>Acessibilidade</Subtitulo>
        <p>
          A aplicação foi pensada para ser usada com um leitor de ecrã (por
          exemplo, o NVDA). Todos os botões têm uma descrição que o leitor de
          ecrã anuncia, mesmo quando só mostram um ícone. No topo de cada
          página existe um link &ldquo;Saltar para o conteúdo&rdquo; (só
          visível quando está selecionado) que permite saltar diretamente o
          menu lateral. Pode navegar entre os separadores desta página de
          ajuda com as setas do teclado, depois de colocar o foco num deles
          com a tecla Tab. Existe um manual mais completo de utilização com
          o NVDA ou o Narrador do Windows, incluindo estes atalhos e outros
          específicos da aplicação (menus, diálogos, tabelas) — peça-o ao
          administrador se precisar.
        </p>
      </>
    ),
  },
  {
    value: 'painel',
    label: 'Painel',
    conteudo: (
      <>
        <Titulo>Painel</Titulo>
        <p>
          É a primeira página que vê ao entrar — um resumo rápido do estado
          atual do condomínio. Não precisa de fazer nada aqui, é só para
          consulta.
        </p>
        <Subtitulo>O que mostra</Subtitulo>
        <ul className="list-disc pl-5">
          <li>
            Contactos de emergência (ex: porteiro, manutenção de elevadores) —
            visíveis a todos, geridos só por administradores/gestores.
          </li>
          <li>
            Saldo atual, receitas e despesas da &ldquo;conta corrente&rdquo;
            — o dinheiro do dia a dia do condomínio (quotas recebidas,
            despesas correntes pagas), diferente da conta pessoal de
            ninguém em particular; é a conta partilhada de todo o prédio.
          </li>
          <li>Quantas ocorrências ainda estão por resolver.</li>
          <li>Os avisos mais recentes, com um resumo do texto.</li>
          <li>
            Número de frações registadas, permilagem total, quotas por
            receber e saldo do{' '}
            <strong>fundo de reserva</strong> — uma poupança obrigatória
            por lei, à parte da conta corrente, para despesas grandes e
            imprevistas no futuro (ver &ldquo;Finanças&rdquo; para mais
            detalhe).
          </li>
          <li>
            Para administradores/gestores, quando há alguma coisa a
            confirmar (ex: uma fração com a permilagem esquecida a 0‰, uma
            assembleia realizada sem a ata escrita), aparece um cartão
            &ldquo;Verificações&rdquo; no fundo da página, a listar cada
            situação com um link direto para o sítio certo. Não bloqueia
            nada — é só um lembrete; se estiver tudo em ordem, o cartão
            nem aparece.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Se é inquilino ou fornecedor, não vê os valores financeiros — só
          avisos e ocorrências. Não é um erro, é intencional.
        </p>
      </>
    ),
  },
  {
    value: 'avisos',
    label: 'Avisos',
    conteudo: (
      <>
        <Titulo>Avisos</Titulo>
        <p>
          É onde o administrador comunica informações a todos os
          condóminos — por exemplo, um corte de água ou uma obra agendada.
        </p>
        <Subtitulo>Como consultar um aviso</Subtitulo>
        <p>
          Abra &ldquo;Avisos&rdquo; no menu lateral. Todos os avisos aparecem
          numa lista, com o texto completo já visível — não precisa de
          clicar em mais nada para o ler. Pode usar o campo de pesquisa no
          topo da página para encontrar um aviso antigo.
        </p>
        <Subtitulo>Como criar um aviso (só administrador/gestor)</Subtitulo>
        <ol className="list-decimal pl-5">
          <li>Clique no botão &ldquo;Novo aviso&rdquo;, no topo da página.</li>
          <li>Escreva um título curto e o texto do aviso.</li>
          <li>
            Escolha a prioridade: &ldquo;Normal&rdquo;, &ldquo;Importante&rdquo;
            ou &ldquo;Urgente&rdquo;.
          </li>
          <li>Clique em &ldquo;Guardar&rdquo;.</li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Avisos &ldquo;Importante&rdquo; ou &ldquo;Urgente&rdquo; enviam
          automaticamente um email a todos os condóminos aprovados — não
          precisa de avisar mais ninguém à parte.
        </p>
        <Subtitulo>Confirmar leitura</Subtitulo>
        <p>
          Junto a cada aviso há um botão &ldquo;Confirmar leitura&rdquo;.
          Clique nele depois de ler o aviso — fica registado que o leu, com
          data e hora. Qualquer membro pode ver quantas confirmações já
          existem e quem confirmou.
        </p>
        <p className="text-xs text-muted-foreground">
          Não é obrigatório clicar — nada impede de continuar a usar a
          aplicação sem confirmar. Serve só para o administrador saber quem
          já viu um aviso importante, sem ter de perguntar um a um.
        </p>
      </>
    ),
  },
  {
    value: 'ocorrencias',
    label: 'Ocorrências',
    conteudo: (
      <>
        <Titulo>Ocorrências</Titulo>
        <p>
          Use este módulo para pedir uma reparação ou reportar um problema
          no condomínio (por exemplo, uma luz fundida ou um elevador
          avariado).
        </p>
        <p className="text-xs text-muted-foreground">
          Se é fornecedor (ex: canalizador, eletricista), esta página só
          lhe mostra os trabalhos que já lhe foram atribuídos pelo
          administrador — não é aqui que aparecem trabalhos novos por
          escolher. Ver &ldquo;Portal do fornecedor&rdquo;, mais abaixo.
        </p>
        <Subtitulo>Como reportar uma ocorrência</Subtitulo>
        <ol className="list-decimal pl-5">
          <li>Abra &ldquo;Ocorrências&rdquo; no menu lateral.</li>
          <li>Clique em &ldquo;Reportar ocorrência&rdquo;.</li>
          <li>Descreva o problema e, se souber, o local exato.</li>
          <li>Escolha a prioridade e, se quiser, anexe uma fotografia.</li>
          <li>Clique em &ldquo;Guardar&rdquo;.</li>
        </ol>
        <Subtitulo>Como acompanhar</Subtitulo>
        <p>
          Cada ocorrência tem um estado: &ldquo;Aberta&rdquo; (ainda por
          tratar), &ldquo;Em curso&rdquo; (já em resolução) ou
          &ldquo;Resolvida&rdquo;. Quando o administrador muda o estado da
          sua ocorrência, recebe automaticamente um email a informar. Cada
          mudança de estado fica registada em &ldquo;Auditoria&rdquo;, com
          data, autor e a transição completa (ex: &ldquo;de Aberta para Em
          curso&rdquo;) — pesquisável aí pelo título da ocorrência.
        </p>
        <Subtitulo>Atribuir a um fornecedor (para o administrador)</Subtitulo>
        <p>
          Junto do estado, o administrador pode escolher qual o fornecedor
          responsável por tratar a ocorrência (ex: a empresa de manutenção do
          elevador), a partir da lista já registada em &ldquo;Fornecedores&rdquo;.
          O nome do fornecedor atribuído passa a aparecer no cartão da
          ocorrência, visível a todos.
        </p>
        <Subtitulo>Portal do fornecedor</Subtitulo>
        <p>
          Um fornecedor cujo login esteja associado à sua ficha (ver ajuda de
          &ldquo;Condóminos&rdquo;) só vê, nesta página, as ocorrências que
          lhe foram atribuídas. Pode &ldquo;Aceitar&rdquo; um trabalho
          (passa a &ldquo;Em curso&rdquo;), &ldquo;Recusar&rdquo; (indicando
          o motivo — a ocorrência volta a ficar aberta e sem fornecedor) ou
          &ldquo;Marcar concluída&rdquo; quando terminar.
        </p>
      </>
    ),
  },
  {
    value: 'assembleias',
    label: 'Assembleias',
    conteudo: (
      <>
        <Titulo>Assembleias</Titulo>
        <p>
          Acompanha todo o percurso de uma assembleia de condóminos, desde a
          convocatória até à ata final. É o módulo com mais vocabulário
          jurídico da aplicação — cada termo é explicado abaixo, sem
          pressupor que já o conhece.
        </p>
        <Subtitulo>Algumas palavras que vai encontrar</Subtitulo>
        <ul className="list-disc pl-5">
          <li>
            <strong>Convocatória</strong>: o aviso formal, enviado com
            antecedência, a dizer quando e onde é a assembleia e o que vai
            ser discutido.
          </li>
          <li>
            <strong>Ordem de trabalhos</strong>: a lista dos assuntos
            (pontos) que vão ser discutidos e votados nessa assembleia —
            nada fora dessa lista pode ser deliberado.
          </li>
          <li>
            <strong>Procuração</strong>: um documento em que um condómino
            autoriza outra pessoa (outro condómino, um familiar, etc.) a
            estar presente e votar em seu nome, quando ele próprio não pode
            comparecer.
          </li>
          <li>
            <strong>Quórum</strong>: o mínimo de peso (medido em
            permilagem — ver &ldquo;Frações&rdquo;) que tem de estar
            presente ou representado por procuração para a assembleia poder
            deliberar validamente. Sem quórum suficiente, a assembleia não
            pode votar.
          </li>
          <li>
            <strong>Deliberação</strong>: a decisão tomada sobre um ponto
            da ordem de trabalhos, depois de votado.
          </li>
          <li>
            <strong>Ata</strong>: o registo oficial e definitivo do que foi
            discutido e decidido na assembleia.
          </li>
        </ul>
        <Subtitulo>Como consultar</Subtitulo>
        <p>
          Abra &ldquo;Assembleias&rdquo; no menu lateral e clique numa
          assembleia da lista para ver os detalhes: data, local, ordem de
          trabalhos, quem esteve presente e o resultado de cada ponto
          discutido.
        </p>
        <Subtitulo>O que acontece em cada etapa (para o administrador)</Subtitulo>
        <ol className="list-decimal pl-5">
          <li>
            <strong>Convocar</strong>: clique em &ldquo;Convocar
            assembleia&rdquo;, indique data, local e a ordem de trabalhos.
            Todos os condóminos aprovados recebem um email automático.
          </li>
          <li>
            <strong>Registar presenças</strong>: no dia da assembleia,
            registe quem esteve presente ou quem se fez representar por
            procuração.
          </li>
          <li>
            <strong>Votar</strong>: para cada ponto da ordem de trabalhos,
            registe os votos e o resultado (aprovado, reprovado ou adiado).
          </li>
          <li>
            <strong>Aprovar a ata</strong>: depois de realizada a
            assembleia, escreva o texto da ata e aprove-a. A partir desse
            momento a ata fica fechada e já não pode ser alterada — recebe
            também um número sequencial (ex: &ldquo;Ata nº 3&rdquo;).
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          A aplicação calcula automaticamente o quórum e os resultados da
          votação a partir da permilagem de cada fração, mas a decisão final
          sobre se uma deliberação cumpre a lei é sempre do administrador. É
          possível emitir a convocatória e a minuta de procuração em PDF a
          partir da página de detalhe da assembleia.
        </p>
        <Subtitulo>Confirmar leitura da convocatória</Subtitulo>
        <p>
          Na página de detalhe de cada assembleia há um botão para confirmar
          que leu a convocatória — fica registado com data e hora, e
          qualquer membro pode ver quantas confirmações já existem.
        </p>
        <Subtitulo>Anexos à ata</Subtitulo>
        <p>
          O administrador pode juntar ficheiros à assembleia (ex: uma planta,
          um orçamento discutido, uma proposta de fornecedor) na secção
          &ldquo;Anexos&rdquo; da página de detalhe — em PDF ou imagem, até
          15MB. Ficam visíveis a todos os membros, também na ata imprimível.
          Só é possível adicionar ou remover anexos enquanto a ata ainda não
          estiver aprovada; depois de aprovada, ficam fixos tal como o resto
          da ata.
        </p>
        <Subtitulo>Comunicação de deliberações aos ausentes (para o administrador)</Subtitulo>
        <p>
          Isto só se aplica a um caso específico, mas é importante não o
          esquecer: um ponto da ordem de trabalhos que, por lei, precisava
          da <strong>unanimidade</strong> de todos os condóminos (voto a
          favor de 100% do <strong>capital investido</strong> do prédio —
          a soma das permilagens de todas as frações, ver
          &ldquo;Frações&rdquo; —, não só da maioria), mas que foi aprovado
          só com o voto dos condóminos presentes ou representados nesse
          dia — desde que estes representem, pelo menos, dois terços (2/3)
          do capital investido total do prédio.
        </p>
        <p className="text-xs text-muted-foreground">
          Exemplo: um prédio com 1000‰ no total. Numa assembleia
          comparecem/representam-se frações que valem 750‰ (750‰ ≥ 2/3 de
          1000‰, ou seja, cumpre o mínimo) e todas votam a favor de um
          ponto que exigia unanimidade. As restantes frações, que valem
          250‰, estiveram ausentes — a lei considera a deliberação
          provisoriamente aprovada, mas obriga a comunicar formalmente a
          decisão a essas frações ausentes.
        </p>
        <p className="text-xs text-muted-foreground">
          O administrador tem 30 dias após a assembleia para enviar esta
          comunicação — a aplicação mostra esse prazo junto de cada fração
          por notificar.
        </p>
        <p>
          Depois de comunicada, cada fração ausente tem 90 dias para
          responder por escrito se discorda — se não responder nesse
          prazo, a lei considera que o seu silêncio conta como aprovação
          (a deliberação torna-se definitiva). Nesses casos aparece um
          botão &ldquo;Comunicação aos ausentes&rdquo; na página de
          detalhe da assembleia, com a lista de frações a notificar, um
          botão para imprimir a carta/email a enviar, e botões para
          registar a data de envio e, mais tarde, a resposta (concordância
          ou discordância) de cada fração.
        </p>
        <Subtitulo>Dossier de apoio (para quem tem acesso financeiro)</Subtitulo>
        <p>
          O botão &ldquo;Dossier de apoio (PDF)&rdquo;, na página de detalhe
          da assembleia, reúne num único documento a ordem de trabalhos, o
          resumo financeiro do condomínio, o mapa de saldos por fração (com
          o nome e a dívida de cada condómino), o balanço patrimonial e as
          despesas urgentes ou pendentes de aprovação desde a última
          assembleia (ver secção &ldquo;Finanças&rdquo;), para preparar ou
          acompanhar a prestação de contas em assembleia. Por mostrar dívidas
          nominais, só é visível a quem já tem acesso financeiro
          (administrador, gestor, condómino ou auditor) — um inquilino
          continua a ver a convocatória e a ata normalmente, mas não este
          dossier.
        </p>
      </>
    ),
    conteudoSimplificado: (
      <>
        <Titulo>Assembleias — resumo simples</Titulo>
        <p>
          É a reunião de todos os condóminos para decidir coisas em conjunto
          — desde o aviso da reunião até à decisão final escrita.
        </p>
        <Subtitulo>As 4 etapas</Subtitulo>
        <ol className="list-decimal pl-5">
          <li>
            O administrador marca a reunião (a &ldquo;convocatória&rdquo;) e
            diz o que vai ser discutido. Chega um email a todos.
          </li>
          <li>
            No dia, regista-se quem esteve presente (ou quem se fez
            representar por outra pessoa, com uma autorização escrita).
          </li>
          <li>
            Vota-se cada assunto da lista, um a um, e regista-se o
            resultado.
          </li>
          <li>
            Depois, escreve-se o resumo oficial do que foi decidido (a
            &ldquo;ata&rdquo;) e aprova-se — a partir daí já não se pode
            mudar.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Há uma situação especial, mais rara, sobre avisar formalmente quem
          faltou a uma decisão importante — se precisar disso, veja o texto
          completo (botão acima).
        </p>
      </>
    ),
  },
  {
    value: 'financas',
    label: 'Finanças',
    conteudo: (
      <>
        <Titulo>Finanças</Titulo>
        <p>
          O módulo mais completo da aplicação — só está disponível a quem
          tem acesso financeiro (administrador, gestor, condómino e
          auditor; inquilinos e fornecedores não veem esta secção). É
          também o mais técnico: cada separador abaixo é explicado com
          calma, incluindo o vocabulário.
        </p>
        <p className="text-xs text-muted-foreground">
          Cuidado com um nome que se repete com dois significados
          diferentes: aqui, &ldquo;orçamento&rdquo; é o plano de despesas
          do condomínio para o ano inteiro. Em &ldquo;Fornecedores&rdquo;,
          um &ldquo;orçamento de obra&rdquo; é outra coisa — a proposta de
          preço de uma empresa para um trabalho específico (ex: pintar a
          fachada). São dois documentos sem relação direta, apesar do
          nome parecido.
        </p>
        <Subtitulo>Separadores principais</Subtitulo>
        <ul className="list-disc pl-5">
          <li>
            <strong>Movimentos</strong>: todas as receitas e despesas.
            Administradores criam movimentos novos com &ldquo;Novo
            movimento&rdquo;.
          </li>
          <li>
            <strong>Dívidas por fração</strong>: quanto cada fração ainda
            deve.
            <ul className="list-disc pl-5">
              <li>
                &ldquo;Lançar juros de mora&rdquo; — um valor extra que se
                soma à quota em atraso, como penalização pelo atraso; a
                aplicação calcula o valor proporcionalmente aos dias de
                atraso, mas <strong>não sugere nenhuma taxa</strong> — é o
                administrador quem tem de saber (ou confirmar com um
                jurista/contabilista) qual a taxa legal ou a definida no
                regulamento do condomínio, e indicá-la ao lançar os juros.
              </li>
              <li>
                &ldquo;Dividir despesa por frações&rdquo; — rateia uma
                despesa extraordinária (ex: pintura da fachada) pelas
                frações por permilagem, criando a dívida correspondente em
                cada uma, com opção de excluir as frações isentas do
                elevador (ver &ldquo;Frações&rdquo;) e de ligar a uma
                deliberação de assembleia.
              </li>
              <li>
                &ldquo;Antiguidade da dívida&rdquo; — um relatório
                imprimível que mostra há quanto tempo cada dívida existe
                (0–30, 31–60, 61–90, 91–180, 181–365 ou mais de 365 dias),
                útil para decidir a quem enviar uma interpelação primeiro.
              </li>
              <li>
                &ldquo;Lembretes de cobrança&rdquo; — envia por email um
                aviso informal (sem valor legal, ao contrário da
                interpelação) às frações com dívida há mais de 30 ou 60
                dias: um 1º lembrete mais simples, um 2º mais firme já a
                mencionar a interpelação formal como próximo passo. O envio
                é sempre uma ação manual do administrador.
              </li>
            </ul>
          </li>
          <li>
            <strong>Adiantamentos</strong>: quando um condómino paga mais do
            que devia (ex: a quota é 100€, mas pagou 150€), registe esse
            valor a mais como crédito disponível (&ldquo;Registar
            adiantamento&rdquo;). Esse crédito pode depois ser aplicado a
            uma quota futura pendente (&ldquo;Aplicar a quota pendente&rdquo;,
            marca-a automaticamente como paga, sem o condómino ter de pagar
            outra vez) ou devolvido (&ldquo;Devolver&rdquo;). Cada fração
            com crédito mostra o histórico completo destes movimentos.
          </li>
          <li>
            <strong>Orçamentos</strong>: o orçamento anual do condomínio —
            uma estimativa de quanto vai gastar durante o ano (limpeza,
            eletricidade das partes comuns, seguro, manutenção, etc.) — a
            partir do qual as quotas mensais de cada fração são calculadas
            automaticamente (repartidas proporcionalmente à permilagem, com
            isenção do elevador quando aplicável — ver &ldquo;Frações&rdquo;).
            <ul className="list-disc pl-5">
              <li>
                <strong>Fundo de reserva</strong>: pode indicar uma
                percentagem do orçamento a reservar — uma poupança
                obrigatória por lei (mínimo 10%, sugestão por omissão) para
                despesas grandes e imprevistas no futuro (ex: arranjar o
                telhado), separada do dinheiro do dia a dia. A aplicação
                separa-a automaticamente ao gerar as quotas, num movimento
                próprio.
              </li>
              <li>
                Exemplo: um orçamento anual de 3.600€ dá 300€/mês;
                reservando 10% (30€/mês) para o fundo de reserva, sobram
                270€/mês repartidos pelas frações por permilagem.
              </li>
              <li>
                Depois de guardar o orçamento, ainda é preciso um passo
                manual para criar as quotas: no menu &ldquo;⋮&rdquo; junto
                ao orçamento, escolha &ldquo;Gerar quotas mensais&rdquo; e
                confirme a pré-visualização.
              </li>
            </ul>
          </li>
          <li>
            <strong>Conciliação bancária</strong>: confirmar que o dinheiro
            que entrou/saiu de verdade na conta do banco corresponde ao que
            está registado na aplicação — útil para detetar um pagamento
            que faltou registar ou um erro. Importe o extrato do banco
            (ficheiro CSV, que se descarrega no site/app do próprio banco)
            e confirme quais os movimentos que já correspondem a pagamentos
            registados.
          </li>
          <li>
            <strong>Exercícios e contas</strong>: o exercício financeiro é
            o período (normalmente um ano civil) usado para organizar as
            contas e produzir o balanço patrimonial — como um &ldquo;ano
            contabilístico&rdquo; do condomínio. Aqui também se gerem as
            contas bancárias/caixa do condomínio (ex: a conta à ordem no
            banco, ou dinheiro físico em caixa).
          </li>
          <li>
            <strong>Documentos de fornecedor</strong>: faturas e outros
            documentos de fornecedores, incluindo pagamentos parciais.
          </li>
          <li>
            <strong>Balanço patrimonial</strong>: o resumo do que o
            condomínio tem e deve num exercício.
          </li>
        </ul>
        <Subtitulo>Como obter um recibo ou relatório</Subtitulo>
        <p>
          Junto de cada quota (receita) na lista de movimentos, ou dentro de
          cada mês no &ldquo;Mapa mensal&rdquo;, existe um ícone de recibo —
          qualquer pessoa com acesso financeiro (incluindo um condómino) pode
          abri-lo e imprimir/guardar em PDF, sem precisar de pedir ao
          administrador. Para um relatório com todos os movimentos, use o
          botão &ldquo;Relatório (PDF)&rdquo;, ou &ldquo;Exportar CSV&rdquo;
          para descarregar os dados numa folha de cálculo.
        </p>
        <p>
          Quando quem paga uma quota não é o proprietário registado na fração
          (por exemplo, um dos vários herdeiros de uma fração em herança
          indivisa), preencha &ldquo;Pago por&rdquo; e &ldquo;NIF do
          pagador&rdquo; em &ldquo;Mais opções&rdquo; ao lançar ou editar o
          movimento — o recibo passa a mostrar esse nome/NIF em vez do NIF
          único da fração, para cada pagador poder comprovar a sua parte.
        </p>
        <Subtitulo>Aprovação de despesas e obras urgentes</Subtitulo>
        <p>
          Ao lançar ou editar uma despesa, em &ldquo;Mais opções&rdquo;, pode
          marcar &ldquo;Requer aprovação da assembleia&rdquo; — a despesa fica
          visível como pendente até ser ligada a uma decisão já aprovada numa
          assembleia. Isto nunca impede lançar ou pagar a despesa: a lei não
          fixa um valor a partir do qual uma despesa exige assembleia (é a
          distinção entre conservação corrente e extraordinária), por isso é
          sempre o administrador quem decide e a aplicação só regista essa
          decisão.
        </p>
        <p>
          A lei (art. 1427.º do Código Civil) permite ao administrador
          mandar avançar, sem esperar pela assembleia, obras urgentes de
          conservação cuja demora pudesse causar prejuízo ou pôr em risco a
          segurança do prédio (ex: uma fuga de água grave, um cabo elétrico
          exposto). Para registar uma despesa nessas condições, marque
          &ldquo;Obra urgente&rdquo; e indique a justificação — fica
          destacada na lista de despesas e também no dossier de apoio à
          próxima assembleia, para o administrador prestar contas do que
          decidiu e porquê.
        </p>
      </>
    ),
    conteudoSimplificado: (
      <>
        <Titulo>Finanças — resumo simples</Titulo>
        <p>
          É onde se vê e regista todo o dinheiro do condomínio: quanto
          entra, quanto sai, e quanto cada fração ainda deve.
        </p>
        <Subtitulo>O que precisa de saber para começar</Subtitulo>
        <ul className="list-disc pl-5">
          <li>
            <strong>Movimentos</strong>: a lista de tudo o que entrou
            (quotas pagas) e saiu (despesas) do condomínio.
          </li>
          <li>
            <strong>Dívidas por fração</strong>: quem ainda não pagou, e
            quanto.
          </li>
          <li>
            <strong>Orçamento</strong>: o plano de despesas para o ano —
            é a partir dele que a aplicação calcula, sozinha, quanto cada
            fração paga por mês.
          </li>
          <li>
            <strong>Fundo de reserva</strong>: uma poupança obrigatória por
            lei, à parte do dinheiro do dia a dia, para despesas grandes e
            imprevistas (ex: arranjar o telhado).
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Há mais separadores para situações mais específicas (juros de
          atraso, conciliação com o banco, faturas de fornecedores, balanço
          do ano) — quando precisar de algum deles, veja o texto completo
          (botão acima), que explica cada um com mais detalhe.
        </p>
      </>
    ),
  },
  {
    value: 'documentos',
    label: 'Documentos',
    conteudo: (
      <>
        <Titulo>Documentos</Titulo>
        <p>
          Um arquivo para guardar documentos do condomínio — atas antigas,
          contratos, regulamentos, apólices, entre outros.
        </p>
        <Subtitulo>Como adicionar um documento</Subtitulo>
        <ol className="list-decimal pl-5">
          <li>Abra &ldquo;Documentos&rdquo; no menu lateral.</li>
          <li>Clique em &ldquo;Novo documento&rdquo;.</li>
          <li>
            Escolha um ficheiro do seu computador ou telemóvel para
            carregar, ou cole um link para um documento que já esteja
            noutro sítio.
          </li>
          <li>Dê um título ao documento e clique em &ldquo;Guardar&rdquo;.</li>
        </ol>
        <Subtitulo>Confirmar leitura</Subtitulo>
        <p>
          Junto de cada documento (por exemplo, o regulamento do condomínio)
          há um botão para confirmar que o leu — fica registado com data e
          hora, e qualquer membro pode ver quantas confirmações já existem.
        </p>
        <Subtitulo>Marcar como confidencial</Subtitulo>
        <p>
          Ao adicionar um documento, ou depois no menu &ldquo;...&rdquo; junto
          dele, pode marcá-lo como confidencial. Um documento confidencial só
          fica visível a quem gere ou audita o condomínio — não aparece para
          os restantes condóminos nem inquilinos.
        </p>
        <Subtitulo>Substituir um ficheiro</Subtitulo>
        <p>
          No menu &ldquo;...&rdquo; junto de cada documento, &ldquo;Substituir
          ficheiro&rdquo; permite carregar uma versão nova sem perder a
          anterior — a versão antiga fica guardada e pode ser consultada a
          qualquer momento em &ldquo;versões anteriores&rdquo;, junto do
          documento, com data, quem a substituiu e o motivo (se indicado).
        </p>
      </>
    ),
  },
  {
    value: 'mensagens',
    label: 'Mensagens',
    conteudo: (
      <>
        <Titulo>Mensagens</Titulo>
        <p>
          Um canal de conversa privada com a administração do condomínio.
          Condóminos, inquilinos e fornecedores têm cada um a sua própria
          conversa, visível só a eles próprios e à administração — os
          restantes condóminos nunca veem estas mensagens.
        </p>
        <Subtitulo>Como enviar uma mensagem</Subtitulo>
        <p>
          Abra &ldquo;Mensagens&rdquo; no menu lateral, escreva a mensagem na
          caixa no fundo da conversa e clique em &ldquo;Enviar&rdquo;.
        </p>
        <Subtitulo>Do lado da administração</Subtitulo>
        <p>
          Um administrador ou empresa gestora vê a lista de todas as
          conversas do condomínio, com um aviso junto ao nome de quem tem
          mensagens novas por ler. Ao abrir uma conversa, responde da mesma
          forma.
        </p>
        <p>
          Um número junto a &ldquo;Mensagens&rdquo; no menu lateral indica
          quantas mensagens novas ainda não foram lidas.
        </p>
      </>
    ),
  },
  {
    value: 'fornecedores',
    label: 'Fornecedores',
    conteudo: (
      <>
        <Titulo>Fornecedores</Titulo>
        <p>
          Lista das empresas ou pessoas que prestam serviços ao condomínio
          (ex: limpeza, jardinagem, manutenção do elevador). Servem para
          associar despesas e documentos em Finanças.
        </p>
        <p className="text-xs text-muted-foreground">
          Cuidado: aqui, um &ldquo;orçamento de obra&rdquo; é a proposta de
          preço de um fornecedor para um trabalho específico. É diferente
          do &ldquo;orçamento&rdquo; do separador &ldquo;Finanças&rdquo;,
          que é o plano de despesas anual de todo o condomínio — mesma
          palavra, documentos sem relação direta.
        </p>
        <Subtitulo>Como registar um fornecedor novo</Subtitulo>
        <p>
          Abra &ldquo;Fornecedores&rdquo; no menu lateral, clique em
          &ldquo;Novo fornecedor&rdquo;, preencha o nome e o contacto, e
          clique em &ldquo;Guardar&rdquo;.
        </p>
        <Subtitulo>Orçamentos de obra</Subtitulo>
        <p>
          Na tab &ldquo;Orçamentos de obra&rdquo;, registe as propostas de
          preço de diferentes fornecedores para a mesma obra ou intervenção
          (ex: pintura da fachada), com o valor e um anexo opcional (PDF ou
          imagem da proposta). Assim que decidir, marque a proposta escolhida
          como &ldquo;Vencedor&rdquo; — fica destacada, para se saber
          facilmente qual foi a decisão tomada. Se o fornecedor tiver o seu
          próprio login associado à ficha (ver ajuda de
          &ldquo;Condóminos&rdquo;), também pode submeter aqui as suas
          próprias propostas diretamente.
        </p>
        <Subtitulo>Contratos</Subtitulo>
        <p>
          Na tab &ldquo;Contratos&rdquo;, registe contratos recorrentes com
          fornecedores (ex: manutenção do elevador, limpeza, energia), com
          valor, periodicidade e datas de início/fim. Quando a data de fim se
          aproxima (30 dias) ou já passou, aparece um aviso
          (&ldquo;Expira em breve&rdquo; ou &ldquo;Expirado&rdquo;) na lista,
          para não se esquecer de renovar.
        </p>
      </>
    ),
  },
  {
    value: 'fracoes',
    label: 'Frações',
    conteudo: (
      <>
        <Titulo>Frações</Titulo>
        <p>
          Lista de todas as frações do condomínio (apartamentos, lojas,
          etc.), com a respetiva permilagem e proprietário. Só visível a
          quem tem acesso financeiro.
        </p>
        <Subtitulo>O que é a permilagem</Subtitulo>
        <p>
          É o peso de cada fração no total do prédio, medido em milésimos
          (de 0 a 1000). Normalmente já está definida no título de
          propriedade de cada fração ou no regulamento do condomínio.
          Serve para duas coisas: dividir as despesas de forma proporcional
          (quem tem uma fração maior paga mais) e contar os votos numa
          assembleia (ver &ldquo;Assembleias&rdquo;).
        </p>
        <p className="text-xs text-muted-foreground">
          Exemplo: um prédio com 3 frações — R/C Dto com 250‰, 1º Esq com
          375‰ e 2º Dto com 375‰ (250 + 375 + 375 = 1000‰, o total do
          prédio). Se uma despesa comum custar 300€, o R/C Dto paga 75€
          (25% de 300€), e cada um dos outros dois paga 112,50€ (37,5%).
        </p>
        <Subtitulo>Como registar uma fração nova</Subtitulo>
        <p>
          Clique em &ldquo;Nova fração&rdquo;, indique a identificação (ex:
          &ldquo;2º Esq&rdquo;), a permilagem e o nome do proprietário. Se a
          fração não tiver acesso ao elevador (por exemplo, um rés-do-chão
          sem ligação direta ao elevador), assinale a opção de isenção da
          parcela do elevador — essa fração deixa de entrar na divisão das
          despesas de manutenção/eletricidade do elevador especificamente
          (continua a pagar as restantes despesas comuns normalmente).
        </p>
        <p className="text-xs text-muted-foreground">
          A soma das permilagens de todas as frações nunca pode ultrapassar
          1000‰ — a aplicação recusa guardar uma fração nova ou uma edição
          que ultrapasse esse limite, indicando qual seria a soma total.
        </p>
        <p>
          Em &ldquo;Mais opções&rdquo; pode ainda preencher o NIF, contactos
          de email/telefone, a área privativa e a área comum imputada (em
          m²), notas e, quando o proprietário é uma empresa ou uma herança
          indivisa, o nome e contacto de um representante legal (procurador,
          gerente, cabeça-de-casal) — tudo mostrado na listagem por baixo do
          proprietário, quando preenchido.
        </p>
        <p className="text-xs text-muted-foreground">
          Sempre que o proprietário de uma fração é alterado (ex: após uma
          venda), fica registado em &ldquo;Auditoria&rdquo; quem era o
          proprietário antes e depois da alteração, com data e autor.
        </p>
        <Subtitulo>Registar uma transmissão (venda, doação, sucessão)</Subtitulo>
        <p>
          No menu &ldquo;...&rdquo; junto de cada fração, &ldquo;Registar
          transmissão&rdquo; pede o nome do novo titular, a data da escritura
          e o que acontece ao saldo em dívida (transferido para o novo
          titular, mantido como dívida do vendedor, ou regularizado na
          própria escritura). O proprietário da fração é atualizado
          automaticamente e fica um histórico de &ldquo;transmissões
          anteriores&rdquo; junto da fração. Depois de registar, ainda é
          preciso gerir manualmente o acesso à aplicação em
          &ldquo;Condóminos&rdquo; (remover a conta antiga, ligar a conta do
          novo titular) e, se necessário, emitir a declaração de dívida em
          &ldquo;Finanças&rdquo;.
        </p>
      </>
    ),
  },
  {
    value: 'condominos',
    label: 'Condóminos',
    conteudo: (
      <>
        <Titulo>Condóminos</Titulo>
        <p>
          Lista de todas as pessoas com conta ligada a este condomínio, e o
          respetivo estado: &ldquo;Pendente&rdquo; (aguarda aprovação de um
          administrador) ou &ldquo;Aprovado&rdquo;. Visível a quem tem
          permissão de gestão ou consulta.
        </p>
        <Subtitulo>Aprovar um pedido novo (para o administrador)</Subtitulo>
        <p>
          Quando alguém se junta ao condomínio com o código de convite (ver
          &ldquo;Condomínio&rdquo;), aparece um cartão &ldquo;Pedidos de
          acesso pendentes&rdquo; no topo desta página, com o nome, email e
          data do pedido. Clique em &ldquo;Aprovar&rdquo; para lhe dar
          acesso, ou &ldquo;Rejeitar&rdquo; para recusar o pedido. Enquanto
          não aprovar, essa pessoa não vê nenhuma informação do condomínio.
        </p>
        <p>
          Depois de aprovado, escolha o &ldquo;Perfil&rdquo; certo para
          essa pessoa na lista principal (menu pendurado na coluna
          &ldquo;Perfil&rdquo;): Condómino (proprietário de uma fração),
          Inquilino (arrendatário, sem acesso a valores financeiros),
          Empresa gestora ou Administrador (mesmos poderes de gestão),
          Fornecedor (acesso mínimo, só ao que lhe for atribuído) ou
          Auditor (vê tudo, mas não pode alterar nada). Não se esqueça
          também de associar a conta à fração certa (ver abaixo).
        </p>
        <p>
          Um administrador pode remover a conta de um condómino ou inquilino
          já aprovado (ícone de caixote do lixo, com confirmação) — não
          apaga a fração nem o histórico financeiro, só a conta de acesso.
          Útil, por exemplo, quando o proprietário de uma fração falece: o
          herdeiro cria conta nova com o código de convite, o administrador
          liga-a à fração através do ícone de lápis (editar) junto ao nome,
          e só depois remove a conta antiga. Não é possível remover a
          própria conta por aqui.
        </p>
        <Subtitulo>Portal do fornecedor</Subtitulo>
        <p>
          Para uma conta com perfil &ldquo;Fornecedor&rdquo; ver, em
          &ldquo;Ocorrências&rdquo; e &ldquo;Fornecedores&rdquo;, só o que
          lhe diz respeito, associe-a à ficha correspondente em
          &ldquo;Fornecedores&rdquo;: clique no ícone de lápis (editar)
          nessa conta e escolha o fornecedor em &ldquo;Fornecedor
          associado&rdquo;.
        </p>
      </>
    ),
  },
  {
    value: 'condominio',
    label: 'Condomínio',
    conteudo: (
      <>
        <Titulo>Condomínio</Titulo>
        <p>
          Página de administração do próprio condomínio. Só administradores
          e gestores têm acesso.
        </p>
        <Subtitulo>O que pode fazer aqui</Subtitulo>
        <ul className="list-disc pl-5">
          <li>Corrigir o nome, morada e NIF do condomínio.</li>
          <li>
            Preencher os dados formais do edifício — número matricial,
            conservatória do registo predial, licença de habitação, projeto/
            arquiteto e área de construção (referências do registo predial e
            da câmara municipal; se não souber o que são, pode deixá-las em
            branco). Todos opcionais.
          </li>
          <li>
            Registar o património do condomínio — bens como mobiliário,
            equipamento ou sistemas de segurança, com valor de aquisição e
            valor atual (indicado manualmente).
          </li>
          <li>
            Gerar (ou regenerar) o código de convite — um código que
            partilha com novos condóminos para se juntarem a este
            condomínio. Regenerar invalida imediatamente o código anterior.
          </li>
          <li>
            Se gere mais do que um condomínio com a mesma conta (ex: empresa
            gestora), &ldquo;Juntar-me a outro condomínio&rdquo; permite
            entrar noutro condomínio pelo código de convite dele — fica
            &ldquo;pendente&rdquo; até o administrador desse condomínio
            aprovar. Assim que aprovado, o nome do condomínio no canto
            superior esquerdo passa a um menu para trocar entre os
            condomínios a que pertence.
          </li>
          <li>Exportar todos os dados do condomínio para um ficheiro.</li>
        </ul>
      </>
    ),
  },
  {
    value: 'auditoria',
    label: 'Auditoria',
    conteudo: (
      <>
        <Titulo>Auditoria</Titulo>
        <p>
          Um registo cronológico de todas as ações relevantes feitas na
          aplicação — quem fez o quê e quando (ex: quem aprovou uma ata, quem
          alterou um movimento financeiro). Este registo não pode ser
          alterado nem apagado por ninguém. Visível a quem tem permissão de
          gestão ou consulta.
        </p>
        <p>
          Quando uma edição altera dados existentes (por exemplo, corrigir o
          valor de um movimento ou a categoria de um fornecedor), o registo
          mostra também exatamente que campos mudaram, com o valor anterior e
          o novo. Uma edição gravada sem qualquer alteração real (ex: abrir e
          voltar a guardar sem mudar nada) não cria uma entrada nova.
        </p>
      </>
    ),
  },
  {
    value: 'os-meus-dados',
    label: 'Os meus dados',
    conteudo: (
      <>
        <Titulo>Os meus dados</Titulo>
        <p>Página pessoal, igual para todos os membros.</p>
        <Subtitulo>O que pode fazer aqui</Subtitulo>
        <ul className="list-disc pl-5">
          <li>Ver os seus próprios dados.</li>
          <li>Corrigir o seu nome e telefone.</li>
          <li>
            Exportar todos os seus dados pessoais para um ficheiro — um
            direito que qualquer pessoa tem por lei (RGPD, o Regulamento
            Geral de Proteção de Dados europeu) sobre os seus próprios
            dados, em qualquer aplicação ou serviço.
          </li>
          <li>
            Ativar a autenticação em dois fatores (MFA) — depois de
            introduzir a palavra-passe, a aplicação pede também um código
            extra antes de deixar entrar. Esse código é gerado por uma
            aplicação de autenticação instalada no seu telemóvel (ex:
            Google Authenticator ou Authy — gratuitas, disponíveis na loja
            de aplicações do telemóvel), depois de ler o código QR mostrado
            no ecrã com a câmara dessa aplicação. Mesmo que alguém descubra
            a sua palavra-passe, não consegue entrar sem esse código —
            maior segurança da sua conta.
          </li>
          <li>Eliminar a sua conta, com confirmação por email.</li>
        </ul>
      </>
    ),
  },
]
