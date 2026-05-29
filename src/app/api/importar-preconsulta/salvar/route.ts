import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeSex, extractNumber } from '@/lib/preconsulta-parser'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Servidor não configurado.' }, { status: 500 })

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const fields: Record<string, string> = await req.json()

  const nome = fields.nome_paciente?.trim()
  const data_nascimento = fields.data_nascimento?.trim()
  if (!nome) return NextResponse.json({ error: 'Nome da criança é obrigatório.' }, { status: 400 })
  if (!data_nascimento) return NextResponse.json({ error: 'Data de nascimento é obrigatória.' }, { status: 400 })

  const sexo = normalizeSex(fields.sexo || 'M')

  // Create patient
  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from('pacientes')
    .insert({ nome, data_nascimento, sexo, observacoes: fields.info_adicional || null })
    .select()
    .single()

  if (pacienteError) return NextResponse.json({ error: pacienteError.message }, { status: 500 })

  // Create measurement if peso and altura are available
  const peso = extractNumber(fields.peso_atual || '')
  const altura = extractNumber(fields.altura_atual || '')
  if (peso && altura && peso > 0 && altura > 0) {
    await supabaseAdmin.from('medicoes').insert({
      paciente_id: paciente.id,
      data_medicao: new Date().toISOString().split('T')[0],
      peso_kg: peso,
      altura_cm: altura,
    })
  }

  // Build anamnesis dados from remaining fields
  const PATIENT_FIELDS = new Set(['nome_paciente', 'data_nascimento', 'sexo', 'peso_atual', 'altura_atual', 'info_adicional'])
  const dados: Record<string, string> = { origem: 'formulario_preconsulta' }
  for (const [k, v] of Object.entries(fields)) {
    if (!PATIENT_FIELDS.has(k) && v?.trim()) dados[k] = v.trim()
  }

  await supabaseAdmin.from('anamneses_tea').insert({
    nome_paciente: nome,
    data_consulta: new Date().toISOString().split('T')[0],
    dados,
    created_by: user.id,
  })

  return NextResponse.json({ pacienteId: paciente.id })
}
