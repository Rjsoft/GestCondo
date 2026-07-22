'use client'

import { useState } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'

function extrairChaveManual(totpURI: string) {
  const secret = new URL(totpURI).searchParams.get('secret') ?? ''
  return secret.replace(/(.{4})/g, '$1 ').trim()
}

export function MfaSection() {
  const { data: sessao } = authClient.useSession()
  const ativo = Boolean((sessao?.user as { twoFactorEnabled?: boolean } | undefined)?.twoFactorEnabled)

  return ativo ? <DesativarMfaDialog /> : <AtivarMfaDialog />
}

function AtivarMfaDialog() {
  const [open, setOpen] = useState(false)
  const [etapa, setEtapa] = useState<'password' | 'confirmar'>('password')
  const [password, setPassword] = useState('')
  const [codigo, setCodigo] = useState('')
  const [totpURI, setTotpURI] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [pending, setPending] = useState(false)

  const reset = () => {
    setEtapa('password')
    setPassword('')
    setCodigo('')
    setTotpURI('')
    setQrCodeUrl('')
    setBackupCodes([])
  }

  const pedirAtivacao = async () => {
    setPending(true)
    const { data, error } = await authClient.twoFactor.enable({ password })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'Palavra-passe incorreta')
      return
    }
    setTotpURI(data.totpURI)
    setBackupCodes(data.backupCodes)
    setEtapa('confirmar')
    // Gerado inteiramente no browser (biblioteca "qrcode") — a chave TOTP
    // nunca sai do dispositivo, ao contrário de um serviço externo de QR.
    QRCode.toDataURL(data.totpURI, { margin: 1, width: 200 })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(''))
  }

  const confirmarAtivacao = async () => {
    setPending(true)
    const { error } = await authClient.twoFactor.verifyTotp({ code: codigo })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'Código inválido')
      return
    }
    toast.success('Verificação em duas etapas ativada')
    setOpen(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <ShieldCheck className="h-4 w-4" />
        Ativar verificação em duas etapas
      </DialogTrigger>
      <DialogContent>
        {etapa === 'password' ? (
          <>
            <DialogHeader>
              <DialogTitle>Ativar verificação em duas etapas</DialogTitle>
              <DialogDescription>
                Confirme a sua palavra-passe para gerar uma chave de configuração para a sua aplicação de
                autenticação (Google Authenticator, Authy, ou semelhante).
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mfa-password">Palavra-passe</Label>
              <Input
                id="mfa-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <DialogFooter>
              <Button onClick={pedirAtivacao} disabled={pending || !password}>
                {pending ? 'Aguarde...' : 'Continuar'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Configure a sua aplicação de autenticação</DialogTitle>
              <DialogDescription>
                Leia o código QR com a sua aplicação de autenticação (Google Authenticator, Authy,
                ou semelhante). Depois introduza o código de 6 dígitos gerado para confirmar.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              {qrCodeUrl && (
                <Image
                  src={qrCodeUrl}
                  alt="Código QR para configurar a aplicação de autenticação"
                  width={200}
                  height={200}
                  unoptimized
                  className="mx-auto rounded-md border border-border"
                />
              )}

              <div>
                <p className="text-xs text-muted-foreground">
                  Não consegue ler o código QR? Introduza esta chave manualmente.
                </p>
                <p className="mt-1 break-all rounded-md bg-muted p-2 font-mono text-sm">
                  {extrairChaveManual(totpURI)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Códigos de recuperação — guarde-os num local seguro, só são mostrados agora. Cada
                  um só pode ser usado uma vez, caso perca o acesso à aplicação de autenticação.
                </p>
                <ul className="mt-1 grid grid-cols-2 gap-1 rounded-md bg-muted p-2 font-mono text-sm">
                  {backupCodes.map((codigo) => (
                    <li key={codigo}>{codigo}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="mfa-codigo">Código de verificação</Label>
                <Input
                  id="mfa-codigo"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  inputMode="numeric"
                  placeholder="000000"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={confirmarAtivacao} disabled={pending || !codigo}>
                {pending ? 'Aguarde...' : 'Confirmar e ativar'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DesativarMfaDialog() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  const desativar = async () => {
    setPending(true)
    const { error } = await authClient.twoFactor.disable({ password })
    setPending(false)
    if (error) {
      toast.error(error.message ?? 'Palavra-passe incorreta')
      return
    }
    toast.success('Verificação em duas etapas desativada')
    setOpen(false)
    setPassword('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <ShieldOff className="h-4 w-4" />
        Desativar verificação em duas etapas
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar verificação em duas etapas</DialogTitle>
          <DialogDescription>
            Confirme a sua palavra-passe. A partir daí, voltará a entrar só com email e palavra-passe.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="mfa-disable-password">Palavra-passe</Label>
          <Input
            id="mfa-disable-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={desativar} disabled={pending || !password}>
            {pending ? 'Aguarde...' : 'Desativar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
