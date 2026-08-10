'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getPaciente, getMedicoes, createMedicao, deleteMedicao, deletePaciente,
  getConsultasByPaciente, createConsulta, updateConsultaStatus, deleteConsulta,
  getSuplemtacoes, createSuplemtacao, deleteSuplemtacao,
  getSessoesByPaciente, createSessao, deleteSessao,
  getSession, getProfile,
  type Paciente, type Medicao, type Profile, type Consulta, type Suplementacao, type Sessao,
} from '@/lib/supabase'
import { WHO_IMC, WHO_PESO, WHO_ALTURA, classifyZScore, calcIdadeAnos, getChartSeries, getNutritionalStatus } from '@/lib/who'
import { NUTRIENTES_DRI, getEstagioVida, getDRI, type NutrienteDRI } from '@/lib/dri'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import BottomNav from '@/components/BottomNav'

type Tab = 'medicoes' | 'curvas' | 'suplementacao' | 'financeiro' | 'sessoes'

function idadeStr(dataNasc: string, dataRef?: string) {
  const anos = calcIdadeAnos(dataNasc, dataRef)
  if (anos < 2) return `${Math.round(anos * 12)} meses`
  return `${Math.floor(anos)} anos`
}

function zoneColor(zone: string) {
  if (zone === 'critical_low' || zone === 'critical_high') return 'text-red-600 bg-red-50'
  if (zone === 'low' || zone === 'very_high') return 'text-amber-600 bg-amber-50'
  if (zone === 'high') return 'text-yellow-600 bg-yellow-50'
  return 'text-orange-800 bg-orange-50'
}

