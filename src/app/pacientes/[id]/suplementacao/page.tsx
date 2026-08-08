'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getPaciente, getSession, getProfile, getSuplemtacoes, createSuplemtacao, deleteSuplemtacao,
  type Paciente, type Profile, type Suplementacao,
} from '@/lib/supabase'
import { NUTRIENTES_DRI, getEstagioVida, getDRI, type NutrienteDRI } from '@/lib/dri'
import { calcIdadeAnos } from '@/lib/who'
import BottomNav from '@/components/BottomNav'

export default function SuplementacaoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [suplementacoes, setSuplemtacoes] = useState<Suplementacao[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [selectedNutriente, setSelectedNutriente] = useState<NutrienteDRI | null>(null)
  const [dose, setDose] = useState('')
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      setUserId(session.user.id)
      const [prof, pac, sups] = await Promise.all([
        getProfile(session.user.id),
        getPaciente(id),
        getSuplemtacoes(id),
      ])
      if (prof.status === 'pending') { router.replace('/pendente'); return }
      if (prof.status === 'blocked') { router.replace('/bloqueado'); return }
      setProfile(prof)
      setPaciente(pac)
      setSuplemtacoes(sups)
      setLoading(false)
    }).catch(() => router.replace('/login'))
  }, [id, router])

  function handleSelectNutriente(n: NutrienteDRI) {
    setSelectedNutriente(n)
    if (paciente) {
      const idade = calcIdadeAnos(paciente.data_nascimento)
      const estagio = getEstagioVida(idade, paciente.sexo)
      const dri = getDRI(n.id, estagio)
      if (dri?.rda != null) setDose(String(dri.rda))
      else setDose('')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNutriente || !paciente || !userId) return
    const dosePrescrita = parseFloat(dose.replace(',', '.'))
    if (!dosePrescrita || dosePrescrita <= 0) { setErro('Informe uma dose válida.'); return }

    const idade = calcIdadeAnos(paciente.data_nascimento)
    const estagio = getEstagioVida(idade, paciente.sexo)
    const dri = getDRI(selectedNutriente.id, estagio)

    setSaving(true); setErro('')
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
        observacoes: obs || null,
        created_by: userId,
      })
      setSuplemtacoes(s => [...s, nova].sort((a, b) => a.nutriente_nome.localeCompare(b.nutriente_nome)))
      setShowModal(false)
      setSelectedNutriente(null)
      setDose('')
      setObs('')
    } catch (err: any) { setErro(err.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(supId: string, nome: string) {
    if (!confirm(`Remover ${nome} da lista de suplementação?`)) return
    await deleteSuplemtacao(supId)
    setSuplemtacoes(s => s.filter(x => x.id !== supId))
  }

  function openModal() {
    setShowModal(true)
    setSelectedNutriente(null)
    setDose('')
    setObs('')
    setErro('')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-dvh">
      <p className="text-stone-400 text-sm">Carregando...</p>
    </div>
  )
  if (!paciente || !profile) return null

  const podeEditar = profile.role !== 'assistente'
  const idade = calcIdadeAnos(paciente.data_nascimento)
  const estagio = getEstagioVida(idade, paciente.sexo)

  const nutrientesDisponiveis = NUTRIENTES_DRI.filter(
    n => !suplementacoes.some(s => s.nutriente_id === n.id)
  )

  const driPreview = selectedNutriente ? getDRI(selectedNutriente.id, estagio) : null

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/pacientes/${id}`} className="text-stone-400 hover:text-stone-600">
              <span className="material-symbols-outlined leading-none select-none" style={{ fontSize: '22px' }}>arrow_back</span>
            </Link>
            <div>
              <h1 className="font-semibold text-stone-800 leading-tight">Suplementação</h1>
              <p className="text-xs text-stone-400">{paciente.nome}</p>
            </div>
          </div>
          {podeEditar && nutrientesDisponiveis.length > 0 && (
            <button onClick={openModal} className="bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-800">
              + Adicionar
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 pb-28 md:pb-8 space-y-4">
        {suplementacoes.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
            <p className="text-stone-400 text-sm mb-2">Nenhum suplemento prescrito.</p>
            {podeEditar && (
              <button onClick={openModal} className="text-orange-700 text-sm hover:underline">
                Adicionar suplemento →
              </button>
            )}
          </div>
        ) : (
          suplementacoes.map(s => {
            const excessoUL = s.ul != null && s.dose_prescrita > s.ul
            const pctDRI = s.dose_dri ? Math.round((s.dose_prescrita / s.dose_dri) * 100) : null
            return (
              <div key={s.id} className="bg-white border border-stone-100 rounded-2xl p-4">
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
                        {excessoUL ? '⚠ ' : ''}UL: {s.ul} {s.unidade}
                        {excessoUL && ' — dose acima do limite superior!'}
                      </p>
                    )}
                    {s.observacoes && (
                      <p className="text-xs text-stone-500 mt-1.5 italic">{s.observacoes}</p>
                    )}
                  </div>
                  {podeEditar && (
                    <button
                      onClick={() => handleDelete(s.id, s.nutriente_nome)}
                      className="text-stone-300 hover:text-red-400 p-1 flex-shrink-0"
                      title="Remover"
                    >
                      <span className="material-symbols-outlined leading-none" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}

        {suplementacoes.length > 0 && (
          <p className="text-xs text-stone-400 text-center px-4">
            Referências DRI: Padovani et al., Rev. Nutr. 2006;19(6):741-760
          </p>
        )}
      </main>

      <BottomNav profile={profile} />

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl px-6 pt-6"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-stone-800">Adicionar suplemento</h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-stone-500 block mb-1">Nutriente</label>
                <select
                  value={selectedNutriente?.id ?? ''}
                  onChange={e => {
                    const n = NUTRIENTES_DRI.find(x => x.id === e.target.value)
                    if (n) handleSelectNutriente(n)
                    else setSelectedNutriente(null)
                  }}
                  required
                  className="w-full text-sm"
                >
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
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={dose}
                  onChange={e => setDose(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full"
                />
                {driPreview?.ul != null && parseFloat(dose) > driPreview.ul && (
                  <p className="text-xs text-red-500 mt-1">⚠ Dose acima do UL ({driPreview.ul} {selectedNutriente?.unidade})</p>
                )}
              </div>

              <div>
                <label className="text-xs text-stone-500 block mb-1">Observações <span className="text-stone-300">(opcional)</span></label>
                <input
                  type="text"
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                  placeholder="Ex: tomar com refeição"
                  className="w-full text-sm"
                />
              </div>

              {erro && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

              <button
                type="submit"
                disabled={saving || !selectedNutriente}
                className="w-full bg-orange-700 text-white py-3 rounded-xl font-medium hover:bg-orange-800 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
