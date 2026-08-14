import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { parsePdfText, normalizeDate } from '@/lib/preconsulta-parser'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  // Auth check usando chave anon (suficiente para verificar sessão)
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo PDF não encontrado.' }, { status: 400 })

    // File size limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo permitido: 10 MB.' }, { status: 413 })
    }

    // Basic MIME check
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Apenas arquivos PDF são aceitos.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Verify PDF magic bytes
    if (buffer.length < 4 || buffer.slice(0, 4).toString() !== '%PDF') {
      return NextResponse.json({ error: 'O arquivo não é um PDF válido.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    const { text } = await parser.getText()
    await parser.destroy()

    const fields = parsePdfText(text)

    if (fields.data_nascimento) {
      fields.data_nascimento = normalizeDate(fields.data_nascimento)
    }

    return NextResponse.json({ fields })
  } catch (err: unknown) {
    console.error('PDF parse error:', err)
    return NextResponse.json({ error: 'Erro ao ler o PDF. Verifique se o arquivo é válido.' }, { status: 500 })
  }
}
