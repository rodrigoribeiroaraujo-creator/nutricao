'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, getProfile, getProfiles, updateProfile, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

const STATUS_COLOR: Record<Profile['status'], string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
}

const STATUS_LABEL: Record<Profile['status'], string> = {
  pending: 'Pendente',
  active: 'Ativo',
  blocked: 'Bloqueado',
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.role !== 'admin') { router.replace('/'); return }
      setMyProfile(p)
      getProfiles().then(setProfiles).finally(() => setLoading(false))
    })
  }, [router])

  async function handleUpdate(id: string, field: 'role' | 'status', value: string) {
    setSaving(id)
    await updateProfile(id, { [field]: value } as Partial<Pick<Profile, 'role' | 'status'>>)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    setSaving(null)
  }

  if (!myProfile) {
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
          <h1 className="font-semibold text-base text-stone-800">Usuários</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-6 overflow-y-auto md:max-w-2xl md:w-full">
        {loading ? (
          <p className="text-stone-400 text-center py-10">Carregando...</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-stone-400">{profiles.length} usuário{profiles.length !== 1 ? 's' : ''}</p>
              {profiles.filter(p => p.status === 'pending').length > 0 && (
                <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">
                  {profiles.filter(p => p.status === 'pending').length} pendente{profiles.filter(p => p.status === 'pending').length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <ul className="space-y-3">
              {profiles.map(p => (
                <li key={p.id} className="bg-white border border-stone-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate text-sm">{p.email}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className={`text-xs font-medium border rounded-full px-2 py-0.5 flex-shrink-0 ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-stone-400 block mb-1">Papel</label>
                      <select value={p.role} onChange={e => handleUpdate(p.id, 'role', e.target.value)} disabled={saving === p.id} className="w-full text-sm">
                        <option value="admin">Admin</option>
                        <option value="nutricionista">Nutricionista</option>
                        <option value="assistente">Assistente</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-stone-400 block mb-1">Status</label>
                      <select value={p.status} onChange={e => handleUpdate(p.id, 'status', e.target.value)} disabled={saving === p.id} className="w-full text-sm">
                        <option value="pending">Pendente</option>
                        <option value="active">Ativo</option>
                        <option value="blocked">Bloqueado</option>
                      </select>
                    </div>
                  </div>
                  {saving === p.id && <p className="text-xs text-stone-400 mt-2">Salvando...</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <BottomNav profile={myProfile} />
    </div>
  )
}
