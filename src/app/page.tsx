'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPacientes, deletePaciente, type Paciente } from '@/lib/supabase'
import { calcIdadeAnos } from '@/lib/who'

function idadeStr(dataNasc: string) {
  const anos = calcIdadeAnos(dataNasc)
  if (anos < 2) return `${Math.round(anos * 12)} meses`
  return `${Math.floor(anos)} anos`
}

export default function Home() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    getPacientes().then(setPacientes).finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Remover ${nome}?`)) return
    await deletePaciente(id)
    setPacientes(p => p.filter(x => x.id !== id))
  }

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-lg text-green-700">🌱 NutriCurvas</span>
          <Link href="/pacientes/novo" className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700">
            + Novo paciente
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <input type="search" placeholder="Buscar paciente..." value={busca}
          onChange={e => setBusca(e.target.value)} className="w-full mb-6 text-base" />
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            <p className="text-xs text-stone-400 mb-1">Total de pacientes</p>
            <p className="text-3xl font-semibold text-green-600">{pacientes.length}</p>
          </div>
          <div className="bg-white border border-stone-100 rounded-xl p-4">
            <p className="text-xs text-stone-400 mb-1">Resultado da busca</p>
            <p className="text-3xl font-semibold text-stone-700">{filtrados.length}</p>
          </div>
        </div>
        {loading ? (
          <p className="text-stone-400 text-center py-10">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p>Nenhum paciente encontrado.</p>
            {!busca && <Link href="/pacientes/novo" className="mt-2 inline-block text-green-600 hover:underline">Cadastrar primeiro paciente →</Link>}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtrados.map(p => (
              <li key={p.id} className="bg-white border border-stone-100 rounded-xl hover:border-green-200 hover:shadow-sm transition">
                <div className="flex items-center">
                  <Link href={`/pacientes/${p.id}`} className="flex-1 flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${p.sexo === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-stone-800">{p.nome}</p>
                      <p className="text-xs text-stone-400">{p.sexo === 'M' ? 'Masculino' : 'Feminino'} · {idadeStr(p.data_nascimento)}</p>
                    </div>
                  </Link>
                  <button onClick={() => handleDelete(p.id, p.nome)} className="p-4 text-stone-300 hover:text-red-400">✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
