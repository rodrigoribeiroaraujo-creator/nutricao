'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, User, ClipboardList } from 'lucide-react'
import type { Profile } from '@/lib/supabase'

export default function BottomNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  const items = [
    { href: '/', icon: Home, label: 'Pacientes' },
    { href: '/anamnese', icon: ClipboardList, label: 'Anamnese' },
    ...(profile.role === 'admin' ? [{ href: '/admin/usuarios', icon: Users, label: 'Usuários' }] : []),
    { href: '/perfil', icon: User, label: 'Perfil' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-stone-100 flex items-center justify-around z-50"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 pt-3 pb-1 px-6 text-xs font-medium transition-colors ${
              active ? 'text-green-600' : 'text-stone-400'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
