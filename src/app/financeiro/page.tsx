'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, getProfile, getPacientes, getConsultas, createConsulta, updateConsultaStatus, deleteConsulta, type Profile, type Paciente, type Consulta } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

const STATUS_LABEL: Record<Consulta['status'], string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<Consulta['status'], string> = {
  pago: 'bg-orange-50 text-orange-800 border-orange-200',
  pendente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelado: 'bg-red-50 text-red-500 border-red-200',
}

type Filter = 'todos' | Consulta['status']

type Form = {
  paciente_id: string
  data: string
  valor: string
  status: Consulta['status']
  descricao: string
}

function fmt(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function FinanceiroPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('todos')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<Form>({
    paciente_id: '',
    data: new Date().toISOString().slice(0, 10),
    valor: '',
    status: 'pendente',
    descricao: '',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
      const [cs, pacs] = await Promise.all([getConsultas(), getPacientes()])
      setConsultas(cs)
      setPacientes(pacs)
      setLoading(false)
    }).catch(() => router.replace('/login'))
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await createConsulta({
        paciente_id: form.paciente_id || null,
        data: form.data,
        valor: parseFloat(form.valor.replace(',', '.')),
        status: form.status,
        descricao: form.descricao || null,
      })
      const updated = await getConsultas()
      setConsultas(updated)
      setShowModal(false)
      setForm({ paciente_id: '', data: new Date().toISOString().slice(0, 10), valor: '', status: 'pendente', descricao: '' })
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(id: string, status: Consulta['status']) {
    await updateConsultaStatus(id, status)
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta consulta?')) return
    await deleteConsulta(id)
    setConsultas(prev => prev.filter(c => c.id !== id))
  }

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  const filtered = filter === 'todos' ? consultas : consultas.filter(c => c.status === filter)

  const totalPago = consultas.filter(c => c.status === 'pago').reduce((s, c) => s + c.valor, 0)
  const totalPendente = consultas.filter(c => c.status === 'pendente').reduce((s, c) => s + c.valor, 0)
  const totalCancelado = consultas.filter(c => c.status === 'cancelado').reduce((s, c) => s + c.valor, 0)

  const podeEditar = profile.role !== 'assistente'

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex-shrink-0 text-orange-700">
              <span className="material-symbols-outlined leading-none select-none" style={{fontSize:'22px'}}>clinical_notes</span>
            </Link>
            <h1 className="font-semibold text-base text-stone-800">Financeiro</h1>
          </div>
          {podeEditar && (
            <button
              onClick={() => { setShowModal(true); setFormError('') }}
              className="bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-800"
            >
              + Nova
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-6 overflow-y-auto md:max-w-2xl md:w-full space-y-5">

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-stone-100 rounded-2xl p-3 text-center">
            <p className="text-base font-bold text-orange-800">{fmt(totalPago)}</p>
            <p className="text-xs text-stone-400 mt-0.5">Recebido</p>
          </div>
          <div className="bg-white border border-stone-100 rounded-2xl p-3 text-center">
            <p className="text-base font-bold text-yellow-600">{fmt(totalPendente)}</p>
            <p className="text-xs text-stone-400 mt-0.5">Pendente</p>
          </div>
          <div className="bg-white border border-stone-100 rounded-2xl p-3 text-center">
            <p className="text-base font-bold text-red-400">{fmt(totalCancelado)}</p>
            <p className="text-xs text-stone-400 mt-0.5">Cancelado</p>
          </div>
        </div>

        {/* Filtro */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['todos', 'pago', 'pendente', 'cancelado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-orange-700 text-white border-orange-700' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'}`}
            >
              {f === 'todos' ? 'Todos' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-stone-400 text-center py-10">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p>Nenhuma consulta encontrada.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(c => (
              <li key={c.id} className="bg-white border border-stone-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    {c.paciente_id ? (
                      <Link href={`/pacientes/${c.paciente_id}`} className="font-medium text-stone-800 text-sm truncate hover:text-orange-800 block">
                        {c.pacientes?.nome ?? 'Paciente'}
                      </Link>
                    ) : (
                      <p className="font-medium text-stone-800 text-sm truncate">Sem paciente</p>
                    )}
                    <p className="text-xs text-stone-400 mt-0.5">
                      {new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {c.descricao ? ` · ${c.descricao}` : ''}
                    </p>
                  </div>
                  <p className="font-semibold text-stone-800 text-sm flex-shrink-0">{fmt(c.valor)}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {podeEditar ? (
                    <select
                      value={c.status}
                      onChange={e => handleStatusChange(c.id, e.target.value as Consulta['status'])}
                      className={`text-xs font-medium border rounded-full px-2.5 py-1 ${STATUS_COLOR[c.status]}`}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  ) : (
                    <span className={`text-xs font-medium border rounded-full px-2.5 py-1 ${STATUS_COLOR[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  )}
                  {podeEditar && (
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-stone-400 hover:text-red-500 transition-colors">
                      Remover
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <BottomNav profile={profile} />

      {/* Modal nova consulta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div
            className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl px-6 pt-6"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-800">Nova consulta</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 pb-2">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))} className="w-full text-sm">
                  <option value="">— Sem paciente —</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required className="w-full text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Valor (R$)</label>
                  <input type="text" inputMode="decimal" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} required className="w-full text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Consulta['status'] }))} className="w-full text-sm">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Descrição (opcional)</label>
                <input type="text" placeholder="Ex: Retorno, Avaliação…" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className="w-full text-sm" />
              </div>
              {formError && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-orange-700 text-white py-3 rounded-xl font-medium hover:bg-orange-800 disabled:opacity-50">
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
