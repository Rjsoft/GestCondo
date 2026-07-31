'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { CondominioSelector } from '@/components/condominio-selector'
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
  Settings,
  Truck,
  HelpCircle,
  Landmark,
  MessageSquare,
  Search,
  Bell,
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
  visivel?: (
    perfil: Perfil,
    isSuperAdmin: boolean,
    isOperadorPlataforma: boolean,
    podeGerirCompleto: boolean,
  ) => boolean
}

const NAV: NavItem[] = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/pesquisa', label: 'Pesquisa', icon: Search },
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
    href: '/mensagens',
    label: 'Mensagens',
    icon: MessageSquare,
    // Canal de correspondência privada — o auditor (consulta apenas) fica
    // deliberadamente de fora por completo.
    visivel: (perfil, isSuperAdmin) => isSuperAdmin || perfil !== 'auditor',
  },
  { href: '/fornecedores', label: 'Fornecedores', icon: Truck },
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
  { href: '/ajuda', label: 'Ajuda', icon: HelpCircle },
  {
    href: '/condominio',
    label: 'Condomínio',
    icon: Settings,
    // F03: usa `podeGerirCompleto` (calculado com temPermissaoGestao, que já
    // sabe distinguir um gestor de nível "operacional"), não `PERFIS_GESTAO`
    // diretamente — essa lista não sabe nada sobre nivelGestor.
    visivel: (_perfil, _isSuperAdmin, _isOperadorPlataforma, podeGerirCompleto) =>
      podeGerirCompleto,
  },
  {
    href: '/plataforma',
    label: 'Plataforma',
    icon: Landmark,
    visivel: (_perfil, _isSuperAdmin, isOperadorPlataforma) => isOperadorPlataforma,
  },
]

export function AppShell({
  children,
  nome,
  perfil,
  podeGerirCompleto,
  isSuperAdmin,
  isOperadorPlataforma,
  condominioNome,
  condominioId,
  condominios,
  contagensNav,
}: {
  children: React.ReactNode
  nome: string
  perfil: Perfil
  /** F03 — ver NAV["/condomínio"].visivel abaixo. */
  podeGerirCompleto: boolean
  isSuperAdmin: boolean
  isOperadorPlataforma: boolean
  condominioNome: string
  condominioId: number
  /** Todos os condomínios aprovados da conta — quando tem mais do que um
   * (empresa gestora), o nome do condomínio na barra lateral vira um
   * seletor em vez de texto estático (ver CondominioSelector). */
  condominios: { condominioId: number; nome: string }[]
  /** Contagens para um badge junto à entrada de navegação, indexadas por
   * `href` (ex. não lidas em "Mensagens") — opcional, não obriga as
   * restantes entradas de NAV a mudar de forma. */
  contagensNav?: Partial<Record<string, number>>
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const primeiraRenderizacao = useRef(true)

  // Ao navegar entre páginas pela barra lateral (navegação interna do
  // Next.js, sem recarregar), o browser não repõe o foco no topo da
  // página como faria numa navegação normal — fica preso no link que
  // acabou de ser ativado, obrigando quem usa só teclado a percorrer o
  // resto da barra lateral até chegar ao conteúdo novo. Movemos o foco
  // para o conteúdo principal a cada mudança de página (exceto na
  // primeira renderização, para não roubar o foco inicial ao carregar a
  // aplicação).
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    mainRef.current?.focus()
  }, [pathname])

  const items = NAV.filter(
    (i) => !i.visivel || i.visivel(perfil, isSuperAdmin, isOperadorPlataforma, podeGerirCompleto),
  )

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
          {condominios.length > 1 ? (
            <CondominioSelector condominios={condominios} condominioIdAtivo={condominioId} />
          ) : (
            <p className="truncate text-xs text-sidebar-foreground/60">
              {condominioNome}
            </p>
          )}
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
                  <span className="flex-1">{item.label}</span>
                  {!!contagensNav?.[item.href] && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-white">
                      {contagensNav[item.href]}
                    </span>
                  )}
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar para o conteúdo
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 print:hidden lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      {/* print:hidden: em impressão a largura da página A4 fica abaixo do
          breakpoint lg, o que fazia este cabeçalho móvel aparecer nos PDF
          (recibo, ata, minutas). */}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 print:hidden lg:hidden">
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

      <main id="main-content" ref={mainRef} tabIndex={-1} className="print:pl-0 lg:pl-64">
        {/* 1600px em vez do max-w-6xl (1152px) anterior: aproveita a
            largura disponível em ecrãs grandes sem deixar as linhas de
            texto/tabelas absurdamente esticadas em monitores ultra-largos.
            Páginas imprimíveis (recibos, atas, minutas) têm o seu próprio
            max-w intencional, tipo folha A4, e ficam de fora
            (print:max-w-none aqui só remove este limite geral). */}
        <div className="mx-auto max-w-[1600px] px-4 py-6 print:max-w-none print:p-0 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
