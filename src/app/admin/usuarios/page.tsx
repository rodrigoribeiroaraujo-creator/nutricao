'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, getProfile, getProfiles, updateProfile, signOut, type Profile } from '@/lib/supabase'

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin: 'Admin',
  nutricionista: 'Nutricionista',
  assistente: 'Assistente',
}

const STATUS_LABEL: Record<Profile['status'], string> = {
  pending: 'Pendente',
  active: 'Ativo',
  blocked: 'Bloqueado',
}

const STATUS_COLOR: Record<Profile['status'], string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.role !== 'admin') { router.replace('/'); return }
      getProfiles().then(setProfiles).finally(() => setLoading(false))
    })
  }, [router])

  async function handleUpdate(id: string, field: 'role' | 'status', value: string) {
    setSaving(id)
    await updateProfile(id, { [field]: value } as Partial<Pick<Profile, 'role' | 'status'>>)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    setSaving(null)
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-stone-400 hover:text-stone-600 text-sm">← Voltar</Link>
            <span className="font-semibold text-lg text-green-700">Gerenciar Usuários</span>
          </div>
          <button onClick={handleSignOut} className="text-sm text-stone-400 hover:text-stone-600 px-3 py-2 rounded-lg hover:bg-stone-100">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-stone-400 text-center py-10">Carregando...</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-stone-400">{profiles.length} usuário{profiles.length !== 1 ? 's' : ''} cadastrado{profiles.length !== 1 ? 's' : ''}</p>
              <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">
                {profiles.filter(p => p.status === 'pending').length} pendente{profiles.filter(p => p.status === 'pending').length !== 1 ? 's' : ''}
              </span>
            </div>

            <ul className="space-y-3">
              {profiles.map(p => (
                <li key={p.id} className="bg-white border border-stone-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{p.email}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-xs font-medium border rounded-full px-2 py-0.5 flex-shrink-0 ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <div className="flex-1">
                      <label className="text-xs text-stone-400 block mb-1">Papel</label>
                      <select
                        value={p.role}
                        onChange={e => handleUpdate(p.id, 'role', e.target.value)}
                        disabled={saving === p.id}
                        className="w-full text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="nutricionista">Nutricionista</option>
                        <option value="assistente">Assistente</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-stone-400 block mb-1">Status</label>
                      <select
                        value={p.status}
                        onChange={e => handleUpdate(p.id, 'status', e.target.value)}
                        disabled={saving === p.id}
                        className="w-full text-sm"
                      >
                        <option value="pending">Pendente</option>
                        <option value="active">Ativo</option>
                        <option value="blocked">Bloqueado</option>
                      </select>
                    </div>
                  </div>
                  {saving === p.id && (
                    <p className="text-xs text-stone-400 mt-2">Salvando...</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}
