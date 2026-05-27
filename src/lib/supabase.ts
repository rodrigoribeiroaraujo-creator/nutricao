import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-build-time-key'

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

export async function updatePaciente(id: string, p: Partial<Omit<Paciente, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase.from('pacientes').update(p).eq('id', id).select().single()
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

export type Profile = {
  id: string
  email: string
  role: 'admin' | 'nutricionista' | 'assistente'
  status: 'pending' | 'active' | 'blocked'
  created_at: string
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data as Profile
}

export async function getProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) throw error
  return data as Profile[]
}

export async function updateProfile(id: string, updates: Partial<Pick<Profile, 'role' | 'status'>>) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id)
  if (error) throw error
}

export type AnamneseTea = {
  id: string
  nome_paciente: string
  data_consulta: string | null
  nutricionista: string | null
  nivel_tea: string | null
  dados: Record<string, string>
  created_by: string
  created_at: string
}

export async function getAnamnesesTea() {
  const { data, error } = await supabase
    .from('anamneses_tea')
    .select('id, nome_paciente, data_consulta, nutricionista, nivel_tea, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Omit<AnamneseTea, 'dados'>[]
}

export async function getAnamneseTea(id: string) {
  const { data, error } = await supabase.from('anamneses_tea').select('*').eq('id', id).single()
  if (error) throw error
  return data as AnamneseTea
}

export async function createAnamneseTea(a: {
  nome_paciente: string
  data_consulta?: string
  nutricionista?: string
  nivel_tea?: string
  dados: Record<string, string>
  created_by: string
}) {
  const { data, error } = await supabase.from('anamneses_tea').insert(a).select().single()
  if (error) throw error
  return data as AnamneseTea
}

export async function updateAnamneseTea(id: string, updates: {
  nome_paciente?: string
  data_consulta?: string | null
  nutricionista?: string | null
  nivel_tea?: string | null
  dados?: Record<string, string>
}) {
  const { error } = await supabase.from('anamneses_tea').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteAnamneseTea(id: string) {
  const { error } = await supabase.from('anamneses_tea').delete().eq('id', id)
  if (error) throw error
}

export type Consulta = {
  id: string
  paciente_id: string | null
  data: string
  valor: number
  status: 'pago' | 'pendente' | 'cancelado'
  descricao?: string | null
  created_at: string
  pacientes?: { nome: string } | null
}

export async function getConsultas() {
  const { data, error } = await supabase
    .from('consultas')
    .select('*, pacientes(nome)')
    .order('data', { ascending: false })
  if (error) throw error
  return data as Consulta[]
}

export async function getConsultasByPaciente(pacienteId: string) {
  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('data', { ascending: false })
  if (error) throw error
  return data as Consulta[]
}

export async function createConsulta(c: Omit<Consulta, 'id' | 'created_at' | 'pacientes'>) {
  const { data, error } = await supabase.from('consultas').insert(c).select().single()
  if (error) throw error
  return data as Consulta
}

export async function updateConsultaStatus(id: string, status: Consulta['status']) {
  const { error } = await supabase.from('consultas').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteConsulta(id: string) {
  const { error } = await supabase.from('consultas').delete().eq('id', id)
  if (error) throw error
}
