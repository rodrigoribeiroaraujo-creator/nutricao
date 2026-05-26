'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPaciente } from '@/lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'

export default function NovoPaciente() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [erro, setErro]     = useState('')
  const [form, setForm]     = useState({ nome: '', data_nascimento: '', sexo: 'M', observacoes: '' })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.data_nascimento) { setErro('Nome e data de nascimento são obrigatórios.'); return }
    setSaving(true); setErro('')
    try {
      const p = await createPaciente({ nome: form.nome.trim(), data_nascimento: form.data_nascimento, sexo: form.sexo as 'M'|'F', observacoes: form.observacoes || undefined })
      router.push(`/pacientes/${p.id}`)
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-stone-700"><ArrowLeft size={20} /></Link>
          <h1 className="font-semibold text-lg">Novo paciente</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
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
              {[{v:'M',l:'Masculino'},{v:'F',l:'Feminino'}].map(o => (
                <button key={o.v} type="button" onClick={() => set('sexo', o.v)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${form.sexo === o.v ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-stone-600 border-stone-200 hover:border-brand-300'}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">Observações <span className="text-stone-300 font-normal">(opcional)</span></label>
            <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} rows={3} placeholder="Informações relevantes sobre o paciente..." className="w-full resize-none" />
          </div>

          {erro && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white font-medium py-3 rounded-lg hover:bg-brand-600 disabled:opacity-50">
            <Save size={16} />
            {saving ? 'Salvando...' : 'Cadastrar paciente'}
          </button>
        </form>
      </main>
    </div>
  )
}