function fmt(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_LABEL: Record<Consulta['status'], string> = { pago: 'Pago', pendente: 'Pendente', cancelado: 'Cancelado' }
const STATUS_COLOR: Record<Consulta['status'], string> = {
  pago: 'bg-orange-50 text-orange-800 border-orange-200',
  pendente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelado: 'bg-red-50 text-red-500 border-red-200',
}

function CurvaChart({ paciente, medicoes, tipo }: { paciente: Paciente; medicoes: Medicao[]; tipo: 'imc' | 'peso' | 'altura' }) {
  if (medicoes.length === 0) return null
  const ageMax = calcIdadeAnos(paciente.data_nascimento)
  const dataset = tipo === 'imc' ? WHO_IMC : tipo === 'peso' ? WHO_PESO : WHO_ALTURA
  const { ages, zm3, zm2, z0, zp2, zp3 } = getChartSeries(dataset, paciente.sexo, ageMax)
  const maxDataAge = Math.max(...ages)
  if (ageMax > maxDataAge) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
        <p className="text-sm text-amber-700 font-medium">Curvas OMS não disponíveis para esta faixa etária.</p>
        <p className="text-xs text-amber-500 mt-1">Referência disponível até {Math.floor(maxDataAge)} anos.</p>
      </div>
    )
  }
  const curveData = ages.map((age: number, i: number) => ({ age: parseFloat(age.toFixed(2)), zm3: zm3[i], zm2: zm2[i], z0: z0[i], zp2: zp2[i], zp3: zp3[i] }))
  const patientPoints = medicoes.map(m => {
    const ageY = calcIdadeAnos(paciente.data_nascimento, m.data_medicao)
    const val = tipo === 'imc' ? m.imc : tipo === 'peso' ? m.peso_kg : m.altura_cm
    return { age: parseFloat(ageY.toFixed(2)), val }
  })
  const unit = tipo === 'imc' ? 'kg/m²' : tipo === 'peso' ? 'kg' : 'cm'
  const yMin = parseFloat((Math.min(...zm3) * 0.94).toFixed(1))
  const yMax = parseFloat((Math.max(...zp3) * 1.04).toFixed(1))
  return (
    <div className="bg-white border border-stone-100 rounded-xl p-4">
      <p className="text-xs text-stone-400 font-medium mb-3 uppercase tracking-wider">
        {tipo === 'imc' ? 'IMC' : tipo === 'peso' ? 'Peso' : 'Altura'} × Idade — OMS ({paciente.sexo === 'M' ? 'Masc.' : 'Fem.'})
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
          <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']} tickFormatter={v => ageMax <= 2 ? `${Math.round(v * 12)}m` : `${v}a`} tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#d6d3d1' }} />
          <YAxis domain={[yMin, yMax]} tickFormatter={v => v.toFixed(0)} tick={{ fontSize: 10 }} width={34} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v: any) => [`${parseFloat(v).toFixed(1)} ${unit}`]} />
          <Line data={curveData} dataKey="zp3" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="+3 DP" />
          <Line data={curveData} dataKey="zp2" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="+2 DP" />
          <Line data={curveData} dataKey="z0" stroke="#16a34a" strokeWidth={2.5} dot={false} name="Mediana" />
          <Line data={curveData} dataKey="zm2" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="-2 DP" />
          <Line data={curveData} dataKey="zm3" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="-3 DP" />
          <Line data={patientPoints} dataKey="val" stroke="#1d4ed8" strokeWidth={2} dot={{ fill: '#1d4ed8', r: 5, strokeWidth: 2, stroke: '#fff' }} name="Paciente" connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {[['#ef4444', '±3 DP'], ['#f97316', '±2 DP'], ['#16a34a', 'Mediana'], ['#1d4ed8', 'Paciente']].map(([color, lbl]) => (
          <div key={lbl} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-stone-400">{lbl}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PacientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('medicoes')
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [suplementacoes, setSuplemtacoes] = useState<Suplementacao[]>([])
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeChartTab, setActiveChartTab] = useState<'imc' | 'peso' | 'altura'>('imc')

  // medição
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ data_medicao: new Date().toISOString().split('T')[0], peso_kg: '', altura_cm: '', observacoes: '' })

  // financeiro
  const [showConsultaForm, setShowConsultaForm] = useState(false)
  const [savingConsulta, setSavingConsulta] = useState(false)
  const [erroConsulta, setErroConsulta] = useState('')
  const [consultaForm, setConsultaForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    valor: '',
    status: 'pendente' as Consulta['status'],
    descricao: '',
  })

  // sessões
  const [showSessaoForm, setShowSessaoForm] = useState(false)
  const [savingSessao, setSavingSessao] = useState(false)
  const [sessaoForm, setSessaoForm] = useState({
    data_sessao: new Date().toISOString().slice(0, 10),
    peso_kg: '',
    adesao: '' as string,
    humor: '' as Sessao['humor'] | '',
    observacoes: '',
    metas_proximas: '',
  })

  // suplementação
  const [showSuplModal, setShowSuplModal] = useState(false)
  const [selectedNutriente, setSelectedNutriente] = useState<NutrienteDRI | null>(null)
  const [dose, setDose] = useState('')
  const [obsSupl, setObsSupl] = useState('')
  const [savingSupl, setSavingSupl] = useState(false)
  const [erroSupl, setErroSupl] = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const [prof, p, m, cs, sups, sess] = await Promise.all([
        getProfile(session.user.id),
        getPaciente(id),
        getMedicoes(id),
        getConsultasByPaciente(id),
        getSuplemtacoes(id),
        getSessoesByPaciente(id),
      ])
      setProfile(prof)
      setPaciente(p)
      setMedicoes(m)
      setConsultas(cs)
      setSuplemtacoes(sups)
      setSessoes(sess)
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
        imc_percentil: classifyZScore(peso / Math.pow(alt / 100, 2), ageY, WHO_IMC, 'imc', paciente.sexo).label,
        peso_percentil: classifyZScore(peso, ageY, WHO_PESO, 'peso', paciente.sexo).label,
        altura_percentil: classifyZScore(alt, ageY, WHO_ALTURA, 'altura', paciente.sexo).label,
        observacoes: form.observacoes || undefined,
      })
      setMedicoes(m => [...m, nova].sort((a, b) => a.data_medicao.localeCompare(b.data_medicao)))
      setShowForm(false)
      setForm(f => ({ ...f, peso_kg: '', altura_cm: '', observacoes: '' }))
    } catch (err: any) { setErro(err.message) }
    finally { setSaving(false) }
  }

  async function handleAddConsulta(e: React.FormEvent) {
    e.preventDefault()
    setSavingConsulta(true); setErroConsulta('')
    try {
      const nova = await createConsulta({
        paciente_id: id,
        data: consultaForm.data,
        valor: parseFloat(consultaForm.valor.replace(',', '.')),
        status: consultaForm.status,
        descricao: consultaForm.descricao || null,
      })
      setConsultas(cs => [nova, ...cs])
      setShowConsultaForm(false)
      setConsultaForm(f => ({ ...f, valor: '', descricao: '' }))
    } catch (err: any) { setErroConsulta(err.message) }
    finally { setSavingConsulta(false) }
  }

  async function handleConsultaStatus(consultaId: string, status: Consulta['status']) {
    await updateConsultaStatus(consultaId, status)
    setConsultas(cs => cs.map(c => c.id === consultaId ? { ...c, status } : c))
  }

  async function handleDeleteConsulta(consultaId: string) {
    if (!confirm('Remover esta consulta?')) return
    await deleteConsulta(consultaId)
    setConsultas(cs => cs.filter(c => c.id !== consultaId))
  }

  async function handleDeletePaciente() {
    if (!confirm(`Excluir "${paciente?.nome}" permanentemente? Todas as medições e consultas também serão removidas.`)) return
    await deletePaciente(id)
    router.replace('/pacientes')
  }

  function handleSelectNutriente(n: NutrienteDRI) {
    setSelectedNutriente(n)
    if (paciente) {
      const estagio = getEstagioVida(calcIdadeAnos(paciente.data_nascimento), paciente.sexo)
      const dri = getDRI(n.id, estagio)
      setDose(dri?.rda != null ? String(dri.rda) : '')
    }
  }

  async function handleSaveSupl(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNutriente || !paciente || !userId) return
    const dosePrescrita = parseFloat(dose.replace(',', '.'))
    if (!dosePrescrita || dosePrescrita <= 0) { setErroSupl('Informe uma dose válida.'); return }
    const estagio = getEstagioVida(calcIdadeAnos(paciente.data_nascimento), paciente.sexo)
    const dri = getDRI(selectedNutriente.id, estagio)
    setSavingSupl(true); setErroSupl('')
    try {
      const nova = await createSuplemtacao({
        paciente_id: id,
        nutriente_id: selectedNutriente.id,
        nutriente_nome: selectedNutriente.nome,
        unidade: selectedNutriente.unidade,
        dose_prescrita: dosePrescrita,
        dose_dri: dri?.rda ?? null,
        ul: dri?.ul ?? null,
        is_ai: dri?.isAI ?? false,
        observacoes: obsSupl || null,
        created_by: userId,
      })
      setSuplemtacoes(s => [...s, nova].sort((a, b) => a.nutriente_nome.localeCompare(b.nutriente_nome)))
      setShowSuplModal(false)
      setSelectedNutriente(null)
      setDose('')
      setObsSupl('')
    } catch (err: any) { setErroSupl(err.message) }
    finally { setSavingSupl(false) }
  }

  async function handleDeleteSupl(supId: string, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return
    await deleteSuplemtacao(supId)
    setSuplemtacoes(s => s.filter(x => x.id !== supId))
  }

  async function handleAddSessao(e: React.FormEvent) {
    e.preventDefault()
    setSavingSessao(true)
    // Open the PDF tab immediately (while still in the user gesture) so browsers allow it
    const pdfTab = window.open('', '_blank')
    try {
      const nova = await createSessao({
        paciente_id: id,
        data_sessao: sessaoForm.data_sessao,
        numero_sessao: sessoes.length + 1,
        peso_kg: sessaoForm.peso_kg ? parseFloat(sessaoForm.peso_kg) : null,
        adesao: sessaoForm.adesao ? parseInt(sessaoForm.adesao) : null,
        humor: (sessaoForm.humor || null) as Sessao['humor'],
        observacoes: sessaoForm.observacoes || null,
        metas_proximas: sessaoForm.metas_proximas || null,
        created_by: userId,
      })
      setSessoes(s => [nova, ...s])
      setShowSessaoForm(false)
      setSessaoForm({ data_sessao: new Date().toISOString().slice(0, 10), peso_kg: '', adesao: '', humor: '', observacoes: '', metas_proximas: '' })
      if (pdfTab) pdfTab.location.href = `/pacientes/${id}/sessoes/${nova.id}/pdf`
    } catch {
      pdfTab?.close()
    } finally { setSavingSessao(false) }
  }

  async function handleDeleteSessao(sessaoId: string) {
    if (!confirm('Excluir registro de sessão?')) return
    await deleteSessao(sessaoId)
    setSessoes(s => s.filter(x => x.id !== sessaoId))
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-stone-400">Carregando...</p></div>
  if (!paciente) return null

  const ultima = medicoes[medicoes.length - 1]
  const ageAtLast = ultima ? calcIdadeAnos(paciente.data_nascimento, ultima.data_medicao) : null
  const podeEditar = profile?.role !== 'assistente'
  const totalPago = consultas.filter(c => c.status === 'pago').reduce((s, c) => s + c.valor, 0)
  const totalPendente = consultas.filter(c => c.status === 'pendente').reduce((s, c) => s + c.valor, 0)
  const nutrientesDisponiveis = NUTRIENTES_DRI.filter(n => !suplementacoes.some(s => s.nutriente_id === n.id))
  const driPreview = selectedNutriente && paciente
    ? getDRI(selectedNutriente.id, getEstagioVida(calcIdadeAnos(paciente.data_nascimento), paciente.sexo))
    : null

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: 'medicoes', label: 'Medições' },
    { key: 'curvas', label: 'Curvas' },
    { key: 'suplementacao', label: 'Suplementação', badge: suplementacoes.length || undefined },
    { key: 'sessoes', label: 'Sessões', badge: sessoes.length || undefined },
    { key: 'financeiro', label: 'Financeiro' },
  ]

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/pacientes" className="flex-shrink-0 text-orange-700">
              <span className="material-symbols-outlined leading-none select-none" style={{ fontSize: '22px' }}>clinical_notes</span>
            </Link>
            <div>
              <h1 className="font-semibold leading-tight">{paciente.nome}</h1>
              <p className="text-xs text-stone-400">{paciente.sexo === 'M' ? 'Masculino' : 'Feminino'} · {idadeStr(paciente.data_nascimento)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {podeEditar && (
              <>
                <Link href={`/pacientes/${id}/editar`} className="border border-stone-200 text-stone-500 text-sm font-medium px-3 py-2 rounded-lg hover:bg-stone-50">
                  Editar
                </Link>
                <button onClick={handleDeletePaciente} className="border border-red-200 text-red-400 p-2 rounded-lg hover:bg-red-50" title="Excluir paciente">
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </>
            )}
            {tab === 'medicoes' && (
              <button onClick={() => setShowForm(s => !s)} className="bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-800">
                + Medição
              </button>
            )}
            {tab === 'suplementacao' && podeEditar && nutrientesDisponiveis.length > 0 && (
              <button onClick={() => { setShowSuplModal(true); setSelectedNutriente(null); setDose(''); setObsSupl(''); setErroSupl('') }}
                className="bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-800">
                + Adicionar
              </button>
            )}
            {tab === 'financeiro' && podeEditar && (
              <button onClick={() => { setShowConsultaForm(s => !s); setErroConsulta('') }}
                className="bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-800">
                + Consulta
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-3xl mx-auto overflow-x-auto scrollbar-none">
          <div className="flex gap-1 px-4 min-w-max">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-orange-700 text-orange-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>
                {t.label}
                {t.badge ? (
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{t.badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-6 pb-28 md:pb-6 overflow-y-auto">

        {/* ── Tab: Medições ── */}
        {tab === 'medicoes' && (
          <>
            {showForm && (
              <form onSubmit={handleAddMedicao} className="bg-white border border-orange-200 rounded-2xl p-5 space-y-4">
                <h2 className="font-semibold text-stone-700">Nova medição</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-stone-500 mb-1">Data</label>
                    <input type="date" value={form.data_medicao} onChange={e => setForm(f => ({ ...f, data_medicao: e.target.value }))} className="w-full" required /></div>
                  <div />
                  <div><label className="block text-xs font-medium text-stone-500 mb-1">Peso (kg)</label>
                    <input type="number" step="0.1" min="0.5" max="300" value={form.peso_kg} onChange={e => setForm(f => ({ ...f, peso_kg: e.target.value }))} placeholder="ex: 32.5" className="w-full" required /></div>
                  <div><label className="block text-xs font-medium text-stone-500 mb-1">Altura (cm)</label>
                    <input type="number" step="0.1" min="30" max="250" value={form.altura_cm} onChange={e => setForm(f => ({ ...f, altura_cm: e.target.value }))} placeholder="ex: 128" className="w-full" required /></div>
                </div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Observações</label>
                  <input type="text" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className="w-full" /></div>
                {erro && <p className="text-sm text-red-500">{erro}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="flex-1 bg-orange-700 text-white font-medium py-2.5 rounded-lg hover:bg-orange-800 disabled:opacity-50 text-sm">
                    {saving ? 'Salvando...' : 'Salvar medição'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 border border-stone-200 rounded-lg text-sm text-stone-500">Cancelar</button>
                </div>
              </form>
            )}

            {ultima && ageAtLast !== null && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'IMC', value: `${ultima.imc?.toFixed(1)}`, unit: 'kg/m²', tipo: 'imc' as const, dataset: WHO_IMC, raw: ultima.imc },
                  { label: 'Peso', value: `${ultima.peso_kg}`, unit: 'kg', tipo: 'peso' as const, dataset: WHO_PESO, raw: ultima.peso_kg },
                  { label: 'Altura', value: `${ultima.altura_cm}`, unit: 'cm', tipo: 'altura' as const, dataset: WHO_ALTURA, raw: ultima.altura_cm },
                ].map(c => {
                  const { zone } = classifyZScore(c.raw, ageAtLast, c.dataset, c.tipo, paciente.sexo)
                  const status = getNutritionalStatus(zone, c.tipo, ageAtLast)
                  return (
                    <div key={c.label} className="bg-white border border-stone-100 rounded-xl p-3 flex flex-col">
                      <p className="text-[10px] text-stone-400 mb-1 uppercase tracking-wide">{c.label}</p>
                      <p className="font-semibold text-stone-800 text-sm leading-tight">{c.value} <span className="text-[10px] font-normal text-stone-400">{c.unit}</span></p>
                      <p className={`text-[10px] mt-1.5 font-semibold leading-tight truncate ${zoneColor(zone).split(' ')[0]}`}>{status}</p>
                    </div>
                  )
                })}
              </div>
            )}

            {medicoes.length > 0 && (
              <div>
                <div className="flex gap-2 mb-3">
                  {(['imc', 'peso', 'altura'] as const).map(t => (
                    <button key={t} onClick={() => setActiveChartTab(t)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeChartTab === t ? 'bg-orange-700 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}>
                      {t === 'imc' ? 'IMC' : t === 'peso' ? 'Peso' : 'Altura'}
                    </button>
                  ))}
                </div>
                <CurvaChart paciente={paciente} medicoes={medicoes} tipo={activeChartTab} />
              </div>
            )}

            <div>
              <h2 className="font-semibold text-stone-700 mb-3">Histórico de medições</h2>
              {medicoes.length === 0 ? (
                <div className="bg-white border border-stone-100 rounded-xl p-8 text-center text-stone-400">
                  <p className="text-sm">Nenhuma medição registrada.</p>
                  <button onClick={() => setShowForm(true)} className="mt-2 text-orange-700 text-sm hover:underline">Adicionar primeira medição →</button>
                </div>
              ) : (
                <div className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-xs text-stone-400 uppercase tracking-wider">
                        <th className="px-3 py-3 text-left">Data</th>
                        <th className="px-3 py-3 text-right">Peso</th>
                        <th className="px-3 py-3 text-right">Altura</th>
                        <th className="px-3 py-3 text-right">IMC</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {medicoes.map((m, i) => {
                        const ageY = calcIdadeAnos(paciente.data_nascimento, m.data_medicao)
                        const z = classifyZScore(m.imc, ageY, WHO_IMC, 'imc', paciente.sexo).zone
                        return (
                          <tr key={m.id} className="border-b border-stone-50 hover:bg-stone-50">
                            <td className="px-3 py-3 text-stone-600 text-xs">
                              {new Date(m.data_medicao + 'T12:00:00').toLocaleDateString('pt-BR')}
                              {i === medicoes.length - 1 && <span className="ml-1 text-orange-600 font-medium">recente</span>}
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-sm">{m.peso_kg} kg</td>
                            <td className="px-3 py-3 text-right font-medium text-sm">{m.altura_cm} cm</td>
                            <td className="px-3 py-3 text-right font-medium text-sm">{m.imc?.toFixed(1)}</td>
                            <td className="px-2 py-3">
                              {profile?.role === 'admin' && (
                                <button onClick={async () => { if (confirm('Remover?')) { await deleteMedicao(m.id); setMedicoes(ms => ms.filter(x => x.id !== m.id)) } }} className="text-stone-300 hover:text-red-400 p-1">✕</button>
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
          </>
        )}

        {/* ── Tab: Curvas ── */}
        {tab === 'curvas' && (
          <>
            {medicoes.length === 0 ? (
              <div className="bg-white border border-stone-100 rounded-xl p-10 text-center text-stone-400">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-sm">Nenhuma medição registrada.</p>
                <button onClick={() => setTab('medicoes')} className="mt-2 text-orange-700 text-sm hover:underline">
                  Ir para Medições →
                </button>
              </div>
            ) : ultima && ageAtLast !== null ? (
              <>
                {/* Cards de classificação para cada métrica */}
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { label: 'IMC', tipo: 'imc' as const, dataset: WHO_IMC, raw: ultima.imc, unit: 'kg/m²', value: ultima.imc?.toFixed(1) },
                      { label: 'Peso', tipo: 'peso' as const, dataset: WHO_PESO, raw: ultima.peso_kg, unit: 'kg', value: `${ultima.peso_kg}` },
                      { label: 'Altura', tipo: 'altura' as const, dataset: WHO_ALTURA, raw: ultima.altura_cm, unit: 'cm', value: `${ultima.altura_cm}` },
                    ] as const
                  ).map(c => {
                    const { zone, label: zLabel } = classifyZScore(c.raw, ageAtLast, c.dataset, c.tipo, paciente.sexo)
                    const status = getNutritionalStatus(zone, c.tipo, ageAtLast)
                    const colorClass =
                      zone === 'critical_low' || zone === 'critical_high' ? 'border-red-200 bg-red-50 text-red-700' :
                      zone === 'low' || zone === 'very_high' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                      zone === 'high' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                      'border-orange-200 bg-orange-50 text-orange-800'
                    return (
                      <div key={c.label}
                        onClick={() => setActiveChartTab(c.tipo)}
                        className={`border rounded-xl p-3 cursor-pointer transition-all ${colorClass} ${activeChartTab === c.tipo ? 'ring-2 ring-orange-400 ring-offset-1' : 'opacity-80 hover:opacity-100'}`}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">{c.label}</p>
                        <p className="font-bold text-base leading-tight mt-0.5">{c.value} <span className="text-[10px] font-normal opacity-60">{c.unit}</span></p>
                        <p className="text-[10px] font-semibold mt-1 leading-tight">{status}</p>
                        <p className="text-[10px] opacity-50 mt-0.5">{zLabel}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Seletor de gráfico */}
                <div className="flex gap-2">
                  {(['imc', 'peso', 'altura'] as const).map(t => (
                    <button key={t} onClick={() => setActiveChartTab(t)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${activeChartTab === t ? 'bg-orange-700 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}>
                      {t === 'imc' ? 'IMC' : t === 'peso' ? 'Peso' : 'Altura'}
                    </button>
                  ))}
                </div>

                <CurvaChart paciente={paciente} medicoes={medicoes} tipo={activeChartTab} />
              </>
            ) : null}
          </>
        )}

        {/* ── Tab: Suplementação ── */}
        {tab === 'suplementacao' && (
          <>
            {suplementacoes.length === 0 ? (
              <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
                <p className="text-stone-400 text-sm mb-2">Nenhum suplemento prescrito.</p>
                {podeEditar && (
                  <button onClick={() => { setShowSuplModal(true); setSelectedNutriente(null); setDose(''); setObsSupl(''); setErroSupl('') }}
                    className="text-orange-700 text-sm hover:underline">
                    Adicionar suplemento →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {suplementacoes.map(s => {
                  const excessoUL = s.ul != null && s.dose_prescrita > s.ul
                  const pctDRI = s.dose_dri ? Math.round((s.dose_prescrita / s.dose_dri) * 100) : null
                  return (
                    <div key={s.id} className={`bg-white border rounded-2xl p-4 ${excessoUL ? 'border-red-200' : 'border-stone-100'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800">{s.nutriente_nome}</p>
                          <p className="text-2xl font-bold text-orange-700 mt-1">
                            {s.dose_prescrita} <span className="text-sm font-normal text-stone-400">{s.unidade}</span>
                          </p>
                          {s.dose_dri != null && (
                            <p className="text-xs text-stone-400 mt-1">
                              {s.is_ai ? 'AI' : 'RDA'}: {s.dose_dri} {s.unidade}
                              {pctDRI != null && (
                                <span className={`ml-1.5 font-medium ${pctDRI > 100 ? 'text-orange-600' : 'text-stone-500'}`}>
                                  ({pctDRI}% da referência)
                                </span>
                              )}
                            </p>
                          )}
                          {s.ul != null && (
                            <p className={`text-xs mt-0.5 ${excessoUL ? 'text-red-500 font-medium' : 'text-stone-400'}`}>
                              {excessoUL ? '⚠ ' : ''}UL: {s.ul} {s.unidade}{excessoUL && ' — acima do limite!'}
                            </p>
                          )}
                          {s.observacoes && <p className="text-xs text-stone-500 mt-1.5 italic">{s.observacoes}</p>}
                        </div>
                        {podeEditar && (
                          <button onClick={() => handleDeleteSupl(s.id, s.nutriente_nome)} className="text-stone-300 hover:text-red-400 p-1 flex-shrink-0">
                            <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-stone-400 text-center pt-2">
                  Referências DRI: Padovani et al., Rev. Nutr. 2006;19(6):741-760
                </p>
                <button
                  onClick={() => window.open(`/pacientes/${id}/suplementacao/pdf`, '_blank')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-orange-200 text-orange-700 text-sm font-semibold bg-orange-50 hover:bg-orange-100 transition"
                >
                  <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>picture_as_pdf</span>
                  Exportar PDF
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Sessões ── */}
        {tab === 'sessoes' && (
          <>
            {podeEditar && (
              <button onClick={() => setShowSessaoForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition">
                <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>add</span>
                Registrar sessão
              </button>
            )}

            {showSessaoForm && podeEditar && (
              <form onSubmit={handleAddSessao} className="bg-white border border-orange-200 rounded-2xl p-4 space-y-3">
                <p className="font-medium text-stone-700 text-sm">Sessão #{sessoes.length + 1}</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Data</label>
                    <input type="date" value={sessaoForm.data_sessao} onChange={e => setSessaoForm(f => ({ ...f, data_sessao: e.target.value }))} required className="w-full text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Peso (kg)</label>
                    <input type="text" inputMode="decimal" placeholder="Ex: 32.5" value={sessaoForm.peso_kg} onChange={e => setSessaoForm(f => ({ ...f, peso_kg: e.target.value }))} className="w-full text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Adesão ao plano</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setSessaoForm(f => ({ ...f, adesao: String(n) }))}
                        className={`flex-1 py-2 rounded-lg border text-sm font-bold transition ${sessaoForm.adesao === String(n) ? 'bg-orange-700 text-white border-orange-700' : 'bg-white text-stone-400 border-stone-200'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">1 = péssima · 5 = ótima</p>
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Humor</label>
                  <div className="flex gap-2">
                    {([['otimo','😄'],['bom','🙂'],['neutro','😐'],['ruim','😕'],['pessimo','😞']] as [Sessao['humor'], string][]).map(([v, emoji]) => (
                      <button key={v} type="button" onClick={() => setSessaoForm(f => ({ ...f, humor: v }))}
                        className={`flex-1 py-2 rounded-lg border text-lg transition ${sessaoForm.humor === v ? 'bg-orange-50 border-orange-400' : 'bg-white border-stone-200'}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Observações</label>
                  <textarea value={sessaoForm.observacoes} onChange={e => setSessaoForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} placeholder="Como foi a sessão..." className="w-full text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs text-stone-500 block mb-1">Metas para próxima semana</label>
                  <textarea value={sessaoForm.metas_proximas} onChange={e => setSessaoForm(f => ({ ...f, metas_proximas: e.target.value }))} rows={2} placeholder="O que o paciente vai trabalhar..." className="w-full text-sm resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowSessaoForm(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 text-sm font-medium">Cancelar</button>
                  <button type="submit" disabled={savingSessao} className="flex-1 py-2.5 rounded-xl bg-orange-700 text-white text-sm font-medium disabled:opacity-50">
                    {savingSessao ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            )}

            {sessoes.length === 0 && !showSessaoForm ? (
              <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
                <p className="text-stone-400 text-sm">Nenhuma sessão registrada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessoes.map(s => {
                  const HUMOR_EMOJI: Record<string, string> = { otimo: '😄', bom: '🙂', neutro: '😐', ruim: '😕', pessimo: '😞' }
                  return (
                    <div key={s.id} className="bg-white border border-stone-100 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-semibold text-orange-700 text-sm">Sessão #{s.numero_sessao}</span>
                          <span className="text-xs text-stone-400 ml-2">{new Date(s.data_sessao + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.humor && <span className="text-lg leading-none">{HUMOR_EMOJI[s.humor]}</span>}
                          {podeEditar && (
                            <button onClick={() => handleDeleteSessao(s.id)} className="text-stone-300 hover:text-red-400">
                              <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs mb-2">
                        {s.peso_kg != null && <span className="text-stone-600"><span className="text-stone-400">Peso:</span> {s.peso_kg} kg</span>}
                        {s.adesao != null && (
                          <span className="text-stone-600">
                            <span className="text-stone-400">Adesão:</span>{' '}
                            <span className="font-bold text-orange-700">{s.adesao}/5</span>
                          </span>
                        )}
                      </div>
                      {s.observacoes && <p className="text-xs text-stone-600 mb-1.5">{s.observacoes}</p>}
                      {s.metas_proximas && (
                        <div className="bg-orange-50 rounded-lg px-3 py-2 mt-2">
                          <p className="text-xs text-stone-500 font-medium mb-0.5">Metas da próxima semana</p>
                          <p className="text-xs text-stone-700">{s.metas_proximas}</p>
                        </div>
                      )}
                      <button
                        onClick={() => window.open(`/pacientes/${id}/sessoes/${s.id}/pdf`, '_blank')}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-orange-200 text-orange-700 text-xs font-semibold bg-orange-50 hover:bg-orange-100 transition"
                      >
                        <span className="material-symbols-outlined leading-none" style={{ fontSize: '15px' }}>picture_as_pdf</span>
                        Exportar relatório
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Tab: Financeiro ── */}
        {tab === 'financeiro' && (
          <>
            {consultas.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-stone-100 rounded-xl p-3">
                  <p className="text-base font-bold text-orange-800">{fmt(totalPago)}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Recebido</p>
                </div>
                <div className="bg-white border border-stone-100 rounded-xl p-3">
                  <p className="text-base font-bold text-yellow-600">{fmt(totalPendente)}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Pendente</p>
                </div>
              </div>
            )}

            {showConsultaForm && (
              <form onSubmit={handleAddConsulta} className="bg-white border border-orange-200 rounded-2xl p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Data</label>
                    <input type="date" value={consultaForm.data} onChange={e => setConsultaForm(f => ({ ...f, data: e.target.value }))} required className="w-full text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Valor (R$)</label>
                    <input type="text" inputMode="decimal" placeholder="0,00" value={consultaForm.valor} onChange={e => setConsultaForm(f => ({ ...f, valor: e.target.value }))} required className="w-full text-sm" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Status</label>
                    <select value={consultaForm.status} onChange={e => setConsultaForm(f => ({ ...f, status: e.target.value as Consulta['status'] }))} className="w-full text-sm">
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Descrição</label>
                    <input type="text" placeholder="Ex: Retorno…" value={consultaForm.descricao} onChange={e => setConsultaForm(f => ({ ...f, descricao: e.target.value }))} className="w-full text-sm" />
                  </div>
                </div>
                {erroConsulta && <p className="text-sm text-red-500">{erroConsulta}</p>}
                <button type="submit" disabled={savingConsulta} className="w-full bg-orange-700 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-orange-800 disabled:opacity-50">
                  {savingConsulta ? 'Salvando…' : 'Salvar consulta'}
                </button>
              </form>
            )}

            {consultas.length === 0 && !showConsultaForm ? (
              <div className="bg-white border border-stone-100 rounded-xl p-6 text-center text-stone-400">
                <p className="text-sm">Nenhuma consulta registrada.</p>
                {podeEditar && (
                  <button onClick={() => setShowConsultaForm(true)} className="mt-2 text-orange-700 text-sm hover:underline">
                    Registrar primeira consulta →
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {consultas.map(c => (
                  <li key={c.id} className="bg-white border border-stone-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">
                        {new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {c.descricao ? <span className="text-stone-400 font-normal"> · {c.descricao}</span> : null}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">{fmt(c.valor)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {podeEditar ? (
                        <select value={c.status} onChange={e => handleConsultaStatus(c.id, e.target.value as Consulta['status'])}
                          className={`text-xs font-medium border rounded-full px-2.5 py-1 ${STATUS_COLOR[c.status]}`}>
                          <option value="pendente">Pendente</option>
                          <option value="pago">Pago</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                      )}
                      {podeEditar && (
                        <button onClick={() => handleDeleteConsulta(c.id)} className="text-stone-300 hover:text-red-400 text-xs p-1">✕</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      <BottomNav profile={profile!} />

      {/* Modal suplementação */}
      {showSuplModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setShowSuplModal(false)}>
          <div className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl px-6 pt-6"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-800">Adicionar suplemento</h2>
              <button onClick={() => setShowSuplModal(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSaveSupl} className="space-y-4">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Nutriente</label>
                <select value={selectedNutriente?.id ?? ''} onChange={e => {
                  const n = NUTRIENTES_DRI.find(x => x.id === e.target.value)
                  if (n) handleSelectNutriente(n); else setSelectedNutriente(null)
                }} required className="w-full text-sm">
                  <option value="">Selecione...</option>
                  {['Vitamina', 'Mineral'].map(cat => (
                    <optgroup key={cat} label={cat}>
                      {nutrientesDisponiveis.filter(n => n.categoria === cat).map(n => (
                        <option key={n.id} value={n.id}>{n.nome} ({n.unidade})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {driPreview && selectedNutriente && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-xs text-stone-600 space-y-0.5">
                  <p className="font-medium text-orange-800">{selectedNutriente.nome} — referência DRI</p>
                  <p>{driPreview.isAI ? 'AI' : 'RDA'}: {driPreview.rda ?? '—'} {selectedNutriente.unidade}</p>
                  {driPreview.ul != null && <p>UL (máximo): {driPreview.ul} {selectedNutriente.unidade}</p>}
                  {selectedNutriente.nota && <p className="text-stone-400 italic">{selectedNutriente.nota}</p>}
                </div>
              )}

              <div>
                <label className="text-xs text-stone-500 block mb-1">
                  Dose prescrita {selectedNutriente ? `(${selectedNutriente.unidade})` : ''}
                </label>
                <input type="text" inputMode="decimal" value={dose} onChange={e => setDose(e.target.value)} placeholder="0" required className="w-full" />
                {driPreview?.ul != null && parseFloat(dose) > driPreview.ul && (
                  <p className="text-xs text-red-500 mt-1">⚠ Dose acima do UL ({driPreview.ul} {selectedNutriente?.unidade})</p>
                )}
              </div>

              <div>
                <label className="text-xs text-stone-500 block mb-1">Observações <span className="text-stone-300">(opcional)</span></label>
                <input type="text" value={obsSupl} onChange={e => setObsSupl(e.target.value)} placeholder="Ex: tomar com refeição" className="w-full text-sm" />
              </div>

              {erroSupl && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{erroSupl}</p>}

              <button type="submit" disabled={savingSupl || !selectedNutriente}
                className="w-full bg-orange-700 text-white py-3 rounded-xl font-medium hover:bg-orange-800 disabled:opacity-50">
                {savingSupl ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
