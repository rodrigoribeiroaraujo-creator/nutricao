'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getPacientes, getAnamnesesTea, getConsultas,
  getSession, getProfile,
  type Paciente, type Profile, type Consulta,
} from '@/lib/supabase'
import { calcIdadeAnos } from '@/lib/who'
import BottomNav from '@/components/BottomNav'

function Icon({ n, cls }: { n: string; cls?: string }) {
  return (
    <span className={`material-symbols-outlined leading-none select-none ${cls ?? ''}`}>
      {n}
    </span>
  )
}

function idadeStr(dataNasc: string) {
  const anos = calcIdadeAnos(dataNasc)
  if (anos < 2) return `${Math.round(anos * 12)}m`
  return `${Math.floor(anos)}a`
}

export default function Home() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [anamnesesCount, setAnamnesesCount] = useState(0)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
      const [pacs, anams, cons] = await Promise.all([
        getPacientes(), getAnamnesesTea(), getConsultas(),
      ])
      setPacientes(pacs)
      setAnamnesesCount(anams.length)
      setConsultas(cons)
      setLoading(false)
    })
  }, [router])

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-stone-50">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  const total = pacientes.length
  const masculinos = pacientes.filter(p => p.sexo === 'M').length
  const femininos = pacientes.filter(p => p.sexo === 'F').length
  const pendentes = consultas.filter(c => c.status === 'pendente').length
  const recentes = [...pacientes]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3)
  const mascPct = total > 0 ? Math.round((masculinos / total) * 100) : 0
  const podeAdicionarPaciente = profile.role !== 'assistente'

  return (
    <div className="h-dvh flex flex-col md:pl-56 bg-stone-50 overflow-hidden"
      style={{ fontFamily: 'Manrope, sans-serif' }}>

      {/* ── Header ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 h-14 bg-stone-50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2">
          <Icon n="clinical_notes" cls="text-orange-700 text-[24px]" />
          <span className="font-extrabold text-base text-orange-700 tracking-tight">KR Nutri Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-stone-400">
            <Icon n="search" cls="text-[20px]" />
          </button>
          <button className="text-stone-400">
            <Icon n="notifications" cls="text-[20px]" />
          </button>
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-bold text-xs flex-shrink-0">
            {profile.email.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── Main (fixed, no scroll) ── */}
      <main className="flex-1 min-h-0 flex flex-col px-4 pt-2 pb-20 md:pb-6 gap-3">

        {/* Heading */}
        <div>
          <h2 className="text-xl font-bold text-stone-900">Painel Clínico</h2>
          <p className="text-stone-400 text-xs mt-0.5">Métricas em tempo real dos seus pacientes.</p>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-shrink-0">

          {/* Card 1 – Pacientes */}
          <div className="col-span-2 md:col-span-1 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="p-1.5 bg-orange-100 rounded-lg">
                <Icon n="groups" cls="text-orange-700 text-[20px]" />
              </span>
              <span className="text-[10px] font-semibold text-stone-400">Total</span>
            </div>
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Pacientes Ativos</p>
            <div className="flex items-baseline gap-1 mt-0.5 mb-2">
              <span className="text-2xl font-extrabold text-stone-900">{loading ? '—' : total}</span>
              <span className="text-[10px] font-bold text-stone-400">pacientes</span>
            </div>
            <div className="w-full bg-pink-100 rounded-full h-1.5 overflow-hidden mb-1.5">
              <div className="bg-blue-400 h-full rounded-full transition-all duration-700" style={{ width: `${mascPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-stone-500">Masc.</span>
                <span className="font-bold text-stone-700">{loading ? '—' : masculinos}</span>
                <span className="text-stone-400">({mascPct}%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span className="text-stone-500">Fem.</span>
                <span className="font-bold text-stone-700">{loading ? '—' : femininos}</span>
                <span className="text-stone-400">({total > 0 ? 100 - mascPct : 0}%)</span>
              </div>
            </div>
          </div>

          {/* Card 2 – Anamneses */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="mb-2">
              <span className="p-1.5 bg-violet-100 rounded-lg inline-block">
                <Icon n="pending_actions" cls="text-violet-700 text-[20px]" />
              </span>
            </div>
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Anamneses</p>
            <div className="flex items-baseline gap-1 mt-0.5 mb-2">
              <span className="text-2xl font-extrabold text-stone-900">{loading ? '—' : anamnesesCount}</span>
              <span className="text-[10px] font-bold text-stone-400">reg.</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon n="clinical_notes" cls="text-violet-300 text-xs" />
              <span className="text-[10px] text-stone-400">Histórico</span>
            </div>
          </div>

          {/* Card 3 – Pendentes */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
            <div className="mb-2">
              <span className="p-1.5 bg-sky-100 rounded-lg inline-block">
                <Icon n="show_chart" cls="text-sky-700 text-[20px]" />
              </span>
            </div>
            <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wide">Pendentes</p>
            <div className="flex items-baseline gap-1 mt-0.5 mb-2">
              <span className="text-2xl font-extrabold text-stone-900">{loading ? '—' : pendentes}</span>
              <span className="text-[10px] font-bold text-stone-400">consul.</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon n="payments" cls="text-sky-300 text-xs" />
              <span className="text-[10px] text-stone-400">Financeiro</span>
            </div>
            <div className="absolute bottom-0 right-0 left-0 h-10 opacity-10 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 80 Q 25 20, 50 60 T 100 30 L 100 100 L 0 100 Z" fill="#0ea5e9" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Pacientes Recentes ── */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-stone-900">Pacientes Recentes</h3>
            <div className="flex items-center gap-3">
              {podeAdicionarPaciente && (
                <Link href="/pacientes/novo"
                  className="flex items-center gap-1 bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-800 active:scale-95 transition-all">
                  <Icon n="person_add" cls="text-sm" />
                  Novo
                </Link>
              )}
              <Link href="/pacientes"
                className="text-orange-700 font-bold text-xs flex items-center gap-0.5 hover:opacity-70 transition-opacity">
                Ver todos <Icon n="arrow_forward" cls="text-[14px]" />
              </Link>
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <p className="p-6 text-center text-stone-400 text-sm">Carregando...</p>
            ) : recentes.length === 0 ? (
              <p className="p-6 text-center text-stone-400 text-sm">Nenhum paciente cadastrado ainda.</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Paciente</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Idade</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Sexo</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentes.map(p => (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-50 border border-stone-200 flex items-center justify-center text-orange-800 font-bold text-xs flex-shrink-0">
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900 text-xs">{p.nome}</p>
                            <p className="text-[10px] text-stone-400">#{p.id.slice(0, 8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-stone-500">{idadeStr(p.data_nascimento)}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.sexo === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}>
                          {p.sexo === 'M' ? 'Masc.' : 'Fem.'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link href={`/pacientes/${p.id}`}
                          className="text-stone-400 hover:text-orange-700 transition-colors inline-flex">
                          <Icon n="open_in_new" cls="text-base" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <BottomNav profile={profile} />
    </div>
  )
}
