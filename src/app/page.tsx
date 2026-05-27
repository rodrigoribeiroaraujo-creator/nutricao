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
    .slice(0, 5)
  const mascPct = total > 0 ? Math.round((masculinos / total) * 100) : 0
  const podeAdicionarPaciente = profile.role !== 'assistente'

  return (
    <div className="min-h-dvh flex flex-col md:pl-56 bg-stone-50">

      {/* ── TopAppBar ── */}
      <header
        className="sticky top-0 z-40 bg-stone-50 border-b border-stone-200 flex items-center justify-between px-6 h-16"
        style={{ paddingTop: 'env(safe-area-inset-top)', fontFamily: 'Manrope, sans-serif' }}
      >
        <div className="flex items-center gap-3">
          <Icon n="clinical_notes" cls="text-orange-700 text-[26px]" />
          <span className="font-extrabold text-lg text-orange-700 tracking-tight">KR Nutri Pro</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-stone-400 hover:text-stone-600 transition-colors">
            <Icon n="search" cls="text-[22px]" />
          </button>
          <button className="text-stone-400 hover:text-stone-600 transition-colors">
            <Icon n="notifications" cls="text-[22px]" />
          </button>
          <div className="w-8 h-8 rounded-full bg-orange-100 border border-stone-200 flex items-center justify-center text-orange-800 font-bold text-sm flex-shrink-0">
            {profile.email.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        className="flex-1 px-6 py-6 pb-28 md:pb-10 overflow-y-auto"
        style={{ fontFamily: 'Manrope, sans-serif' }}
      >

        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900">Painel Clínico</h2>
          <p className="text-stone-500 text-sm mt-1">Métricas em tempo real e visão geral dos pacientes.</p>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">

          {/* Card 1 – Pacientes */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:scale-[1.01] transition-transform duration-300">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2 bg-orange-100 rounded-lg">
                <Icon n="groups" cls="text-orange-700 text-[24px]" />
              </span>
              <span className="text-orange-700 font-bold text-xs">{masculinos}M / {femininos}F</span>
            </div>
            <p className="text-sm font-semibold text-stone-500">Pacientes Ativos</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-extrabold text-stone-900">
                {loading ? '—' : total}
              </span>
              <span className="text-xs font-bold text-stone-400">pacientes</span>
            </div>
            <div className="mt-4 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${mascPct}%` }}
              />
            </div>
          </div>

          {/* Card 2 – Anamneses */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:scale-[1.01] transition-transform duration-300">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2 bg-violet-100 rounded-lg">
                <Icon n="pending_actions" cls="text-violet-700 text-[24px]" />
              </span>
              <span className="text-violet-700 font-bold text-xs">Clínicas</span>
            </div>
            <p className="text-sm font-semibold text-stone-500">Anamneses</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-extrabold text-stone-900">
                {loading ? '—' : anamnesesCount}
              </span>
              <span className="text-xs font-bold text-stone-400">registradas</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Icon n="clinical_notes" cls="text-violet-300 text-base" />
              <span className="text-xs text-stone-400">Histórico de anamneses</span>
            </div>
          </div>

          {/* Card 3 – Consultas pendentes */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="p-2 bg-sky-100 rounded-lg">
                <Icon n="show_chart" cls="text-sky-700 text-[24px]" />
              </span>
              <span className="text-stone-500 font-bold text-xs">Financeiro</span>
            </div>
            <p className="text-sm font-semibold text-stone-500">Consultas Pendentes</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-extrabold text-stone-900">
                {loading ? '—' : pendentes}
              </span>
              <span className="text-xs font-bold text-stone-400">aguardando</span>
            </div>
            {/* Sparkline */}
            <div className="absolute bottom-0 right-0 left-0 h-16 opacity-10 pointer-events-none">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0 80 Q 25 20, 50 60 T 100 30 L 100 100 L 0 100 Z" fill="#0ea5e9" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Recent Patients ── */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-stone-900">Pacientes Recentes</h3>
            <Link
              href="/pacientes"
              className="text-orange-700 font-bold text-sm flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              Ver todos <Icon n="arrow_forward" cls="text-[18px]" />
            </Link>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {loading ? (
                <p className="p-10 text-center text-stone-400 text-sm">Carregando...</p>
              ) : recentes.length === 0 ? (
                <p className="p-10 text-center text-stone-400 text-sm">Nenhum paciente cadastrado ainda.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Idade</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Sexo</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Cadastro</th>
                      <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {recentes.map(p => (
                      <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-50 border border-stone-200 flex items-center justify-center text-orange-800 font-bold text-sm flex-shrink-0">
                              {p.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900 text-sm">{p.nome}</p>
                              <p className="text-xs text-stone-400">#{p.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500">{idadeStr(p.data_nascimento)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            p.sexo === 'M'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}>
                            {p.sexo === 'M' ? 'Masculino' : 'Feminino'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500">
                          {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/pacientes/${p.id}`}
                            className="text-stone-400 hover:text-orange-700 transition-colors inline-flex"
                          >
                            <Icon n="open_in_new" cls="text-lg" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick action ── */}
        {podeAdicionarPaciente && (
          <Link
            href="/pacientes/novo"
            className="inline-flex items-center gap-2 bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-orange-800 active:scale-95 transition-all"
          >
            <Icon n="person_add" cls="text-base" />
            Novo Paciente
          </Link>
        )}
      </main>

      <BottomNav profile={profile} />
    </div>
  )
}
