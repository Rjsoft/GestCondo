'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Building2,
  LayoutDashboard,
  Wallet,
  Megaphone,
  Users,
  Wrench,
  FileText,
  ShieldCheck,
  Gavel,
  UserCog,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import {
  PERFIL_LABEL,
  PERFIS_ACESSO_FINANCEIRO,
  PERFIS_CONSULTA_GESTAO,
  type Perfil,
} from '@/lib/perfis'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  visivel?: (perfil: Perfil, isSuperAdmin: boolean) => boolean
}

const NAV: NavItem[] = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  {
    href: '/financas',
    label: 'Finanças',
    icon: Wallet,
    visivel: (perfil, isSuperAdmin) =>
      isSuperAdmin || PERFIS_ACESSO_FINANCEIRO.includes(perfil),
  },
  { href: '/avisos', label: 'Avisos', icon: Megaphone },
  { href: '/assembleias', label: 'Assembleias', icon: Gavel },
  { href: '/ocorrencias', label: 'Ocorrências', icon: Wrench },
  { href: '/documentos', label: 'Documentos', icon: FileText },
  {
    href: '/fracoes',
    label: 'Frações',
    icon: Building2,
    visivel: (perfil, isSuperAdmin) =>
      isSuperAdmin || PERFIS_ACESSO_FINANCEIRO.includes(perfil),
  },
  {
    href: '/condominos',
    label: 'Condóminos',
    icon: Users,
    visivel: (perfil, isSuperAdmin) =>
      isSuperAdmin || PERFIS_CONSULTA_GESTAO.includes(perfil),
  },
  {
    href: '/auditoria',
    label: 'Auditoria',
    icon: ShieldCheck,
    visivel: (perfil, isSuperAdmin) =>
      isSuperAdmin || PERFIS_CONSULTA_GESTAO.includes(perfil),
  },
  { href: '/os-meus-dados', label: 'Os meus dados', icon: UserCog },
]

export function AppShell({
  children,
  nome,
  perfil,
  isSuperAdmin,
  condominioNome,
}: {
  children: React.ReactNode
  nome: string
  perfil: Perfil
  isSuperAdmin: boolean
  condominioNome: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const items = NAV.filter((i) => !i.visivel || i.visivel(perfil, isSuperAdmin))

  const iniciais = nome
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="font-serif text-base font-bold">GestCondo</p>
          <p className="truncate text-xs text-sidebar-foreground/60">
            {condominioNome}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {iniciais || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{nome}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {isSuperAdmin ? 'Super Admin' : PERFIL_LABEL[perfil]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Terminar sessão"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-serif text-base font-bold">GestCondo</span>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 z-50 text-sidebar-foreground"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </Button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
