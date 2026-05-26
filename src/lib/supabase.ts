import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Paciente = {
  id: string
  nome: string
  data_nascimento: string
  sexo: 'M' | 'F'
  observacoes?: string
  created_at: string
  updated_at: string
}

export type Medicao = {
  id: string
  paciente_id: string
  data_medicao: string
  peso_kg: number
  altura_cm: number
  imc: number
  imc_percentil?: string
  peso_percentil?: string
  altura_percentil?: string
  observacoes?: string
  created_at: string
}

export async function getPacientes() {
  const { data, error } = await supabase.from('pacientes').select('*').order('nome')
  if (error) throw error
  return data as Paciente[]
}

export async function getPaciente(id: string) {
  const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).single()
  if (error) throw error
  return data as Paciente
}

export async function createPaciente(p: Omit<Paciente, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('pacientes').insert(p).select().single()
  if (error) throw error
  return data as Paciente
}

export async function deletePaciente(id: string) {
  const { error } = await supabase.from('pacientes').delete().eq('id', id)
  if (error) throw error
}

export async function getMedicoes(paciente_id: string) {
  const { data, error } = await supabase.from('medicoes').select('*').eq('paciente_id', paciente_id).order('data_medicao', { ascending: true })
  if (error) throw error
  return data as Medicao[]
}

export async function createMedicao(m: Omit<Medicao, 'id' | 'imc' | 'created_at'>) {
  const { data, error } = await supabase.from('medicoes').insert(m).select().single()
  if (error) throw error
  return data as Medicao
}

export async function deleteMedicao(id: string) {
  const { error } = await supabase.from('medicoes').delete().eq('id', id)
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle(redirectTo: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
