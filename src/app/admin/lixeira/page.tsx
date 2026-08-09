'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, getProfile, getPacientesLixeira, restorePaciente, hardDeletePaciente, type Paciente, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Lixeira() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.role !== 'admin') { router.replace('/'); return }
      setProfile(p)
      const lista = await getPacientesLixeira()
      setPacientes(lista)
      setLoading(false)
    }).catch(() => router.replace('/'))
  }, [router])

  async function handleRestore(id: string, nome: string) {
    if (!confirm(`Restaurar "${nome}"?`)) return
    await restorePaciente(id)
    setPacientes(ps => ps.filter(p => p.id !== id))
  }

  async function handleHardDelete(id: string) {
    await hardDeletePaciente(id)
    setPacientes(ps => ps.filter(p => p.id !== id))
    setConfirmId(null)
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center text-stone-400 text-sm">Carregando...</div>
  )

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/pacientes" className="text-orange-700">
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '22px' }}>arrow_back</span>
          </Link>
          <h1 className="font-semibold text-lg flex-1">Lixeira</h1>
          <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">Somente admin</span>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28 md:pb-8 space-y-3">
        {pacientes.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-stone-300 block mb-2" style={{ fontSize: '40px' }}>delete_sweep</span>
            <p className="text-stone-400 text-sm">Nenhum paciente na lixeira.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-400 px-1">
              Pacientes excluídos ficam aqui por tempo indeterminado. Somente administradores podem restaurar ou excluir permanentemente.
            </p>
            {pacientes.map(p => (
              <div key={p.id} className="bg-white border border-stone-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-700 truncate">{p.nome}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {p.sexo === 'M' ? 'Masculino' : 'Feminino'} · {formatDate(p.data_nascimento)}
                    </p>
                    {p.deleted_at && (
                      <p className="text-xs text-red-400 mt-1">
                        Excluído em {formatDate(p.deleted_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestore(p.id, p.nome)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition"
                    >
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: '15px' }}>restore</span>
                      Restaurar
                    </button>
                    <button
                      onClick={() => setConfirmId(p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
                    >
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: '15px' }}>delete_forever</span>
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Confirm permanent delete */}
                {confirmId === p.id && (
                  <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-600 font-medium">Excluir permanentemente? Esta ação não pode ser desfeita.</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setConfirmId(null)} className="text-xs text-stone-500 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition">Cancelar</button>
                      <button onClick={() => handleHardDelete(p.id)} className="text-xs text-white bg-red-600 px-3 py-1.5 rounded-lg hover:bg-red-700 transition font-medium">Confirmar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </main>

      {profile && <BottomNav profile={profile} />}
    </div>
  )
}
