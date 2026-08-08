'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, getProfile, type Profile } from '@/lib/supabase'
import { FIELD_LABELS } from '@/lib/preconsulta-parser'
import BottomNav from '@/components/BottomNav'

type Step = 'upload' | 'preview' | 'saving'

const PATIENT_FIELDS = ['nome_paciente', 'data_nascimento', 'sexo']
const MEASUREMENT_FIELDS = ['peso_atual', 'altura_atual']
const EXTRA_FIELDS = Object.keys(FIELD_LABELS).filter(
  k => !PATIENT_FIELDS.includes(k) && !MEASUREMENT_FIELDS.includes(k)
)

export default function ImportarPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [step, setStep] = useState<Step>('upload')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.status === 'pending') { router.replace('/pendente'); return }
      if (p.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(p)
    }).catch(() => router.replace('/login'))
  }, [router])

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Selecione um arquivo PDF.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('pdf', file)
      const res = await fetch('/api/importar-preconsulta', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao processar PDF.')
      setFields(json.fields)
      setStep('preview')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar PDF.')
    } finally {
      setUploading(false)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  function set(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleSalvar() {
    if (!fields.nome_paciente?.trim()) { setError('Nome da criança é obrigatório.'); return }
    if (!fields.data_nascimento?.trim()) { setError('Data de nascimento é obrigatória.'); return }
    setStep('saving')
    setError('')
    try {
      const session = await getSession()
      if (!session) throw new Error('Sessão expirada.')
      const res = await fetch('/api/importar-preconsulta/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(fields),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar.')
      router.push(`/pacientes/${json.pacienteId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
      setStep('preview')
    }
  }

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex-shrink-0 text-orange-700">
            <span className="material-symbols-outlined leading-none select-none" style={{ fontSize: '22px' }}>clinical_notes</span>
          </Link>
          <h1 className="font-semibold text-base text-stone-800">Importar Pré-consulta</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-28 md:pb-8 max-w-xl w-full mx-auto space-y-5">

        {/* ── Step: Upload ── */}
        {step === 'upload' && (
          <>
            <p className="text-sm text-stone-500">
              Faça o download do PDF de resposta do Google Formulários e importe aqui. O sistema irá cadastrar o paciente e criar a anamnese automaticamente.
            </p>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-stone-300 hover:border-orange-300 hover:bg-stone-50'}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploading ? (
                <>
                  <span className="material-symbols-outlined text-4xl text-orange-400 animate-pulse">hourglass_empty</span>
                  <p className="text-sm text-stone-500 font-medium">Lendo o PDF...</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl text-stone-400">upload_file</span>
                  <div className="text-center">
                    <p className="font-semibold text-stone-700">Clique para selecionar o PDF</p>
                    <p className="text-sm text-stone-400 mt-1">ou arraste e solte aqui</p>
                  </div>
                  <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1 rounded-full">Apenas arquivos .pdf</span>
                </>
              )}
              <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileInput} />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-stone-500 mb-2">Como obter o PDF?</p>
              <ol className="text-xs text-stone-500 space-y-1 list-decimal list-inside">
                <li>Acesse o Google Formulários e abra as respostas</li>
                <li>Clique em uma resposta individual</li>
                <li>Use o menu ⋮ e selecione &quot;Imprimir&quot; → salvar como PDF</li>
                <li>Importe o arquivo PDF aqui</li>
              </ol>
            </div>
          </>
        )}

        {/* ── Step: Preview / Edit ── */}
        {(step === 'preview' || step === 'saving') && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700 font-medium">Revise os dados antes de importar. Campos obrigatórios marcados com *</p>
            </div>

            {/* Patient data */}
            <div className="bg-white border border-stone-100 rounded-2xl p-5 space-y-4">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Dados do Paciente</p>
              <div>
                <label className="text-xs text-stone-500 block mb-1">Nome da criança *</label>
                <input type="text" value={fields.nome_paciente || ''} onChange={e => set('nome_paciente', e.target.value)} className="w-full" placeholder="Nome completo" required />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Data de nascimento *</label>
                  <input type="date" value={fields.data_nascimento || ''} onChange={e => set('data_nascimento', e.target.value)} className="w-full" required />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-500 block mb-1">Sexo *</label>
                  <select value={fields.sexo || 'M'} onChange={e => set('sexo', e.target.value)} className="w-full text-sm">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Measurements */}
            {(fields.peso_atual || fields.altura_atual) && (
              <div className="bg-white border border-stone-100 rounded-2xl p-5 space-y-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Medidas</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Peso (kg)</label>
                    <input type="text" value={fields.peso_atual || ''} onChange={e => set('peso_atual', e.target.value)} className="w-full" placeholder="Ex: 12,5" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-stone-500 block mb-1">Altura (cm)</label>
                    <input type="text" value={fields.altura_atual || ''} onChange={e => set('altura_atual', e.target.value)} className="w-full" placeholder="Ex: 90" />
                  </div>
                </div>
              </div>
            )}

            {/* Anamnesis fields */}
            {EXTRA_FIELDS.some(k => fields[k]) && (
              <div className="bg-white border border-stone-100 rounded-2xl p-5 space-y-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Dados do Formulário</p>
                {EXTRA_FIELDS.filter(k => fields[k]).map(key => (
                  <div key={key}>
                    <label className="text-xs text-stone-500 block mb-1">{FIELD_LABELS[key]}</label>
                    <input
                      type="text"
                      value={fields[key] || ''}
                      onChange={e => set(key, e.target.value)}
                      className="w-full text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3 pb-2">
              <button
                onClick={() => { setStep('upload'); setFields({}); setError('') }}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium text-sm hover:bg-stone-50"
                disabled={step === 'saving'}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={step === 'saving'}
                className="flex-1 bg-orange-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-800 disabled:opacity-50"
              >
                {step === 'saving' ? 'Importando...' : 'Importar Paciente'}
              </button>
            </div>
          </>
        )}
      </main>

      <BottomNav profile={profile} />
    </div>
  )
}
