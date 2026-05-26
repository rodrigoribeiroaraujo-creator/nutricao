'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAnamneseTea, type AnamneseTea } from '@/lib/supabase'

const NIVEL_LABEL: Record<string, string> = {
  '1': 'Nível 1 — Leve',
  '2': 'Nível 2 — Moderado',
  '3': 'Nível 3 — Grave',
}
const SEXO: Record<string, string> = { M: 'Masculino', F: 'Feminino' }
const BOOL: Record<string, string> = { sim: 'Sim', nao: 'Não', as_vezes: 'Às vezes' }
const CONSIST: Record<string, string> = { pastosa: 'Pastosa', solida: 'Sólida', liquida: 'Líquida', mista: 'Mista' }
const TEMP: Record<string, string> = { fria: 'Fria', morna: 'Morna', quente: 'Quente', variada: 'Variada' }
const SELET: Record<string, string> = { leve: 'Leve', moderada: 'Moderada', grave: 'Grave' }
const SONO: Record<string, string> = { boa: 'Boa', regular: 'Regular', ruim: 'Ruim' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-100 rounded-xl p-4">
      <h2 className="font-semibold text-stone-700 text-sm mb-3 pb-2 border-b border-stone-100">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-stone-400">{label}</p>
      <p className="text-sm text-stone-800 mt-0.5">{value}</p>
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
}

function fmtDate(d?: string | null) {
  if (!d) return undefined
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function AnamneseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [anamnese, setAnamnese] = useState<AnamneseTea | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnamneseTea(id)
      .then(setAnamnese)
      .catch(() => router.push('/anamnese'))
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) return <div className="min-h-dvh flex items-center justify-center"><p className="text-stone-400 text-sm">Carregando...</p></div>
  if (!anamnese) return null

  const d = anamnese.dados

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/anamnese" className="text-stone-400 hover:text-stone-700">←</Link>
            <div>
              <h1 className="font-semibold text-base text-stone-800 truncate max-w-[180px]">{anamnese.nome_paciente}</h1>
              <span className="text-xs text-stone-400">
                {anamnese.nivel_tea ? `TEA — ${NIVEL_LABEL[anamnese.nivel_tea]}` : 'Sem TEA'}
              </span>
            </div>
          </div>
          <button onClick={() => window.print()} className="border border-stone-200 text-stone-500 text-sm font-medium px-3 py-2 rounded-lg hover:bg-stone-50">
            Imprimir
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-10 space-y-4 overflow-y-auto">
        <Section title="1. Identificação do paciente">
          <Grid>
            <Row label="Nome" value={anamnese.nome_paciente} />
            <Row label="Data de nascimento" value={fmtDate(d.data_nascimento)} />
            <Row label="Sexo" value={SEXO[d.sexo] ?? d.sexo} />
            <Row label="TEA" value={d.tem_tea === 'sim' ? (NIVEL_LABEL[anamnese.nivel_tea ?? ''] ?? 'Sim') : 'Não'} />
            <Row label="Nº de consulta" value={d.numero_consulta} />
            <Row label="Data da consulta" value={fmtDate(anamnese.data_consulta)} />
            <Row label="Nutricionista" value={anamnese.nutricionista} />
          </Grid>
          <Row label="Queixa principal" value={d.queixa_principal} />
          <Row label="Suplementos e medicamentos" value={d.suplementos_medicamentos} />
        </Section>

        <Section title="2. Antropometria">
          <Grid>
            <Row label="Peso atual" value={d.peso_kg ? `${d.peso_kg} kg` : null} />
            <Row label="Estatura" value={d.estatura_cm ? `${d.estatura_cm} cm` : null} />
            <Row label="IMC" value={d.imc ? `${d.imc} kg/m²` : null} />
            <Row label="Peso ao nascer" value={d.peso_nascimento_kg ? `${d.peso_nascimento_kg} kg` : null} />
            <Row label="Comprimento ao nascer" value={d.comprimento_nascimento_cm ? `${d.comprimento_nascimento_cm} cm` : null} />
            <Row label="Perímetro cefálico" value={d.perimetro_cefalico_cm ? `${d.perimetro_cefalico_cm} cm` : null} />
          </Grid>
          <Row label="Histórico ponderal" value={d.historico_peso} />
        </Section>

        <Section title="3. Alimentação">
          <Grid>
            <Row label="Nº de refeições/dia" value={d.num_refeicoes} />
            <Row label="Tempo de refeição" value={d.tempo_refeicao} />
            <Row label="Local das refeições" value={d.local_refeicoes} />
            <Row label="Come em família" value={BOOL[d.refeicao_familia] ?? d.refeicao_familia} />
            <Row label="Consistência preferida" value={CONSIST[d.consistencia_preferida] ?? d.consistencia_preferida} />
            <Row label="Temperatura preferida" value={TEMP[d.temperatura_preferida] ?? d.temperatura_preferida} />
            <Row label="Seletividade alimentar" value={SELET[d.seletividade] ?? d.seletividade} />
            <Row label="Neofobia" value={BOOL[d.neofobia] ?? d.neofobia} />
          </Grid>
          <Row label="Alimentos aceitos" value={d.alimentos_aceitos} />
          <Row label="Alimentos recusados" value={d.alimentos_recusados} />
          <Row label="Rituais e comportamentos" value={d.rituais} />
          <Row label="Observações" value={d.obs_alimentacao} />
        </Section>

        <Section title="4. Sono e rotina">
          <Grid>
            <Row label="Horas de sono" value={d.horas_sono ? `${d.horas_sono}h` : null} />
            <Row label="Qualidade do sono" value={SONO[d.qualidade_sono] ?? d.qualidade_sono} />
            <Row label="Dificuldade para dormir" value={BOOL[d.dificuldade_sono] ?? d.dificuldade_sono} />
            <Row label="Atividade física" value={BOOL[d.pratica_atividade] ?? d.pratica_atividade} />
          </Grid>
          <Row label="Tipo de atividade física" value={d.tipo_atividade} />
          <Row label="Rotina diária" value={d.rotina_diaria} />
          <Row label="Terapias em andamento" value={d.terapias} />
          <Row label="Observações" value={d.obs_rotina} />
        </Section>

        <Section title="5. Conduta">
          <Row label="Diagnóstico nutricional" value={d.diagnostico} />
          <Row label="Objetivos" value={d.objetivos} />
          <Row label="Orientações e estratégias" value={d.orientacoes} />
          <Row label="Próxima consulta" value={fmtDate(d.proxima_consulta)} />
          <Row label="Observações gerais" value={d.obs_gerais} />
        </Section>
      </main>
    </div>
  )
}
