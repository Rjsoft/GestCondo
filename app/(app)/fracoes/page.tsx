import { notFound } from 'next/navigation'
import {
  requireMembroPagina,
  temAcessoFinanceiro,
  temConsultaGestao,
  temPermissaoGestao,
} from '@/lib/session'
import { getFracoes } from '@/app/actions/fracoes'
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
  const fracoes = await getFracoes()

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
                <TableHead className="text-right">Permilagem</TableHead>
                {isAdmin && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fracoes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={2 + (veContactos ? 1 : 0) + 1 + (isAdmin ? 1 : 0)}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Ainda não existem frações registadas.
                  </TableCell>
                </TableRow>
              )}
              {fracoes.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    {f.identificacao}
                  </TableCell>
                  <TableCell>{f.proprietario}</TableCell>
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
                  <TableCell className="text-right">
                    {Number(f.permilagem).toFixed(2)} ‰
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <FracaoActions id={f.id} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
