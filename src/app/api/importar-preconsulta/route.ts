import { NextRequest, NextResponse } from 'next/server'
import { parsePdfText, normalizeDate } from '@/lib/preconsulta-parser'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo PDF não encontrado.' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Use lib path to avoid Next.js test-file conflict with pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse')
    const { text } = await pdfParse(buffer)

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
