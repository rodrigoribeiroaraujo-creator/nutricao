'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, User, Calendar, DollarSign } from 'lucide-react'
import type { Profile } from '@/lib/supabase'

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin: 'Administrador',
  nutricionista: 'Nutricionista',
  assistente: 'Assistente',
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export default function BottomNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  const items = [
    { href: '/', icon: Home, label: 'Início' },
    { href: '/pacientes', icon: Users, label: 'Pacientes' },
    { href: '/agenda', icon: Calendar, label: 'Agenda' },
    { href: '/financeiro', icon: DollarSign, label: 'Financeiro' },
    { href: '/perfil', icon: User, label: 'Perfil' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ── Mobile: bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 z-50 flex items-center justify-around"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        {items.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 pt-2 pb-1 px-3 relative">
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-orange-600 rounded-full" />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.5}
                className={active ? 'text-orange-700' : 'text-stone-400'}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-orange-700' : 'text-stone-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* ── Desktop: left sidebar ── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-56 bg-stone-900 z-50">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-900/40">
              <span className="text-white text-sm font-extrabold tracking-tight">KR</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-snug">KR Nutri Pro</p>
              <p className="text-stone-500 text-[10px] leading-snug">Sistema de Nutrição</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest px-3 mb-3">
            Navegação
          </p>
          {items.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-900/30'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div className="px-3 pb-4 pt-3 border-t border-stone-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-stone-800 transition-colors">
            <div className="w-8 h-8 bg-orange-600/20 border border-orange-600/30 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-orange-400 text-xs font-bold">{initials(profile.email)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-200 truncate font-medium">{profile.email}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">{ROLE_LABEL[profile.role]}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
