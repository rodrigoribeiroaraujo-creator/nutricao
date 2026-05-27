'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, User, ClipboardList, TrendingUp, DollarSign } from 'lucide-react'
import type { Profile } from '@/lib/supabase'

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin: 'Administrador',
  nutricionista: 'Nutricionista',
  assistente: 'Assistente',
}

export default function BottomNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  const items = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/pacientes', icon: Users, label: 'Pacientes' },
    { href: '/curvas', icon: TrendingUp, label: 'Curvas' },
    { href: '/anamnese', icon: ClipboardList, label: 'Anamnese' },
    { href: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { href: '/perfil', icon: User, label: 'Perfil' },
  ]

  return (
    <>
      {/* Mobile: bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-stone-100 flex items-center justify-around z-50"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {items.map(({ href, icon: Icon, label }) => {
          const active = href === '/'
            ? pathname === '/'
            : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-0.5 pt-3 pb-1 px-2 text-[10px] font-medium transition-colors ${active ? 'text-green-600' : 'text-stone-400'}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Desktop: left sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-56 bg-white border-r border-stone-100 z-50">
        <div className="px-5 py-5 border-b border-stone-100">
          <span className="font-semibold text-base text-green-700">🌱 NutriCurvas</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(({ href, icon: Icon, label }) => {
            const active = href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-green-50 text-green-700' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'}`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-stone-100">
          <p className="text-xs text-stone-600 truncate font-medium">{profile.email}</p>
          <p className="text-xs text-stone-400 mt-0.5">{ROLE_LABEL[profile.role]}</p>
        </div>
      </aside>
    </>
  )
}
