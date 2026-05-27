'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { WHO_IMC, WHO_PESO, WHO_ALTURA, classifyPercentile, calcIdadeAnos, getChartSeries, getNutritionalStatus } from '@/lib/who'

type ChartTipo = 'imc' | 'peso' | 'altura'

function zoneColor(zone: string) {
  if (zone === 'critical_low' || zone === 'critical_high') return 'text-red-600 bg-red-50 border-red-200'
  if (zone === 'low' || zone === 'high') return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-green-700 bg-green-50 border-green-200'
}

function zoneIcon(zone: string) {
  if (zone === 'critical_low' || zone === 'critical_high') return '🔴'
  if (zone === 'low' || zone === 'high') return '🟡'
  return '🟢'
}

function Curva({ dataNasc, sexo, dataRef, pesoKg, altCm, tipo }: {
  dataNasc: string; sexo: string; dataRef: string
  pesoKg: number; altCm: number; tipo: ChartTipo
}) {
  const ageY = calcIdadeAnos(dataNasc, dataRef)
  const dataset = tipo === 'imc' ? WHO_IMC : tipo === 'peso' ? WHO_PESO : WHO_ALTURA
  const s = sexo as 'M' | 'F'
  const { ages, p3, p15, p50, p85, p97 } = getChartSeries(dataset, s, ageY)
  const curveData = ages.map((age: number, i: number) => ({
    age: parseFloat(age.toFixed(2)), p3: p3[i], p15: p15[i], p50: p50[i], p85: p85[i], p97: p97[i],
  }))
  const imc = pesoKg / Math.pow(altCm / 100, 2)
  const val = tipo === 'imc' ? imc : tipo === 'peso' ? pesoKg : altCm
  const unit = tipo === 'imc' ? 'kg/m²' : tipo === 'peso' ? 'kg' : 'cm'
  const { label, zone } = classifyPercentile(val, ageY, dataset, s)
  const nutritionalStatus = getNutritionalStatus(zone, tipo)
  const patientPoint = [{ age: parseFloat(ageY.toFixed(2)), val }]

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
            <p className="text-xs opacity-60">Percentil</p>
            <p className="text-sm font-semibold mt-0.5">{label}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-100 rounded-xl p-4">
        <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-3">
          {tipo === 'imc' ? 'IMC' : tipo === 'peso' ? 'Peso' : 'Altura'} × Idade — OMS ({sexo === 'M' ? 'Masculino' : 'Feminino'})
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis dataKey="age" type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={v => ageY <= 2 ? `${Math.round(v * 12)}m` : `${parseFloat(v).toFixed(0)}a`}
              tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={v => v.toFixed(0)} tick={{ fontSize: 10 }} width={32} />
            <Tooltip formatter={(v: any) => [`${parseFloat(v).toFixed(1)} ${unit}`]} />
            <Line data={curveData} dataKey="p97" stroke="#fca5a5" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="P97" />
            <Line data={curveData} dataKey="p85" stroke="#fcd34d" strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="P85" />
            <Line data={curveData} dataKey="p50" stroke="#86efac" strokeWidth={2} dot={false} name="P50" />
            <Line data={curveData} dataKey="p15" stroke="#fcd34d" strokeWidth={1.5} strokeDasharray="3 2" dot={false} name="P15" />
            <Line data={curveData} dataKey="p3" stroke="#fca5a5" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="P3" />
            <Line data={patientPoint} dataKey="val" stroke="#16a34a" strokeWidth={0}
              dot={{ fill: '#16a34a', r: 7, strokeWidth: 2.5, stroke: '#fff' }} name="Paciente" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {[['#fca5a5', 'P3 / P97'], ['#fcd34d', 'P15 / P85'], ['#86efac', 'P50'], ['#16a34a', 'Paciente']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-stone-400">{label}</span>
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

  const pesoKg = parseFloat(searchParams.get('peso') ?? '0')
  const altCm = parseFloat(searchParams.get('alt') ?? '0')
  const dataNasc = searchParams.get('nasc') ?? ''
  const sexo = searchParams.get('sexo') ?? ''
  const dataRef = searchParams.get('data') ?? new Date().toISOString().split('T')[0]

  const valid = pesoKg > 0 && altCm > 0 && dataNasc && (sexo === 'M' || sexo === 'F')

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-700">←</button>
          <h1 className="font-semibold text-base text-stone-800">Curvas OMS</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 pb-10 overflow-y-auto">
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
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${tipo === t ? 'bg-green-600 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}>
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
