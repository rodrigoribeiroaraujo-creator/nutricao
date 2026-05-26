'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPacientes, deletePaciente, getSession, getProfile, type Paciente, type Profile } from '@/lib/supabase'
import { calcIdadeAnos } from '@/lib/who'
import BottomNav from '@/components/BottomNav'

function idadeStr(dataNasc: string) {
  const anos = calcIdadeAnos(dataNasc)
  if (anos < 2) return `${Math.round(anos * 12)} meses`
  return `${Math.floor(anos)} anos`
}

export default function Home() {
  const router = useRouter()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
      getPacientes().then(setPacientes).finally(() => setLoading(false))
    })
  }, [router])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return
    await deletePaciente(id)
    setPacientes(p => p.filter(x => x.id !== id))
  }

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const isAssistente = profile?.role === 'assistente'

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-base text-green-700">🌱 NutriCurvas</span>
          {!isAssistente && (
            <Link href="/pacientes/novo" className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700">
              + Novo
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 overflow-y-auto">
        <input
          type="search"
          placeholder="Buscar paciente..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full mb-5 text-base"
        />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            <p className="text-xs text-stone-400 mb-1">Total</p>
            <p className="text-3xl font-semibold text-green-600">{pacientes.length}</p>
          </div>
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            <p className="text-xs text-stone-400 mb-1">Busca</p>
            <p className="text-3xl font-semibold text-stone-700">{filtrados.length}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-stone-400 text-center py-10">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p>Nenhum paciente encontrado.</p>
            {!busca && !isAssistente && (
              <Link href="/pacientes/novo" className="mt-2 inline-block text-green-600 hover:underline">
                Cadastrar primeiro paciente →
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtrados.map(p => (
              <li key={p.id} className="bg-white border border-stone-100 rounded-xl hover:border-green-200 hover:shadow-sm transition">
                <div className="flex items-center">
                  <Link href={`/pacientes/${p.id}`} className="flex-1 flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${p.sexo === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">{p.nome}</p>
                      <p className="text-xs text-stone-400">{p.sexo === 'M' ? 'Masculino' : 'Feminino'} · {idadeStr(p.data_nascimento)}</p>
                    </div>
                  </Link>
                  {!isAssistente && (
                    <button onClick={() => handleDelete(p.id, p.nome)} className="p-4 text-stone-300 hover:text-red-400">✕</button>
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
