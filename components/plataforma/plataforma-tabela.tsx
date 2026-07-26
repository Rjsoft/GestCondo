'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SuspenderDialog } from '@/components/plataforma/suspender-dialog'
import { ReativarButton } from '@/components/plataforma/reativar-button'
import { formatDataHora } from '@/lib/format'

type CondominioLinha = {
  id: number
  nome: string
  estadoSubscricao: string
  notaSubscricao: string | null
  subscricaoAtualizadaEm: Date | null
  totalMembros: number
}

export function PlataformaTabela({ condominios }: { condominios: CondominioLinha[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condomínio</TableHead>
              <TableHead>Membros aprovados</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última alteração</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {condominios.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Ainda não existe nenhum condomínio.
                </TableCell>
              </TableRow>
            )}
            {condominios.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-muted-foreground">{c.totalMembros}</TableCell>
                <TableCell>
                  {c.estadoSubscricao === 'suspenso' ? (
                    <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">
                      Suspenso
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-800">
                      Ativo
                    </Badge>
                  )}
                  {c.notaSubscricao && (
                    <p className="mt-1 text-xs text-muted-foreground">{c.notaSubscricao}</p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.subscricaoAtualizadaEm ? formatDataHora(c.subscricaoAtualizadaEm) : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {c.estadoSubscricao === 'suspenso' ? (
                    <ReativarButton condominioId={c.id} />
                  ) : (
                    <SuspenderDialog condominioId={c.id} nomeCondominio={c.nome} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
