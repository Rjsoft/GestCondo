'use client'

import { useState, useTransition } from 'react'
import {
  criarAcessoConvidado,
  revogarAcessoConvidado,
} from '@/app/actions/acesso-convidado'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatData } from '@/lib/format'
import { Share2, Copy, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type AcessoConvidado = {
  id: number
  token: string
  descricao: string | null
  expiraEm: Date
  createdAt: Date
  revogadoEm: Date | null
  numeroAcessos: number
  ultimoAcessoEm: Date | null
}

/** Achado F13 (docs/audit/USABILITY_FINDINGS.md) — gerir links de acesso
 * convidado a esta ata (só visível a quem gere, e só depois de aprovada). */
export function PartilharAtaDialog({
  assembleiaId,
  acessosAtivos,
}: {
  assembleiaId: number
  /** Já filtrados pelo servidor (não revogados, ainda dentro do prazo) —
   * evita chamar Date.now() durante o render deste componente cliente. */
  acessosAtivos: AcessoConvidado[]
}) {
  const [open, setOpen] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [diasValidade, setDiasValidade] = useState('30')
  const [urlGerado, setUrlGerado] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [aRevogar, setARevogar] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  const criar = () => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('descricao', descricao)
        formData.set('diasValidade', diasValidade)
        const token = await criarAcessoConvidado(assembleiaId, formData)
        setUrlGerado(`${window.location.origin}/partilha/${token}`)
        setDescricao('')
        toast.success('Link de acesso criado')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao criar o link')
      }
    })
  }

  const copiar = async (url: string) => {
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const revogar = () => {
    if (aRevogar == null) return
    startTransition(async () => {
      try {
        await revogarAcessoConvidado(aRevogar)
        toast.success('Acesso revogado')
        setARevogar(null)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao revogar')
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Share2 className="h-4 w-4" />
          Partilhar
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partilhar esta ata</DialogTitle>
            <DialogDescription>
              Cria um link público, sem necessidade de conta, que mostra só esta ata (sem
              anexos) até ao prazo definido. Útil para partilhar com um advogado, um
              comprador de fração, ou outra pessoa fora do condomínio.
            </DialogDescription>
          </DialogHeader>

          {acessosAtivos.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Links ativos</p>
              {acessosAtivos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-foreground">
                      {a.descricao || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira em {formatData(a.expiraEm)} · {a.numeroAcessos}{' '}
                      {a.numeroAcessos === 1 ? 'acesso' : 'acessos'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Revogar este acesso"
                    onClick={() => setARevogar(a.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {urlGerado ? (
            <div className="flex flex-col gap-2">
              <Label>Link gerado</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={urlGerado} className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copiar(urlGerado)}
                  aria-label="Copiar link"
                >
                  {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="descricaoAcesso">Nota (opcional, só para si)</Label>
                <Input
                  id="descricaoAcesso"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Advogado Dr. Silva"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="diasValidade">Válido durante (dias)</Label>
                <Input
                  id="diasValidade"
                  type="number"
                  min={1}
                  max={90}
                  value={diasValidade}
                  onChange={(e) => setDiasValidade(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {urlGerado ? (
              <Button type="button" variant="outline" onClick={() => setUrlGerado(null)}>
                Criar outro link
              </Button>
            ) : (
              <Button type="button" disabled={pending} onClick={criar}>
                {pending ? 'A criar...' : 'Criar link'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={aRevogar != null}
        onOpenChange={(o) => !o && setARevogar(null)}
        title="Revogar acesso"
        description="Quem tiver este link deixa de conseguir ver a ata a partir de agora. Não é possível desfazer — se precisar de voltar a partilhar, cria um link novo."
        confirmLabel="Revogar"
        onConfirm={revogar}
        pending={pending}
      />
    </>
  )
}
