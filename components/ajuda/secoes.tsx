import type { ReactNode } from 'react'

export type SecaoAjuda = {
  value: string
  label: string
  conteudo: ReactNode
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
          com a tecla Tab.
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
          <li>Saldo atual, receitas e despesas da conta corrente.</li>
          <li>Quantas ocorrências ainda estão por resolver.</li>
          <li>Os avisos mais recentes, com um resumo do texto.</li>
          <li>
            Número de frações registadas, permilagem total, quotas por
            receber e saldo do fundo de reserva.
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
          convocatória até à ata final.
        </p>
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
          auditor; inquilinos e fornecedores não veem esta secção).
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
          </li>
          <li>
            <strong>Orçamentos</strong>: o orçamento anual do condomínio, a
            partir do qual as quotas mensais são calculadas automaticamente
            (divididas por permilagem, com isenção do elevador quando
            aplicável). Pode indicar uma percentagem para o fundo de reserva
            (sugestão de 10%, o mínimo exigido por lei) — ao gerar as quotas,
            essa percentagem é separada automaticamente num movimento próprio
            para o fundo de reserva, em vez de ter de o fazer à mão.
          </li>
          <li>
            <strong>Conciliação bancária</strong>: importar o extrato do
            banco (ficheiro CSV) e confirmar quais os movimentos que já
            correspondem a pagamentos registados.
          </li>
          <li>
            <strong>Exercícios e contas</strong>: o exercício financeiro
            (normalmente um ano) e as contas bancárias/caixa do condomínio.
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
          Para uma obra urgente decidida sem esperar por assembleia (art.
          1427.º do Código Civil), marque &ldquo;Obra urgente&rdquo; e indique
          a justificação — fica destacada na lista de despesas e também no
          dossier de apoio à próxima assembleia, para o administrador prestar
          contas.
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
          facilmente qual foi a decisão tomada.
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
        <Subtitulo>Como registar uma fração nova</Subtitulo>
        <p>
          Clique em &ldquo;Nova fração&rdquo;, indique a identificação (ex:
          &ldquo;2º Esq&rdquo;), a permilagem e o nome do proprietário. Se a
          fração não tiver acesso ao elevador (por exemplo, um rés-do-chão),
          assinale a opção de isenção da parcela do elevador.
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
        <p>
          Um administrador pode remover a conta de um condómino ou inquilino
          já aprovado (ícone de caixote do lixo, com confirmação) — não
          apaga a fração nem o histórico financeiro, só a conta de acesso.
          Útil, por exemplo, quando o proprietário de uma fração falece: o
          herdeiro cria conta nova com o código de convite, o administrador
          liga-a à fração em &ldquo;Editar&rdquo;, e só depois remove a
          conta antiga. Não é possível remover a própria conta por aqui.
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
            arquiteto e área de construção. Todos opcionais.
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
            Exportar todos os seus dados pessoais para um ficheiro (direito
            previsto no RGPD).
          </li>
          <li>
            Ativar a autenticação em dois fatores (MFA) — um código extra ao
            iniciar sessão, para maior segurança da sua conta.
          </li>
          <li>Eliminar a sua conta, com confirmação por email.</li>
        </ul>
      </>
    ),
  },
]
