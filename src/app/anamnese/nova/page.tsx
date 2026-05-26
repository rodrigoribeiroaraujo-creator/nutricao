'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAnamneseTea, getSession, getProfile } from '@/lib/supabase'

const STEPS = ['Paciente', 'Antropometria', 'Alimentação', 'Sono e rotina', 'Conduta']

type FormData = {
  nome_paciente: string; data_nascimento: string; sexo: string; nivel_tea: string
  numero_consulta: string; nutricionista: string; data_consulta: string
  queixa_principal: string; suplementos_medicamentos: string
  peso_kg: string; estatura_cm: string; peso_nascimento_kg: string
  comprimento_nascimento_cm: string; perimetro_cefalico_cm: string; historico_peso: string
  num_refeicoes: string; local_refeicoes: string; refeicao_familia: string
  tempo_refeicao: string; consistencia_preferida: string; temperatura_preferida: string
  alimentos_aceitos: string; alimentos_recusados: string; seletividade: string
  neofobia: string; rituais: string; obs_alimentacao: string
  horas_sono: string; qualidade_sono: string; dificuldade_sono: string
  rotina_diaria: string; pratica_atividade: string; tipo_atividade: string
  terapias: string; obs_rotina: string
  diagnostico: string; objetivos: string; orientacoes: string
  proxima_consulta: string; obs_gerais: string
}

