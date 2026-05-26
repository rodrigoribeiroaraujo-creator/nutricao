'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPaciente, getMedicoes, createMedicao, deleteMedicao, getSession, getProfile, type Paciente, type Medicao, type Profile } from '@/lib/supabase'
import { WHO_IMC, WHO_PESO, WHO_ALTURA, classifyPercentile, calcIdadeAnos, getChartSeries } from '@/lib/who'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function idadeStr(dataNasc: string, dataRef?: string) {
  const anos = calcIdadeAnos(dataNasc, dataRef)
  if (anos < 2) return `${Math.round(anos * 12)} meses`
  return `${Math.floor(anos)} anos`
}

function zoneColor(zone: string) {
  if (zone === 'critical_low' || zone === 'critical_high') return 'text-red-600 bg-red-50'
  if (zone === 'low' || zone === 'high') return 'text-amber-600 bg-amber-50'
  return 'text-green-700 bg-green-50'
}

function CurvaChart({ paciente, medicoes, tipo }: { paciente: Paciente; medicoes: Medicao[]; tipo: 'imc'|'peso'|'altura' }) {
  if (medicoes.length === 0) return null
  const ageMax = calcIdadeAnos(paciente.data_nascimento)
  const dataset = tipo === 'imc' ? WHO_IMC : tipo === 'peso' ? WHO_PESO : WHO_ALTURA
  const { ages, p3, p15, p50, p85, p97 } = getChartSeries(dataset, paciente.sexo, ageMax)
  const curveData = ages.map((age: number, i: number) => ({ age: parseFloat(age.toFixed(2)), p3: p3[i], p15: p15[i], p50: p50[i], p85: p85[i], p97: p97[i] }))
  const patientPoints = medicoes.map(m => {
    const ageY = calcIdadeAnos(paciente.data_nascimento, m.data_medicao)
    const val = tipo === 'imc' ? m.imc : tipo === 'peso' ? m.peso_kg : m.altura_cm
    return { age: parseFloat(ageY.toFixed(2)), val }
  })
  const unit = tipo === 'imc' ? 'kg/m²' : tipo === 'peso' ? 'kg' : 'cm'
  return (
    <div className="bg-white border border-stone-100 rounded-xl p-4">
      <p className="text-xs text-stone-400 font-medium mb-3 uppercase tracking-wider">
        {tipo === 'imc' ? 'IMC' : tipo === 'peso' ? 'Peso' : 'Altura'} × Idade — OMS ({paciente.sexo === 'M' ? 'Masc.' : 'Fem.'})
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis dataKey="age" type="number" domain={['dataMin','dataMax']} tickFormatter={v => ageMax <= 2 ? `${Math.round(v*12)}m` : `${v}a`} tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={v => v.toFixed(0)} tick={{ fontSize: 10 }} width={32} />
          <Tooltip formatter={(v: any) => [`${parseFloat(v).toFixed(1)} ${unit}`]} />
          <Line data={curveData} dataKey="p97" stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 3" dot={false} name="P97" />
          <Line data={curveData} dataKey="p85" stroke="#fcd34d" strokeWidth={1} strokeDasharray="3 2" dot={false} name="P85" />
          <Line data={curveData} dataKey="p50" stroke="#86efac" strokeWidth={2} dot={false} name="P50" />
          <Line data={curveData} dataKey="p15" stroke="#fcd34d" strokeWidth={1} strokeDasharray="3 2" dot={false} name="P15" />
          <Line data={curveData} dataKey="p3"  stroke="#fca5a5" strokeWidth={1} strokeDasharray="4 3" dot={false} name="P3" />
          <Line data={patientPoints} dataKey="val" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 4, strokeWidth: 2, stroke: '#fff' }} name="Paciente" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function PacientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'imc'|'peso'|'altura'>('imc')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ data_medicao: new Date().toISOString().split('T')[0], peso_kg: '', altura_cm: '', observacoes: '' })

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/login'); return }
      const [prof, p, m] = await Promise.all([getProfile(session.user.id), getPaciente(id), getMedicoes(id)])
      setProfile(prof)
      setPaciente(p)
      setMedicoes(m)
      setLoading(false)
    }).catch(() => router.push('/'))
  }, [id, router])

  async function handleAddMedicao(e: React.FormEvent) {
    e.preventDefault()
    if (!paciente) return
    const peso = parseFloat(form.peso_kg); const alt = parseFloat(form.altura_cm)
    if (!peso || !alt) { setErro('Verifique peso e altura.'); return }
    setSaving(true); setErro('')
    try {
      const ageY = calcIdadeAnos(paciente.data_nascimento, form.data_medicao)
      const nova = await createMedicao({
        paciente_id: id, data_medicao: form.data_medicao, peso_kg: peso, altura_cm: alt,
        imc_percentil: classifyPercentile(peso/Math.pow(alt/100,2), ageY, WHO_IMC, paciente.sexo).label,
        peso_percentil: classifyPercentile(peso, ageY, WHO_PESO, paciente.sexo).label,
        altura_percentil: classifyPercentile(alt, ageY, WHO_ALTURA, paciente.sexo).label,
        observacoes: form.observacoes || undefined,
      })
      setMedicoes(m => [...m, nova].sort((a,b) => a.data_medicao.localeCompare(b.data_medicao)))
      setShowForm(false)
      setForm(f => ({ ...f, peso_kg: '', altura_cm: '', observacoes: '' }))
    } catch (err: any) { setErro(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-stone-400">Carregando...</p></div>
  if (!paciente) return null

  const ultima = medicoes[medicoes.length - 1]
  const ageAtLast = ultima ? calcIdadeAnos(paciente.data_nascimento, ultima.data_medicao) : null

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-stone-400 hover:text-stone-700">←</Link>
            <div>
              <h1 className="font-semibold leading-tight">{paciente.nome}</h1>
              <p className="text-xs text-stone-400">{paciente.sexo === 'M' ? 'Masculino' : 'Feminino'} · {idadeStr(paciente.data_nascimento)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile?.role !== 'assistente' && (
              <Link href={`/pacientes/${id}/editar`} className="border border-stone-200 text-stone-500 text-sm font-medium px-3 py-2 rounded-lg hover:bg-stone-50">
                Editar
              </Link>
            )}
            <button onClick={() => setShowForm(s => !s)} className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700">
              + Medição
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {showForm && (
          <form onSubmit={handleAddMedicao} className="bg-white border border-green-200 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-stone-700">Nova medição</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-stone-500 mb-1">Data</label>
                <input type="date" value={form.data_medicao} onChange={e => setForm(f => ({...f, data_medicao: e.target.value}))} className="w-full" required /></div>
              <div />
              <div><label className="block text-xs font-medium text-stone-500 mb-1">Peso (kg)</label>
                <input type="number" step="0.1" min="0.5" max="300" value={form.peso_kg} onChange={e => setForm(f => ({...f, peso_kg: e.target.value}))} placeholder="ex: 32.5" className="w-full" required /></div>
              <div><label className="block text-xs font-medium text-stone-500 mb-1">Altura (cm)</label>
                <input type="number" step="0.1" min="30" max="250" value={form.altura_cm} onChange={e => setForm(f => ({...f, altura_cm: e.target.value}))} placeholder="ex: 128" className="w-full" required /></div>
            </div>
            <div><label className="block text-xs font-medium text-stone-500 mb-1">Observações</label>
              <input type="text" value={form.observacoes} onChange={e => setForm(f => ({...f, observacoes: e.target.value}))} className="w-full" /></div>
            {erro && <p className="text-sm text-red-500">{erro}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white font-medium py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                {saving ? 'Salvando...' : 'Salvar medição'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 border border-stone-200 rounded-lg text-sm text-stone-500">Cancelar</button>
            </div>
          </form>
        )}
        {ultima && ageAtLast !== null && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'IMC', value: `${ultima.imc?.toFixed(1)}`, sub: ultima.imc_percentil, zone: classifyPercentile(ultima.imc, ageAtLast, WHO_IMC, paciente.sexo).zone },
              { label: 'Peso', value: `${ultima.peso_kg} kg`, sub: ultima.peso_percentil, zone: classifyPercentile(ultima.peso_kg, ageAtLast, WHO_PESO, paciente.sexo).zone },
              { label: 'Altura', value: `${ultima.altura_cm} cm`, sub: ultima.altura_percentil, zone: classifyPercentile(ultima.altura_cm, ageAtLast, WHO_ALTURA, paciente.sexo).zone },
            ].map(c => (
              <div key={c.label} className="bg-white border border-stone-100 rounded-xl p-4">
                <p className="text-xs text-stone-400 mb-1">{c.label}</p>
                <p className="font-semibold text-stone-800">{c.value}</p>
                {c.sub && <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium ${zoneColor(c.zone)}`}>{c.sub}</span>}
              </div>
            ))}
          </div>
        )}
        {medicoes.length > 0 && (
          <div>
            <div className="flex gap-2 mb-3">
              {(['imc','peso','altura'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === t ? 'bg-green-600 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}>
                  {t === 'imc' ? 'IMC' : t === 'peso' ? 'Peso' : 'Altura'}
                </button>
              ))}
            </div>
            <CurvaChart paciente={paciente} medicoes={medicoes} tipo={activeTab} />
          </div>
        )}
        <div>
          <h2 className="font-semibold text-stone-700 mb-3">📋 Histórico de medições</h2>
          {medicoes.length === 0 ? (
            <div className="bg-white border border-stone-100 rounded-xl p-8 text-center text-stone-400">
              <p className="text-sm">Nenhuma medição registrada.</p>
              <button onClick={() => setShowForm(true)} className="mt-2 text-green-600 text-sm hover:underline">Adicionar primeira medição →</button>
            </div>
          ) : (
            <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-xs text-stone-400 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-right">Peso</th>
                    <th className="px-4 py-3 text-right">Altura</th>
                    <th className="px-4 py-3 text-right">IMC</th>
                    <th className="px-4 py-3 text-left">Percentil</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {[...medicoes].reverse().map((m, i) => {
                    const ageY = calcIdadeAnos(paciente.data_nascimento, m.data_medicao)
                    const z = classifyPercentile(m.imc, ageY, WHO_IMC, paciente.sexo).zone
                    return (
                      <tr key={m.id} className="border-b border-stone-50 hover:bg-stone-50">
                        <td className="px-4 py-3 text-stone-600">
                          {new Date(m.data_medicao + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {i === 0 && <span className="ml-2 text-xs text-green-500 font-medium">recente</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{m.peso_kg} kg</td>
                        <td className="px-4 py-3 text-right font-medium">{m.altura_cm} cm</td>
                        <td className="px-4 py-3 text-right font-medium">{m.imc?.toFixed(1)}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${zoneColor(z)}`}>{m.imc_percentil ?? '–'}</span></td>
                        <td className="px-2 py-3">
                          {profile?.role === 'admin' && (
                            <button onClick={async () => { if(confirm('Remover?')) { await deleteMedicao(m.id); setMedicoes(ms => ms.filter(x => x.id !== m.id)) }}} className="text-stone-300 hover:text-red-400 p-1">✕</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
