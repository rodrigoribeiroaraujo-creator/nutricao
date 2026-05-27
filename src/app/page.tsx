'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPacientes, getAnamnesesTea, getSession, getProfile, type Paciente, type Profile } from '@/lib/supabase'
import { calcIdadeAnos } from '@/lib/who'
import BottomNav from '@/components/BottomNav'

const ROLE_LABEL: Record<Profile['role'], string> = {
  admin: 'Administrador',
  nutricionista: 'Nutricionista',
  assistente: 'Assistente',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function primeiroNome(email: string) {
  return email.split('@')[0].split('.')[0]
}

export default function Home() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [anamnesesCount, setAnamnesesCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
      const [pacs, anams] = await Promise.all([getPacientes(), getAnamnesesTea()])
      setPacientes(pacs)
      setAnamnesesCount(anams.length)
      setLoading(false)
    })
  }, [router])

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  const masculinos = pacientes.filter(p => p.sexo === 'M').length
  const femininos = pacientes.filter(p => p.sexo === 'F').length
  const total = pacientes.length

  const bebes = pacientes.filter(p => calcIdadeAnos(p.data_nascimento) < 2).length
  const criancas = pacientes.filter(p => {
    const a = calcIdadeAnos(p.data_nascimento)
    return a >= 2 && a < 6
  }).length
  const maiores = pacientes.filter(p => calcIdadeAnos(p.data_nascimento) >= 6).length

  const podeAdicionarPaciente = profile.role !== 'assistente'

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-base text-green-700">🌱 NutriCurvas</span>
          {podeAdicionarPaciente && (
            <Link href="/pacientes/novo" className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700">
              + Novo paciente
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-6 overflow-y-auto md:max-w-3xl md:w-full space-y-6">

        {/* Saudação */}
        <div>
          <p className="text-stone-400 text-sm">{greeting()},</p>
          <p className="font-semibold text-stone-800 text-lg capitalize">{primeiroNome(profile.email)}</p>
          <p className="text-xs text-stone-400">{ROLE_LABEL[profile.role]}</p>
        </div>

        {/* Cards de resumo */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="bg-stone-100 animate-pulse rounded-2xl h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-stone-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-green-700">{total}</p>
              <p className="text-xs text-stone-400 mt-0.5">Pacientes cadastrados</p>
            </div>
            <div className="bg-white border border-stone-100 rounded-2xl p-4">
              <p className="text-2xl font-bold text-purple-600">{anamnesesCount}</p>
              <p className="text-xs text-stone-400 mt-0.5">Anamneses registradas</p>
            </div>
            <div className="bg-white border border-stone-100 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 font-bold text-lg">{masculinos}</span>
                <span className="text-stone-300 text-sm">/</span>
                <span className="text-pink-500 font-bold text-lg">{femininos}</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">Masc. / Fem.</p>
            </div>
            <div className="bg-white border border-stone-100 rounded-2xl p-4">
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-stone-600 text-sm font-semibold">{bebes}</span>
                <span className="text-stone-300 text-xs">·</span>
                <span className="text-stone-600 text-sm font-semibold">{criancas}</span>
                <span className="text-stone-300 text-xs">·</span>
                <span className="text-stone-600 text-sm font-semibold">{maiores}</span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">&lt;2a · 2–5a · ≥6a</p>
            </div>
          </div>
        )}

        {/* Distribuição por sexo — barra visual */}
        {!loading && total > 0 && (
          <div className="bg-white border border-stone-100 rounded-2xl p-4">
            <p className="text-xs font-medium text-stone-500 mb-3">Distribuição por sexo</p>
            <div className="flex rounded-full overflow-hidden h-4 gap-0.5">
              {masculinos > 0 && (
                <div
                  className="bg-blue-400 transition-all"
                  style={{ width: `${(masculinos / total) * 100}%` }}
                />
              )}
              {femininos > 0 && (
                <div
                  className="bg-pink-400 transition-all"
                  style={{ width: `${(femininos / total) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="text-xs text-stone-500">Masculino ({masculinos})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400 flex-shrink-0" />
                <span className="text-xs text-stone-500">Feminino ({femininos})</span>
              </div>
            </div>
          </div>
        )}

        {/* Distribuição por faixa etária — barra visual */}
        {!loading && total > 0 && (
          <div className="bg-white border border-stone-100 rounded-2xl p-4">
            <p className="text-xs font-medium text-stone-500 mb-3">Distribuição por faixa etária</p>
            <div className="flex rounded-full overflow-hidden h-4 gap-0.5">
              {bebes > 0 && (
                <div className="bg-yellow-400" style={{ width: `${(bebes / total) * 100}%` }} />
              )}
              {criancas > 0 && (
                <div className="bg-green-400" style={{ width: `${(criancas / total) * 100}%` }} />
              )}
              {maiores > 0 && (
                <div className="bg-violet-400" style={{ width: `${(maiores / total) * 100}%` }} />
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-xs text-stone-500">&lt; 2 anos ({bebes})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs text-stone-500">2–5 anos ({criancas})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span className="text-xs text-stone-500">≥ 6 anos ({maiores})</span>
              </div>
            </div>
          </div>
        )}

        {/* Atalhos rápidos */}
        <div>
          <p className="text-xs font-medium text-stone-500 mb-3">Acesso rápido</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/pacientes"
              className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col gap-2 hover:border-green-200 hover:shadow-sm transition">
              <span className="text-2xl">👤</span>
              <p className="text-sm font-medium text-stone-700">Ver pacientes</p>
              <p className="text-xs text-stone-400">Lista completa</p>
            </Link>
            <Link href="/curvas"
              className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col gap-2 hover:border-green-200 hover:shadow-sm transition">
              <span className="text-2xl">📈</span>
              <p className="text-sm font-medium text-stone-700">Curvas de crescimento</p>
              <p className="text-xs text-stone-400">Z-score WHO</p>
            </Link>
            <Link href="/anamnese"
              className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col gap-2 hover:border-green-200 hover:shadow-sm transition">
              <span className="text-2xl">📋</span>
              <p className="text-sm font-medium text-stone-700">Anamnese</p>
              <p className="text-xs text-stone-400">Registros e histórico</p>
            </Link>
            <Link href="/financeiro"
              className="bg-white border border-stone-100 rounded-2xl p-4 flex flex-col gap-2 hover:border-green-200 hover:shadow-sm transition">
              <span className="text-2xl">💰</span>
              <p className="text-sm font-medium text-stone-700">Financeiro</p>
              <p className="text-xs text-stone-400">Consultas e pagamentos</p>
            </Link>
            {podeAdicionarPaciente && (
              <Link href="/pacientes/novo"
                className="bg-green-50 border border-green-100 rounded-2xl p-4 flex flex-col gap-2 hover:border-green-300 hover:shadow-sm transition">
                <span className="text-2xl">➕</span>
                <p className="text-sm font-medium text-green-700">Novo paciente</p>
                <p className="text-xs text-green-500">Cadastrar</p>
              </Link>
            )}
          </div>
        </div>

      </main>

      <BottomNav profile={profile} />
    </div>
  )
}
