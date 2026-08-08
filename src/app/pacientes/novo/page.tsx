'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPaciente, getSession, getProfile, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'

export default function NovoPaciente() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({ nome: '', data_nascimento: '', sexo: 'M', observacoes: '' })

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
    }).catch(() => router.replace('/login'))
  }, [router])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.data_nascimento) { setErro('Nome e data são obrigatórios.'); return }
    setSaving(true); setErro('')
    try {
      const p = await createPaciente({ nome: form.nome.trim(), data_nascimento: form.data_nascimento, sexo: form.sexo as 'M'|'F', observacoes: form.observacoes || undefined })
      router.push(`/pacientes/${p.id}`)
    } catch (err: any) { setErro(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex-shrink-0 text-orange-700">
            <span className="material-symbols-outlined leading-none select-none" style={{fontSize:'22px'}}>clinical_notes</span>
          </Link>
          <h1 className="font-semibold text-lg">Novo paciente</h1>
        </div>
      </header>
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 pb-28 md:pb-8">
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
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${form.sexo === o.v ? 'bg-orange-700 text-white border-orange-700' : 'bg-white text-stone-600 border-stone-200'}`}>
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
            className="w-full bg-orange-700 text-white font-medium py-3 rounded-lg hover:bg-orange-800 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Cadastrar paciente'}
          </button>
        </form>
      </main>
      {profile && <BottomNav profile={profile} />}
    </div>
  )
}
