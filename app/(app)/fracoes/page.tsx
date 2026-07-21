import { notFound } from 'next/navigation'
import {
  requireMembroPagina,
  temAcessoFinanceiro,
  temConsultaGestao,
  temPermissaoGestao,
} from '@/lib/session'
import { getFracoes, getMembros } from '@/app/actions/fracoes'
import { PageHeader } from '@/components/page-header'
import { NovaFracaoDialog } from '@/components/fracoes/nova-fracao-dialog'
import { FracaoActions } from '@/components/fracoes/fracao-actions'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default async function FracoesPage() {
  const membro = await requireMembroPagina()
  if (!temAcessoFinanceiro(membro)) notFound()
  const isAdmin = temPermissaoGestao(membro)
  // Contactos pessoais (email/telefone) só são mostrados a quem gere o
  // condomínio ou audita — ver a mesma decisão em getFracoes()
  // (SECURITY_AUDIT.md S13). Para os restantes, getFracoes() já devolve
  // esses campos como null; aqui só se decide esconder a própria coluna.
  const veContactos = temConsultaGestao(membro)
  const [fracoes, membros] = await Promise.all([
    getFracoes(),
    // Só para quem gere/audita — usado para mostrar quais contas de
    // condómino estão ligadas a cada fração (visibilidade de
    // compropriedade: mais do que uma conta condomino na mesma fração é
    // tecnicamente permitido, mas não tinha nenhuma UI que o mostrasse).
    veContactos ? getMembros() : Promise.resolve([]),
  ])
  const condominosPorFracao = new Map<number, string[]>()
  for (const m of membros) {
    if (m.perfil !== 'condomino' || !m.fracaoId) continue
    const lista = condominosPorFracao.get(m.fracaoId) ?? []
    lista.push(m.nome)
    condominosPorFracao.set(m.fracaoId, lista)
  }

  return (
    <div>
      <PageHeader
        title="Frações"
        description="Frações autónomas e respetivos proprietários."
      >
        {isAdmin && <NovaFracaoDialog />}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificação</TableHead>
                <TableHead>Proprietário</TableHead>
                {veContactos && (
                  <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                )}
                {veContactos && (
                  <TableHead className="hidden md:table-cell">Condómino(s) com conta</TableHead>
                )}
                <TableHead className="text-right">Permilagem</TableHead>
                <TableHead className="hidden sm:table-cell">Elevador</TableHead>
                {isAdmin && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fracoes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3 + (veContactos ? 2 : 0) + (isAdmin ? 1 : 0)}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Ainda não existem frações registadas.
                  </TableCell>
                </TableRow>
              )}
              {fracoes.map((f) => {
                const condominos = condominosPorFracao.get(f.id) ?? []
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {f.identificacao}
                    </TableCell>
                    <TableCell>
                      {f.proprietario}
                      {f.nif && (
                        <span className="block text-xs text-muted-foreground">NIF: {f.nif}</span>
                      )}
                    </TableCell>
                    {veContactos && (
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {f.contactoEmail || f.contactoTelefone ? (
                          <span>
                            {f.contactoEmail}
                            {f.contactoEmail && f.contactoTelefone ? ' · ' : ''}
                            {f.contactoTelefone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    )}
                    {veContactos && (
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {condominos.length > 0 ? condominos.join(', ') : '—'}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {Number(f.permilagem).toFixed(2)} ‰
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {f.isentaElevador ? 'Isenta' : '—'}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <FracaoActions id={f.id} isentaElevador={f.isentaElevador} />
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
