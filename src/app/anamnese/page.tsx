'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, getProfile, getAnamnesesTea, deleteAnamneseTea, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

const NIVEL_LABEL: Record<string, string> = {
  '1': 'Nível 1 — Leve',
  '2': 'Nível 2 — Moderado',
  '3': 'Nível 3 — Grave',
}

export default function AnamnesePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [anamneses, setAnamneses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
      getAnamnesesTea().then(setAnamneses).finally(() => setLoading(false))
    })
  }, [router])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover anamnese de ${nome}?`)) return
    await deleteAnamneseTea(id)
    setAnamneses(prev => prev.filter(a => a.id !== id))
  }

  if (!profile) {
    return <div className="min-h-dvh flex items-center justify-center"><p className="text-stone-400 text-sm">Carregando...</p></div>
  }

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="font-semibold text-base text-stone-800">Anamneses</h1>
          {profile.role !== 'assistente' && (
            <Link href="/anamnese/nova" className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700">
              + Nova
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-6 overflow-y-auto md:max-w-2xl md:w-full">
        {loading ? (
          <p className="text-stone-400 text-center py-10">Carregando...</p>
        ) : anamneses.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-sm">Nenhuma anamnese registrada.</p>
            {profile.role !== 'assistente' && (
              <Link href="/anamnese/nova" className="mt-2 inline-block text-green-600 text-sm hover:underline">
                Registrar primeira anamnese →
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {anamneses.map(a => (
              <li key={a.id} className="bg-white border border-stone-100 rounded-xl hover:border-green-200 transition">
                <div className="flex items-center">
                  <Link href={`/anamnese/${a.id}`} className="flex-1 p-4">
                    <p className="font-medium text-stone-800 text-sm">{a.nome_paciente}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {a.nivel_tea ? (
                        <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                          TEA — {NIVEL_LABEL[a.nivel_tea] ?? `Nível ${a.nivel_tea}`}
                        </span>
                      ) : (
                        <span className="text-xs bg-stone-50 text-stone-500 border border-stone-200 rounded-full px-2 py-0.5">
                          Sem TEA
                        </span>
                      )}
                      {a.data_consulta && (
                        <span className="text-xs text-stone-400">
                          {new Date(a.data_consulta + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {a.nutricionista && (
                        <span className="text-xs text-stone-400 truncate">{a.nutricionista}</span>
                      )}
                    </div>
                  </Link>
                  {profile.role === 'admin' && (
                    <button onClick={() => handleDelete(a.id, a.nome_paciente)} className="p-3 text-stone-300 hover:text-red-400">✕</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav profile={profile} />
    </div>
  )
}
