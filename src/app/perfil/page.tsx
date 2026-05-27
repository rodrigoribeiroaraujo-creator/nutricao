'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, getProfile, getProfiles, updateProfile, signOut, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin: 'Administrador',
  nutricionista: 'Nutricionista',
  assistente: 'Assistente',
}

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

type NewUserForm = { email: string; password: string; role: Profile['role']; status: Profile['status'] }

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewUserForm>({ email: '', password: '', role: 'nutricionista', status: 'active' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
      if (p.role === 'admin') {
        getProfiles().then(setProfiles)
      }
    })
  }, [router])

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  async function handleUpdate(id: string, field: 'role' | 'status', value: string) {
    setSaving(id)
    await updateProfile(id, { [field]: value } as Partial<Pick<Profile, 'role' | 'status'>>)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    setSaving(null)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true); setCreateError('')
    try {
      const session = await getSession()
      if (!session) throw new Error('Sessão expirada')
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar usuário')
      const updated = await getProfiles()
      setProfiles(updated)
      setShowModal(false)
      setForm({ email: '', password: '', role: 'nutricionista', status: 'active' })
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar usuário')
    } finally {
      setCreating(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  const pendentes = profiles.filter(p => p.status === 'pending').length

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="font-semibold text-base text-stone-800">Perfil</h1>
          {profile.role === 'admin' && (
            <button
              onClick={() => { setShowModal(true); setCreateError('') }}
              className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700"
            >
              + Usuário
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-6 overflow-y-auto md:max-w-2xl md:w-full space-y-6">

        {/* Card do usuário logado */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-600 flex-shrink-0">
            {profile.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-800 truncate">{profile.email}</p>
            <span className="mt-1 inline-block text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
              {ROLE_LABEL[profile.role]}
            </span>
          </div>
        </div>

        {/* Seção de usuários (só admin) */}
        {profile.role === 'admin' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-stone-500">Usuários do sistema</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">{profiles.length} usuário{profiles.length !== 1 ? 's' : ''}</span>
                {pendentes > 0 && (
                  <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-0.5">
                    {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
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
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-medium text-sm hover:bg-red-50"
        >
          Sair da conta
        </button>
      </main>

      <BottomNav profile={profile} />

      {/* Modal novo usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div
            className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl px-6 pt-6"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-800">Novo usuário</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 pb-2">
              <div>
                <label className="text-xs text-stone-500 block mb-1">E-mail</label>
                <input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="w-full" autoComplete="off" />
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Senha</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} className="w-full" autoComplete="new-password" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Papel</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Profile['role'] }))} className="w-full text-sm">
                    <option value="nutricionista">Nutricionista</option>
                    <option value="assistente">Assistente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Profile['status'] }))} className="w-full text-sm">
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                </div>
              </div>
              {createError && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{createError}</p>}
              <button type="submit" disabled={creating} className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50">
                {creating ? 'Criando...' : 'Criar usuário'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
