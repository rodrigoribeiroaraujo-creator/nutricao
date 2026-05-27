'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, getProfile, signOut, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin: 'Administrador',
  nutricionista: 'Nutricionista',
  assistente: 'Assistente',
}

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
    })
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4">
          <h1 className="font-semibold text-base text-stone-800">Perfil</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-6 md:max-w-lg md:w-full">
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-bold text-green-600 mb-4">
            {profile.email.charAt(0).toUpperCase()}
          </div>
          <p className="font-medium text-stone-800">{profile.email}</p>
          <span className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            {ROLE_LABEL[profile.role]}
          </span>
        </div>

        <div className="bg-white border border-stone-100 rounded-xl overflow-hidden mt-4">
          <div className="px-4 py-3 border-b border-stone-50">
            <p className="text-xs text-stone-400">E-mail</p>
            <p className="text-sm text-stone-700 mt-0.5">{profile.email}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-stone-400">Papel</p>
            <p className="text-sm text-stone-700 mt-0.5">{ROLE_LABEL[profile.role]}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full mt-6 py-3 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50"
        >
          Sair da conta
        </button>
      </main>

      <BottomNav profile={profile} />
    </div>
  )
}
