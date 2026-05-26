'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPaciente, updatePaciente, getSession, getProfile } from '@/lib/supabase'

export default function EditarPaciente() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ nome: '', data_nascimento: '', sexo: 'M', observacoes: '' })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const prof = await getProfile(session.user.id)
      if (prof.role === 'assistente') { router.replace(`/pacientes/${id}`); return }
      const p = await getPaciente(id)
      setForm({ nome: p.nome, data_nascimento: p.data_nascimento, sexo: p.sexo, observacoes: p.observacoes ?? '' })
      setLoading(false)
    }).catch(() => router.replace('/'))
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.data_nascimento) { setErro('Nome e data são obrigatórios.'); return }
    setSaving(true); setErro('')
    try {
      await updatePaciente(id, { nome: form.nome.trim(), data_nascimento: form.data_nascimento, sexo: form.sexo as 'M' | 'F', observacoes: form.observacoes || undefined })
      router.push(`/pacientes/${id}`)
    } catch (err: any) { setErro(err.message) }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <Link href={`/pacientes/${id}`} className="text-stone-400 hover:text-stone-700">←</Link>
          <h1 className="font-semibold text-base text-stone-800">Editar paciente</h1>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white border border-stone-100 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Nome completo</label>
            <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: João Silva" className="w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Data de nascimento</label>
            <input type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} className="w-full" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Sexo</label>
            <div className="flex gap-3">
              {[{ v: 'M', l: 'Masculino' }, { v: 'F', l: 'Feminino' }].map(o => (
                <button key={o.v} type="button" onClick={() => set('sexo', o.v)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${form.sexo === o.v ? 'bg-green-600 text-white border-green-600' : 'bg-white text-stone-600 border-stone-200'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Observações <span className="text-stone-300 font-normal">(opcional)</span></label>
            <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3} className="w-full resize-none" />
          </div>
          {erro && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </main>
    </div>
  )
}
