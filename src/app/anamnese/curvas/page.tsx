'use client'
export const dynamic = 'force-dynamic'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSession, getProfile, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { WHO_IMC, WHO_PESO, WHO_ALTURA, classifyZScore, calcIdadeAnos, getChartSeries, getNutritionalStatus } from '@/lib/who'

type ChartTipo = 'imc' | 'peso' | 'altura'

function zoneColor(zone: string) {
  if (zone === 'critical_low' || zone === 'critical_high') return 'text-red-600 bg-red-50 border-red-200'
  if (zone === 'low' || zone === 'very_high') return 'text-amber-600 bg-amber-50 border-amber-200'
  if (zone === 'high') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-orange-800 bg-orange-50 border-orange-200'
}

function zoneIcon(zone: string) {
  if (zone === 'critical_low' || zone === 'critical_high') return '🔴'
  if (zone === 'low' || zone === 'very_high') return '🟠'
  if (zone === 'high') return '🟡'
  return '🟢'
}

function Curva({ dataNasc, sexo, dataRef, pesoKg, altCm, tipo }: {
  dataNasc: string; sexo: string; dataRef: string
  pesoKg: number; altCm: number; tipo: ChartTipo
}) {
  const ageY = calcIdadeAnos(dataNasc, dataRef)
  const dataset = tipo === 'imc' ? WHO_IMC : tipo === 'peso' ? WHO_PESO : WHO_ALTURA
  const s = sexo as 'M' | 'F'
  const { ages, zm3, zm2, zm1, z0, zp1, zp2, zp3 } = getChartSeries(dataset, s, ageY)

  const curveData = ages.map((age: number, i: number) => ({
    age: parseFloat(age.toFixed(2)),
    zm3: zm3[i], zm2: zm2[i], zm1: zm1[i], z0: z0[i], zp1: zp1[i], zp2: zp2[i], zp3: zp3[i],
  }))

  const imc = pesoKg / Math.pow(altCm / 100, 2)
  const val = tipo === 'imc' ? imc : tipo === 'peso' ? pesoKg : altCm
  const unit = tipo === 'imc' ? 'kg/m²' : tipo === 'peso' ? 'kg' : 'cm'

  const { label, zone } = classifyZScore(val, ageY, dataset, tipo, s)
  const nutritionalStatus = getNutritionalStatus(zone, tipo, ageY)
  const patientPoint = [{ age: parseFloat(ageY.toFixed(2)), val }]

  const allVals = [...zm3, ...zp3]
  const yMin = parseFloat((Math.min(...allVals) * 0.94).toFixed(1))
  const yMax = parseFloat((Math.max(...allVals) * 1.04).toFixed(1))

  const idadeStr = ageY < 2
    ? `${Math.round(ageY * 12)} meses`
    : `${Math.floor(ageY)} anos`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {tipo === 'imc' && (
          <div className="col-span-3 bg-white border border-stone-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400">IMC</p>
              <p className="text-2xl font-bold text-stone-800">{imc.toFixed(1)}</p>
              <p className="text-xs text-stone-400">kg/m²</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">Idade</p>
              <p className="text-lg font-semibold text-stone-700">{idadeStr}</p>
              <p className="text-xs text-stone-400">{sexo === 'M' ? 'Masculino' : 'Feminino'}</p>
            </div>
          </div>
        )}
        {tipo === 'peso' && (
          <div className="col-span-3 bg-white border border-stone-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400">Peso</p>
              <p className="text-2xl font-bold text-stone-800">{pesoKg}</p>
              <p className="text-xs text-stone-400">kg</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">Idade</p>
              <p className="text-lg font-semibold text-stone-700">{idadeStr}</p>
            </div>
          </div>
        )}
        {tipo === 'altura' && (
          <div className="col-span-3 bg-white border border-stone-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400">Altura</p>
              <p className="text-2xl font-bold text-stone-800">{altCm}</p>
              <p className="text-xs text-stone-400">cm</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400">Idade</p>
              <p className="text-lg font-semibold text-stone-700">{idadeStr}</p>
            </div>
          </div>
        )}
      </div>

      <div className={`border rounded-2xl px-5 py-4 ${zoneColor(zone)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide opacity-60">Estado Nutricional</p>
            <p className="text-xl font-bold mt-0.5">{zoneIcon(zone)} {nutritionalStatus}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">Escore-Z</p>
            <p className="text-sm font-semibold mt-0.5">{label}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-100 rounded-xl p-4">
        <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-3">
          {tipo === 'imc' ? 'IMC' : tipo === 'peso' ? 'Peso' : 'Altura'} × Idade — OMS ({sexo === 'M' ? 'Masculino' : 'Feminino'})
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={v => ageY <= 2 ? `${Math.round(v * 12)}m` : `${parseFloat(v).toFixed(0)}a`}
              tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#d6d3d1' }} />
            <YAxis domain={[yMin, yMax]} tickFormatter={v => v.toFixed(0)} tick={{ fontSize: 10 }} width={34}
              tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: any) => [`${parseFloat(v).toFixed(1)} ${unit}`]} />
            <Line data={curveData} dataKey="zm3" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="-3 DP" />
            <Line data={curveData} dataKey="zm2" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="-2 DP" />
            {tipo === 'imc' && <Line data={curveData} dataKey="zm1" stroke="#eab308" strokeWidth={1} strokeDasharray="2 2" dot={false} name="-1 DP" />}
            <Line data={curveData} dataKey="z0" stroke="#16a34a" strokeWidth={2.5} dot={false} name="Mediana" />
            {tipo === 'imc' && <Line data={curveData} dataKey="zp1" stroke="#eab308" strokeWidth={1} strokeDasharray="2 2" dot={false} name="+1 DP" />}
            <Line data={curveData} dataKey="zp2" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="+2 DP" />
            <Line data={curveData} dataKey="zp3" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="+3 DP" />
            <Line data={patientPoint} dataKey="val" stroke="#1d4ed8" strokeWidth={0}
              dot={{ fill: '#1d4ed8', r: 7, strokeWidth: 2.5, stroke: '#fff' }} name="Paciente" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {[
            ['#ef4444', '±3 DP'],
            ['#f97316', '±2 DP'],
            ...(tipo === 'imc' ? [['#eab308', '±1 DP']] : []),
            ['#16a34a', 'Mediana'],
            ['#1d4ed8', 'Paciente'],
          ].map(([color, lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-stone-400">{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CurvasContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tipo, setTipo] = useState<ChartTipo>('imc')
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    getSession().then(async session => {
      if (!session) { router.replace('/login'); return }
      const p = await getProfile(session.user.id)
      setProfile(p)
    }).catch(() => router.replace('/login'))
  }, [router])

  const pesoKg = parseFloat(searchParams.get('peso') ?? '0')
  const altCm = parseFloat(searchParams.get('alt') ?? '0')
  const dataNasc = searchParams.get('nasc') ?? ''
  const sexo = searchParams.get('sexo') ?? ''
  const dataRef = searchParams.get('data') ?? new Date().toISOString().split('T')[0]

  const valid = pesoKg > 0 && altCm > 0 && dataNasc && (sexo === 'M' || sexo === 'F')

  return (
    <div className="min-h-dvh flex flex-col md:pl-56">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-700">←</button>
          <h1 className="font-semibold text-base text-stone-800">Curvas OMS</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-28 md:pb-6 overflow-y-auto">
        {!valid ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-sm">Dados insuficientes para gerar as curvas.</p>
            <p className="text-xs mt-1">Preencha peso, altura, data de nascimento e sexo.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex gap-2">
              {(['imc', 'peso', 'altura'] as ChartTipo[]).map(t => (
                <button key={t} type="button" onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${tipo === t ? 'bg-orange-700 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}>
                  {t === 'imc' ? 'IMC' : t === 'peso' ? 'Peso' : 'Altura'}
                </button>
              ))}
            </div>
            <Curva
              dataNasc={dataNasc}
              sexo={sexo}
              dataRef={dataRef}
              pesoKg={pesoKg}
              altCm={altCm}
              tipo={tipo}
            />
          </div>
        )}
      </main>
      {profile && <BottomNav profile={profile} />}
    </div>
  )
}

export default function CurvasPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><p className="text-stone-400 text-sm">Carregando...</p></div>}>
      <CurvasContent />
    </Suspense>
  )
}
