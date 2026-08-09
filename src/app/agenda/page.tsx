'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getSession, getProfile, getPacientes,
  getAgendamentosByData, createAgendamento, updateAgendamentoStatus, deleteAgendamento,
  type Profile, type Paciente, type Agendamento,
} from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

const TIPO_LABEL: Record<Agendamento['tipo'], string> = {
  consulta: 'Consulta', retorno: 'Retorno', avaliacao: 'Avaliação', terapia: 'Terapia',
}
const STATUS_LABEL: Record<Agendamento['status'], string> = {
  agendado: 'Agendado', confirmado: 'Confirmado', realizado: 'Realizado',
  cancelado: 'Cancelado', falta: 'Falta',
}
const STATUS_COLOR: Record<Agendamento['status'], string> = {
  agendado: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmado: 'bg-green-50 text-green-700 border-green-200',
  realizado: 'bg-orange-50 text-orange-800 border-orange-200',
  cancelado: 'bg-stone-50 text-stone-400 border-stone-200',
  falta: 'bg-red-50 text-red-600 border-red-200',
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

function toLocalDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatHora(h: string) {
  return h.slice(0, 5)
}

export default function AgendaPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()))
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [form, setForm] = useState({
    paciente_id: '',
    hora_inicio: '08:00',
    hora_fim: '',
    tipo: 'consulta' as Agendamento['tipo'],
    observacoes: '',
  })

  const loadAgendamentos = useCallback(async (date: string) => {
    const rows = await getAgendamentosByData(date)
    setAgendamentos(rows)
  }, [])

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const [p, pacs] = await Promise.all([
        getProfile(session.user.id),
        getPacientes(),
      ])
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
      setPacientes(pacs)
      await loadAgendamentos(selectedDate)
      setLoading(false)
    }).catch(() => router.replace('/'))
  }, [router, selectedDate, loadAgendamentos])

  function changeDate(delta: number) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    const newDate = toLocalDateStr(d)
    setSelectedDate(newDate)
    loadAgendamentos(newDate)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.paciente_id) return
    setSaving(true)
    try {
      const session = await getSession()
      const novo = await createAgendamento({
        paciente_id: form.paciente_id,
        data: selectedDate,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim || null,
        tipo: form.tipo,
        status: 'agendado',
        observacoes: form.observacoes || null,
        created_by: session?.user.id ?? null,
      })
      const pac = pacientes.find(p => p.id === form.paciente_id)
      setAgendamentos(prev => [...prev, { ...novo, pacientes: { nome: pac?.nome ?? '' } }].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)))
      setShowForm(false)
      setForm({ paciente_id: '', hora_inicio: '08:00', hora_fim: '', tipo: 'consulta', observacoes: '' })
    } finally { setSaving(false) }
  }

  async function handleStatus(id: string, status: Agendamento['status']) {
    setStatusLoading(id)
    await updateAgendamentoStatus(id, status)
    setAgendamentos(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    setStatusLoading(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir agendamento?')) return
    await deleteAgendamento(id)
    setAgendamentos(prev => prev.filter(a => a.id !== id))
  }

  const dateObj = new Date(selectedDate + 'T12:00:00')
  const isToday = selectedDate === toLocalDateStr(new Date())
  const diaSemana = DIAS_SEMANA[dateObj.getDay()]
  const diaLabel = `${diaSemana}, ${dateObj.getDate()} de ${MESES[dateObj.getMonth()]}`

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center text-stone-400 text-sm">Carregando...</div>
  )

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="font-semibold text-lg">Agenda</h1>
          <button onClick={() => setShowForm(true)}
            className="bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-800">
            + Agendar
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-4 pb-28 md:pb-8 space-y-4">

        {/* Navegação de data */}
        <div className="flex items-center justify-between bg-white border border-stone-100 rounded-2xl px-4 py-3">
          <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '20px' }}>chevron_left</span>
          </button>
          <div className="text-center">
            <p className="font-semibold text-stone-800 text-sm">{diaLabel}</p>
            {!isToday && (
              <button onClick={() => { setSelectedDate(toLocalDateStr(new Date())); loadAgendamentos(toLocalDateStr(new Date())) }}
                className="text-xs text-orange-600 mt-0.5 hover:underline">Hoje</button>
            )}
            {isToday && <p className="text-xs text-orange-600 mt-0.5">Hoje</p>}
          </div>
          <button onClick={() => changeDate(1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
            <span className="material-symbols-outlined leading-none" style={{ fontSize: '20px' }}>chevron_right</span>
          </button>
        </div>

        {/* Lista de agendamentos */}
        {agendamentos.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
            <span className="material-symbols-outlined text-stone-300 block mb-2" style={{ fontSize: '40px' }}>calendar_today</span>
            <p className="text-stone-400 text-sm">Nenhum agendamento para este dia.</p>
            <button onClick={() => setShowForm(true)}
              className="mt-4 text-sm text-orange-700 font-medium hover:underline">
              + Adicionar agendamento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentos.map(a => (
              <div key={a.id} className={`bg-white border rounded-2xl p-4 ${a.status === 'cancelado' || a.status === 'falta' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-orange-700 text-sm tabular-nums">{formatHora(a.hora_inicio)}{a.hora_fim ? `–${formatHora(a.hora_fim)}` : ''}</span>
                      <span className="text-xs text-stone-400">{TIPO_LABEL[a.tipo]}</span>
                    </div>
                    <Link href={`/pacientes/${a.paciente_id}`} className="font-semibold text-stone-800 hover:text-orange-700 truncate block">
                      {a.pacientes?.nome ?? '—'}
                    </Link>
                    {a.observacoes && <p className="text-xs text-stone-400 mt-1 italic">{a.observacoes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_COLOR[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    <button onClick={() => handleDelete(a.id)} className="text-stone-300 hover:text-red-400">
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: '16px' }}>delete</span>
                    </button>
                  </div>
                </div>

                {/* Ações de status */}
                {a.status !== 'realizado' && a.status !== 'cancelado' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-50 flex-wrap">
                    {a.status === 'agendado' && (
                      <button onClick={() => handleStatus(a.id, 'confirmado')} disabled={statusLoading === a.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-medium hover:bg-green-100">
                        ✓ Confirmar
                      </button>
                    )}
                    <button onClick={() => handleStatus(a.id, 'realizado')} disabled={statusLoading === a.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 font-medium hover:bg-orange-100">
                      ✓ Realizado
                    </button>
                    <button onClick={() => handleStatus(a.id, 'falta')} disabled={statusLoading === a.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100">
                      Falta
                    </button>
                    <button onClick={() => handleStatus(a.id, 'cancelado')} disabled={statusLoading === a.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-stone-50 text-stone-500 font-medium hover:bg-stone-100">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {profile && <BottomNav profile={profile} />}

      {/* Modal novo agendamento */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div
            className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl px-5 pt-5"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Novo agendamento</h2>
              <button onClick={() => setShowForm(false)} className="text-stone-400 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Paciente</label>
                <select value={form.paciente_id} onChange={e => setForm(f => ({ ...f, paciente_id: e.target.value }))} required className="w-full text-sm">
                  <option value="">Selecionar...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Início</label>
                  <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} required className="w-full text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Fim <span className="text-stone-300">(opcional)</span></label>
                  <input type="time" value={form.hora_fim} onChange={e => setForm(f => ({ ...f, hora_fim: e.target.value }))} className="w-full text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Agendamento['tipo'] }))} className="w-full text-sm">
                  <option value="consulta">Consulta</option>
                  <option value="retorno">Retorno</option>
                  <option value="avaliacao">Avaliação</option>
                  <option value="terapia">Terapia</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Observações <span className="text-stone-300">(opcional)</span></label>
                <input type="text" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} placeholder="Ex: Trazer exames" className="w-full text-sm" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-orange-700 text-white py-3 rounded-xl font-medium hover:bg-orange-800 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Agendar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
