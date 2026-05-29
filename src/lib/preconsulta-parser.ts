export interface ParsedPreconsulta {
  // Patient fields
  nome_paciente: string
  data_nascimento: string
  sexo: string
  // Measured fields
  peso_atual: string
  altura_atual: string
  // Anamnesis dados
  idade: string
  diagnostico_medico: string
  qual_diagnostico: string
  medicamentos: string
  amamentacao: string
  num_refeicoes: string
  cafe_manha: string
  alimentos_frequentes: string
  dificuldade_novos: string
  alimentos_recusados: string
  texturas: string
  comportamento_refeicoes: string
  local_refeicoes: string
  sintomas_gi: string
  objetivo_consulta: string
  info_adicional: string
  [key: string]: string
}

const SECTION_HEADERS = [
  'identificação da criança',
  'informações básicas de saúde',
  'uso de medicamentos ou suplementos',
  'histórico alimentar inicial',
  'rotina alimentar atual',
  'consumo alimentar',
  'seletividade alimentar',
  'essa parte é muito importante',
  'comportamento nas refeições',
  'ambiente das refeições',
  'sintomas gastrointestinais',
  'objetivo da consulta',
  'informações adicionais',
  'pergunta bônus',
  'se possível, envie fotos',
  'nunca envie senhas',
  'este conteúdo não foi criado',
  'indica uma pergunta obrigatória',
]

const QUESTIONS: Array<{ key: string; pattern: RegExp }> = [
  { key: 'nome_paciente',         pattern: /^nome da criança\s*\*?$/i },
  { key: 'data_nascimento',       pattern: /^data de nascimento\s*\*?$/i },
  { key: 'idade',                 pattern: /^idade\s*\*?$/i },
  { key: 'sexo',                  pattern: /^sexo da criança\s*\*?$/i },
  { key: 'peso_atual',            pattern: /^peso atual da criança/i },
  { key: 'altura_atual',          pattern: /^altura atual/i },
  { key: 'diagnostico_medico',    pattern: /^a criança possui algum diagnóstico médico/i },
  { key: 'qual_diagnostico',      pattern: /^se sim[:\s]*qual diagnóstico/i },
  { key: 'medicamentos',          pattern: /^a criança faz uso de algum medicamento/i },
  { key: 'amamentacao',           pattern: /^a criança foi amamentada/i },
  { key: 'num_refeicoes',         pattern: /^quantas refeições a criança costuma fazer/i },
  { key: 'cafe_manha',            pattern: /^a criança costuma tomar café da manhã/i },
  { key: 'alimentos_frequentes',  pattern: /^quais desses alimentos a criança costuma consumir/i },
  { key: 'dificuldade_novos',     pattern: /^a criança apresenta dificuldade para aceitar novos alimentos/i },
  { key: 'alimentos_recusados',   pattern: /^existe algum alimento que a criança recusa completamente/i },
  { key: 'texturas',              pattern: /^a criança aceita alimentos com diferentes texturas/i },
  { key: 'comportamento_refeicoes', pattern: /^durante as refeições[,.]?\s*a criança costuma/i },
  { key: 'local_refeicoes',       pattern: /^onde a criança costuma fazer as refeições/i },
  { key: 'sintomas_gi',           pattern: /^a criança apresenta com frequência/i },
  { key: 'objetivo_consulta',     pattern: /^qual o principal objetivo com o acompanhamento/i },
  { key: 'info_adicional',        pattern: /^existe alguma informação importante sobre a alimentação/i },
]

function isSectionHeader(line: string): boolean {
  const l = line.toLowerCase()
  return SECTION_HEADERS.some(h => l.includes(h))
}

function matchQuestion(line: string): string | null {
  for (const q of QUESTIONS) {
    if (q.pattern.test(line.trim())) return q.key
  }
  return null
}

export function parsePdfText(text: string): Partial<ParsedPreconsulta> {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const result: Record<string, string> = {}

  let currentKey: string | null = null
  let answerParts: string[] = []

  function saveAnswer() {
    if (currentKey && answerParts.length > 0) {
      result[currentKey] = answerParts.join(', ')
    }
  }

  for (const line of lines) {
    const key = matchQuestion(line)
    if (key) {
      saveAnswer()
      currentKey = key
      answerParts = []
    } else if (currentKey && !isSectionHeader(line)) {
      answerParts.push(line)
    }
  }

  saveAnswer()
  return result
}

// DD/MM/YYYY → YYYY-MM-DD
export function normalizeDate(value: string): string {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim()
  return value
}

// "Masculino"/"Feminino"/… → "M" | "F"
export function normalizeSex(value: string): 'M' | 'F' {
  const v = value.trim().toLowerCase()
  if (['f', 'feminino', 'fem', 'fem.', 'menina'].includes(v)) return 'F'
  return 'M'
}

// "12,5 kg" → 12.5
export function extractNumber(value: string): number | null {
  const m = value.replace(',', '.').match(/\d+(\.\d+)?/)
  if (!m) return null
  const n = parseFloat(m[0])
  return isNaN(n) ? null : n
}

export const FIELD_LABELS: Record<string, string> = {
  nome_paciente:           'Nome da criança',
  data_nascimento:         'Data de nascimento',
  idade:                   'Idade',
  sexo:                    'Sexo',
  peso_atual:              'Peso atual (kg)',
  altura_atual:            'Altura atual (cm)',
  diagnostico_medico:      'Possui diagnóstico médico?',
  qual_diagnostico:        'Qual diagnóstico?',
  medicamentos:            'Medicamentos / Suplementos',
  amamentacao:             'Foi amamentada?',
  num_refeicoes:           'Refeições por dia',
  cafe_manha:              'Café da manhã',
  alimentos_frequentes:    'Alimentos consumidos com frequência',
  dificuldade_novos:       'Dificuldade com novos alimentos',
  alimentos_recusados:     'Alimentos recusados completamente',
  texturas:                'Aceita diferentes texturas?',
  comportamento_refeicoes: 'Comportamento nas refeições',
  local_refeicoes:         'Local das refeições',
  sintomas_gi:             'Sintomas gastrointestinais',
  objetivo_consulta:       'Objetivo do acompanhamento',
  info_adicional:          'Informações adicionais',
}