const INITIAL: FormData = {
  nome_paciente: '', data_nascimento: '', sexo: '', nivel_tea: '', numero_consulta: '',
  nutricionista: '', data_consulta: new Date().toISOString().split('T')[0],
  queixa_principal: '', suplementos_medicamentos: '',
  peso_kg: '', estatura_cm: '', peso_nascimento_kg: '', comprimento_nascimento_cm: '',
  perimetro_cefalico_cm: '', historico_peso: '',
  num_refeicoes: '', local_refeicoes: '', refeicao_familia: '', tempo_refeicao: '',
  consistencia_preferida: '', temperatura_preferida: '', alimentos_aceitos: '',
  alimentos_recusados: '', seletividade: '', neofobia: '', rituais: '', obs_alimentacao: '',
  horas_sono: '', qualidade_sono: '', dificuldade_sono: '', rotina_diaria: '',
  pratica_atividade: '', tipo_atividade: '', terapias: '', obs_rotina: '',
  diagnostico: '', objetivos: '', orientacoes: '', proxima_consulta: '', obs_gerais: '',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${value === o.v ? 'bg-green-600 text-white border-green-600' : 'bg-white text-stone-600 border-stone-200'}`}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export default function NovaAnamnesePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      if (p.role === 'assistente') { router.replace('/anamnese'); return }
      setUserId(session.user.id)
    })
  }, [router])

  function set(k: keyof FormData, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const imc = form.peso_kg && form.estatura_cm
    ? (parseFloat(form.peso_kg) / Math.pow(parseFloat(form.estatura_cm) / 100, 2)).toFixed(1)
    : null

  async function handleSave() {
    if (!form.nome_paciente.trim()) { setErro('Nome do paciente é obrigatório.'); return }
    if (!userId) return
    setSaving(true); setErro('')
    try {
      const result = await createAnamneseTea({
        nome_paciente: form.nome_paciente.trim(),
        data_consulta: form.data_consulta || undefined,
        nutricionista: form.nutricionista || undefined,
        nivel_tea: form.nivel_tea || undefined,
        dados: { ...form, imc: imc ?? '' },
        created_by: userId,
      })
      router.push(`/anamnese/${result.id}`)
    } catch (err: any) { setErro(err.message) }
    finally { setSaving(false) }
  }

  function renderStep() {
    switch (step) {
      case 1: return (
        <div className="space-y-4">
          <Field label="Nome completo">
            <input type="text" value={form.nome_paciente} onChange={e => set('nome_paciente', e.target.value)} placeholder="Nome do paciente" className="w-full" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de nascimento">
              <input type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} className="w-full" />
            </Field>
            <Field label="Sexo biológico">
              <select value={form.sexo} onChange={e => set('sexo', e.target.value)} className="w-full text-sm">
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nível TEA (DSM-5)">
              <select value={form.nivel_tea} onChange={e => set('nivel_tea', e.target.value)} className="w-full text-sm">
                <option value="">Selecione</option>
                <option value="1">Nível 1 — Leve</option>
                <option value="2">Nível 2 — Moderado</option>
                <option value="3">Nível 3 — Grave</option>
              </select>
            </Field>
            <Field label="Nº de consulta">
              <input type="text" value={form.numero_consulta} onChange={e => set('numero_consulta', e.target.value)} placeholder="Ex: 1ª consulta" className="w-full" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nutricionista (Nome / CRN)">
              <input type="text" value={form.nutricionista} onChange={e => set('nutricionista', e.target.value)} placeholder="Nome / CRN" className="w-full" />
            </Field>
            <Field label="Data da consulta">
              <input type="date" value={form.data_consulta} onChange={e => set('data_consulta', e.target.value)} className="w-full" />
            </Field>
          </div>
          <Field label="Queixa principal / motivo da consulta">
            <textarea value={form.queixa_principal} onChange={e => set('queixa_principal', e.target.value)} rows={3} className="w-full resize-none" placeholder="Ex: seletividade alimentar extrema, perda de peso, recusa de grupos alimentares..." />
          </Field>
          <Field label="Uso de suplementos ou medicamentos">
            <textarea value={form.suplementos_medicamentos} onChange={e => set('suplementos_medicamentos', e.target.value)} rows={2} className="w-full resize-none" placeholder="Liste suplementos, vitaminas, medicamentos em uso e doses..." />
          </Field>
        </div>
      )

      case 2: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso atual (kg)">
              <input type="number" step="0.1" value={form.peso_kg} onChange={e => set('peso_kg', e.target.value)} placeholder="Ex: 32.5" className="w-full" />
            </Field>
            <Field label="Estatura (cm)">
              <input type="number" step="0.1" value={form.estatura_cm} onChange={e => set('estatura_cm', e.target.value)} placeholder="Ex: 128" className="w-full" />
            </Field>
          </div>
          {imc && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-green-600 font-medium">IMC calculado</p>
              <p className="text-xl font-bold text-green-700">{imc} <span className="text-sm font-normal">kg/m²</span></p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso ao nascer (kg)">
              <input type="number" step="0.01" value={form.peso_nascimento_kg} onChange={e => set('peso_nascimento_kg', e.target.value)} placeholder="Ex: 3.2" className="w-full" />
            </Field>
            <Field label="Comprimento ao nascer (cm)">
              <input type="number" step="0.1" value={form.comprimento_nascimento_cm} onChange={e => set('comprimento_nascimento_cm', e.target.value)} placeholder="Ex: 50" className="w-full" />
            </Field>
          </div>
          <Field label="Perímetro cefálico atual (cm)">
            <input type="number" step="0.1" value={form.perimetro_cefalico_cm} onChange={e => set('perimetro_cefalico_cm', e.target.value)} placeholder="Ex: 52" className="w-full" />
          </Field>
          <Field label="Histórico ponderal / observações">
            <textarea value={form.historico_peso} onChange={e => set('historico_peso', e.target.value)} rows={3} className="w-full resize-none" placeholder="Descreva a evolução do peso ao longo do tempo..." />
          </Field>
        </div>
      )

      case 3: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nº de refeições/dia">
              <input type="number" value={form.num_refeicoes} onChange={e => set('num_refeicoes', e.target.value)} placeholder="Ex: 5" className="w-full" />
            </Field>
            <Field label="Tempo médio de refeição">
              <input type="text" value={form.tempo_refeicao} onChange={e => set('tempo_refeicao', e.target.value)} placeholder="Ex: 30 min" className="w-full" />
            </Field>
          </div>
          <Field label="Local das refeições">
            <input type="text" value={form.local_refeicoes} onChange={e => set('local_refeicoes', e.target.value)} placeholder="Ex: mesa da cozinha" className="w-full" />
          </Field>
          <Field label="Come em família?">
            <RadioGroup value={form.refeicao_familia} onChange={v => set('refeicao_familia', v)} options={[{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }, { v: 'as_vezes', l: 'Às vezes' }]} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Consistência preferida">
              <select value={form.consistencia_preferida} onChange={e => set('consistencia_preferida', e.target.value)} className="w-full text-sm">
                <option value="">Selecione</option>
                <option value="pastosa">Pastosa</option>
                <option value="solida">Sólida</option>
                <option value="liquida">Líquida</option>
                <option value="mista">Mista</option>
              </select>
            </Field>
            <Field label="Temperatura preferida">
              <select value={form.temperatura_preferida} onChange={e => set('temperatura_preferida', e.target.value)} className="w-full text-sm">
                <option value="">Selecione</option>
                <option value="fria">Fria</option>
                <option value="morna">Morna</option>
                <option value="quente">Quente</option>
                <option value="variada">Variada</option>
              </select>
            </Field>
          </div>
          <Field label="Grau de seletividade alimentar">
            <RadioGroup value={form.seletividade} onChange={v => set('seletividade', v)} options={[{ v: 'leve', l: 'Leve' }, { v: 'moderada', l: 'Moderada' }, { v: 'grave', l: 'Grave' }]} />
          </Field>
          <Field label="Apresenta neofobia alimentar?">
            <RadioGroup value={form.neofobia} onChange={v => set('neofobia', v)} options={[{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }]} />
          </Field>
          <Field label="Alimentos aceitos">
            <textarea value={form.alimentos_aceitos} onChange={e => set('alimentos_aceitos', e.target.value)} rows={2} className="w-full resize-none" placeholder="Liste os alimentos aceitos pelo paciente..." />
          </Field>
          <Field label="Alimentos recusados / rejeitados">
            <textarea value={form.alimentos_recusados} onChange={e => set('alimentos_recusados', e.target.value)} rows={2} className="w-full resize-none" placeholder="Liste os alimentos rejeitados..." />
          </Field>
          <Field label="Rituais e comportamentos nas refeições">
            <textarea value={form.rituais} onChange={e => set('rituais', e.target.value)} rows={2} className="w-full resize-none" placeholder="Ex: só come em prato específico, recusa mistura de alimentos..." />
          </Field>
          <Field label="Outras observações">
            <textarea value={form.obs_alimentacao} onChange={e => set('obs_alimentacao', e.target.value)} rows={2} className="w-full resize-none" />
          </Field>
        </div>
      )

      case 4: return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Horas de sono/noite">
              <input type="number" step="0.5" value={form.horas_sono} onChange={e => set('horas_sono', e.target.value)} placeholder="Ex: 8" className="w-full" />
            </Field>
            <Field label="Qualidade do sono">
              <select value={form.qualidade_sono} onChange={e => set('qualidade_sono', e.target.value)} className="w-full text-sm">
                <option value="">Selecione</option>
                <option value="boa">Boa</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
              </select>
            </Field>
          </div>
          <Field label="Dificuldade para iniciar o sono?">
            <RadioGroup value={form.dificuldade_sono} onChange={v => set('dificuldade_sono', v)} options={[{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }]} />
          </Field>
          <Field label="Rotina diária">
            <textarea value={form.rotina_diaria} onChange={e => set('rotina_diaria', e.target.value)} rows={3} className="w-full resize-none" placeholder="Descreva a rotina típica do paciente durante o dia..." />
          </Field>
          <Field label="Pratica atividade física?">
            <RadioGroup value={form.pratica_atividade} onChange={v => set('pratica_atividade', v)} options={[{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }]} />
          </Field>
          {form.pratica_atividade === 'sim' && (
            <Field label="Tipo e frequência de atividade física">
              <input type="text" value={form.tipo_atividade} onChange={e => set('tipo_atividade', e.target.value)} placeholder="Ex: natação 2x/semana" className="w-full" />
            </Field>
          )}
          <Field label="Terapias em andamento">
            <textarea value={form.terapias} onChange={e => set('terapias', e.target.value)} rows={2} className="w-full resize-none" placeholder="Ex: ABA, Fonoaudiologia, Terapia Ocupacional..." />
          </Field>
          <Field label="Outras observações">
            <textarea value={form.obs_rotina} onChange={e => set('obs_rotina', e.target.value)} rows={2} className="w-full resize-none" />
          </Field>
        </div>
      )

      case 5: return (
        <div className="space-y-4">
          <Field label="Diagnóstico nutricional">
            <textarea value={form.diagnostico} onChange={e => set('diagnostico', e.target.value)} rows={3} className="w-full resize-none" placeholder="Descreva o diagnóstico nutricional do paciente..." />
          </Field>
          <Field label="Objetivos do atendimento">
            <textarea value={form.objetivos} onChange={e => set('objetivos', e.target.value)} rows={3} className="w-full resize-none" placeholder="Liste os objetivos do acompanhamento nutricional..." />
          </Field>
          <Field label="Orientações e estratégias">
            <textarea value={form.orientacoes} onChange={e => set('orientacoes', e.target.value)} rows={4} className="w-full resize-none" placeholder="Orientações e estratégias para o paciente e família..." />
          </Field>
          <Field label="Data da próxima consulta">
            <input type="date" value={form.proxima_consulta} onChange={e => set('proxima_consulta', e.target.value)} className="w-full" />
          </Field>
          <Field label="Observações gerais">
            <textarea value={form.obs_gerais} onChange={e => set('obs_gerais', e.target.value)} rows={3} className="w-full resize-none" />
          </Field>
          {erro && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
        </div>
      )
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/anamnese" className="text-stone-400 hover:text-stone-700">←</Link>
          <div>
            <h1 className="font-semibold text-base text-stone-800">Nova Anamnese TEA</h1>
            <p className="text-xs text-stone-400">Etapa {step} de 5 — {STEPS[step - 1]}</p>
          </div>
        </div>
        <div className="h-1 bg-stone-100">
          <div className="h-1 bg-green-500 transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
        </div>
      </header>

      <div className="bg-white border-b border-stone-100 px-4 py-2 flex gap-1.5 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i + 1)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition ${step === i + 1 ? 'bg-green-600 text-white' : i + 1 < step ? 'bg-green-100 text-green-700' : 'text-stone-400 bg-stone-100'}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-5 overflow-y-auto">
        {renderStep()}
      </main>

      <div className="bg-white border-t border-stone-100 px-4 py-4 flex gap-3" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {step > 1 && (
          <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 border border-stone-200 text-stone-600 py-3 rounded-xl font-medium text-sm">
            ← Anterior
          </button>
        )}
        {step < 5 ? (
          <button type="button" onClick={() => setStep(s => s + 1)} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-green-700">
            Próximo →
          </button>
        ) : (
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar anamnese'}
          </button>
        )}
      </div>
    </div>
  )
}
