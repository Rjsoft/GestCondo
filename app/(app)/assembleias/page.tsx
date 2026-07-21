import Link from 'next/link'
import { getAssembleias } from '@/app/actions/assembleias'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import { PageHeader } from '@/components/page-header'
import { NovaAssembleiaDialog } from '@/components/assembleias/nova-assembleia-dialog'
import { AssembleiaStatusBadge } from '@/components/badges'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDataHora } from '@/lib/format'

const TIPO_LABEL: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
}

export default async function AssembleiasPage() {
  const membro = await requireMembroPagina()
  const isAdmin = temPermissaoGestao(membro)

  const assembleias = await getAssembleias()

  return (
    <div>
      <PageHeader
        title="Assembleias"
        description="Convocatórias, ordem de trabalhos, presenças, votação e atas."
      >
        {isAdmin && <NovaAssembleiaDialog />}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>1ª convocatória</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Local</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assembleias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Ainda não existe nenhuma assembleia convocada.
                  </TableCell>
                </TableRow>
              )}
              {assembleias.map((a) => (
                <TableRow key={a.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/assembleias/${a.id}`} className="block hover:underline">
                      {formatDataHora(a.dataPrimeiraConvocatoria)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {TIPO_LABEL[a.tipo] ?? a.tipo}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {a.local}
                  </TableCell>
                  <TableCell>
                    <AssembleiaStatusBadge estado={a.estado} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
