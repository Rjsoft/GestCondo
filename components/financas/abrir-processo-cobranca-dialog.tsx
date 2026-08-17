'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { abrirProcessoCobranca } from '@/app/actions/cobranca'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

export function AbrirProcessoCobrancaDialog({ fracaoId, identificacao }: { fracaoId: number; identificacao: string }) {
  const [open, setOpen] = useState(false)
  const [nota, setNota] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const confirmar = () => {
    startTransition(async () => {
      try {
        const processo = await abrirProcessoCobranca(fracaoId, nota)
        toast.success('Processo de cobrança aberto')
        setOpen(false)
        setNota('')
        router.push(`/financas/processos-cobranca/${processo.id}`)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Erro ao abrir processo')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <FolderPlus className="h-4 w-4" />
        Abrir processo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir processo de cobrança</DialogTitle>
          <DialogDescription>
            Fração {identificacao}. Cria um acompanhamento de estado para esta dívida — lembretes,
            interpelação, plano prestacional, até regularizar ou encerrar. Não altera nenhum
            movimento nem saldo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nota-abertura">Nota inicial (opcional)</Label>
          <Textarea
            id="nota-abertura"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ex: contacto telefónico sem resposta desde..."
          />
        </div>

        <DialogFooter>
          <Button onClick={confirmar} disabled={pending}>
            {pending ? 'A abrir...' : 'Abrir processo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
