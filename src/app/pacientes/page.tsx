'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPacientes, getSession, getProfile, type Paciente, type Profile } from '@/lib/supabase'
import { calcIdadeAnos } from '@/lib/who'
import BottomNav from '@/components/BottomNav'

function idadeStr(dataNasc: string) {
  const anos = calcIdadeAnos(dataNasc)
  if (anos < 2) return `${Math.round(anos * 12)} meses`
  return `${Math.floor(anos)} anos`
}

export default function PacientesPage() {
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

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  const podeAdicionarPaciente = profile.role !== 'assistente'

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex-shrink-0 text-orange-700">
              <span className="material-symbols-outlined leading-none select-none" style={{fontSize:'22px'}}>clinical_notes</span>
            </Link>
            <span className="font-semibold text-base text-stone-800">Pacientes</span>
          </div>
          {podeAdicionarPaciente && (
            <Link href="/pacientes/novo" className="bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-800">
              + Novo
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-6 overflow-y-auto md:max-w-3xl md:w-full">
        <input
          type="search"
          placeholder="Buscar paciente..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full mb-5 text-base"
        />

        {loading ? (
          <p className="text-stone-400 text-center py-10">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p>Nenhum paciente encontrado.</p>
            {!busca && podeAdicionarPaciente && (
              <Link href="/pacientes/novo" className="mt-2 inline-block text-orange-700 hover:underline">
                Cadastrar primeiro paciente →
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtrados.map(p => (
              <li key={p.id}>
                <Link href={`/pacientes/${p.id}`}
                  className="flex items-center gap-4 bg-white border border-stone-100 rounded-xl p-4 hover:border-orange-200 hover:shadow-sm transition">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${p.sexo === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                    {p.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{p.nome}</p>
                    <p className="text-xs text-stone-400">{p.sexo === 'M' ? 'Masculino' : 'Feminino'} · {idadeStr(p.data_nascimento)}</p>
                  </div>
                  <span className="text-stone-300 text-sm">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav profile={profile} />
    </div>
  )
}
