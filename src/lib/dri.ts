// Dietary Reference Intakes — Padovani et al., Rev. Nutr. 2006;19(6):741-760
// Fonte: Institute of Medicine (1997-2005)

export type EstagioVida =
  | '0-6m' | '7-12m'
  | '1-3a' | '4-8a'
  | '9-13a-M' | '14-18a-M' | '19-30a-M' | '31-50a-M' | '51-70a-M' | '>70a-M'
  | '9-13a-F' | '14-18a-F' | '19-30a-F' | '31-50a-F' | '51-70a-F' | '>70a-F'

export type DRIEntry = {
  rda: number | null  // RDA ou AI
  ul: number | null   // Limite superior (UL)
  isAI: boolean       // true = AI (estimativa); false = RDA (evidência)
}

export type NutrienteDRI = {
  id: string
  nome: string
  unidade: string
  categoria: 'Vitamina' | 'Mineral'
  nota?: string
  valores: Record<EstagioVida, DRIEntry>
}

const r = (rda: number | null, ul: number | null): DRIEntry => ({ rda, ul, isAI: false })
const ai = (rda: number | null, ul: number | null): DRIEntry => ({ rda, ul, isAI: true })

export const NUTRIENTES_DRI: NutrienteDRI[] = [
  // ── VITAMINAS ────────────────────────────────────────────────────────────
  {
    id: 'vit-d',
    nome: 'Vitamina D',
    unidade: 'µg/dia',
    categoria: 'Vitamina',
    nota: '1 µg colecalciferol = 40 UI',
    valores: {
      '0-6m':     ai(5,   25),  '7-12m':    ai(5,   25),
      '1-3a':     ai(5,   50),  '4-8a':     ai(5,   50),
      '9-13a-M':  ai(5,   50),  '14-18a-M': ai(5,   50),
      '19-30a-M': ai(5,   50),  '31-50a-M': ai(5,   50),
      '51-70a-M': ai(10,  50),  '>70a-M':   ai(15,  50),
      '9-13a-F':  ai(5,   50),  '14-18a-F': ai(5,   50),
      '19-30a-F': ai(5,   50),  '31-50a-F': ai(5,   50),
      '51-70a-F': ai(10,  50),  '>70a-F':   ai(15,  50),
    },
  },
  {
    id: 'vit-c',
    nome: 'Vitamina C',
    unidade: 'mg/dia',
    categoria: 'Vitamina',
    valores: {
      '0-6m':     ai(40,  null), '7-12m':    ai(50,  null),
      '1-3a':     r(15,   400),  '4-8a':     r(25,   650),
      '9-13a-M':  r(45,   1200), '14-18a-M': r(75,   1800),
      '19-30a-M': r(90,   2000), '31-50a-M': r(90,   2000),
      '51-70a-M': r(90,   2000), '>70a-M':   r(90,   2000),
      '9-13a-F':  r(45,   1200), '14-18a-F': r(65,   1800),
      '19-30a-F': r(75,   2000), '31-50a-F': r(75,   2000),
      '51-70a-F': r(75,   2000), '>70a-F':   r(75,   2000),
    },
  },
  {
    id: 'vit-a',
    nome: 'Vitamina A',
    unidade: 'µg RAE/dia',
    categoria: 'Vitamina',
    nota: '1 RAE = 1 µg retinol = 12 µg β-caroteno',
    valores: {
      '0-6m':     ai(400, 600),  '7-12m':    ai(500, 600),
      '1-3a':     r(300,  600),  '4-8a':     r(400,  900),
      '9-13a-M':  r(600,  1700), '14-18a-M': r(900,  2800),
      '19-30a-M': r(900,  3000), '31-50a-M': r(900,  3000),
      '51-70a-M': r(900,  3000), '>70a-M':   r(900,  3000),
      '9-13a-F':  r(600,  1700), '14-18a-F': r(700,  2800),
      '19-30a-F': r(700,  3000), '31-50a-F': r(700,  3000),
      '51-70a-F': r(700,  3000), '>70a-F':   r(700,  3000),
    },
  },
  {
    id: 'vit-e',
    nome: 'Vitamina E',
    unidade: 'mg/dia',
    categoria: 'Vitamina',
    nota: 'α-tocoferol',
    valores: {
      '0-6m':     ai(4,  null),  '7-12m':    ai(5,  null),
      '1-3a':     r(6,   200),   '4-8a':     r(7,   300),
      '9-13a-M':  r(11,  600),   '14-18a-M': r(15,  800),
      '19-30a-M': r(15,  1000),  '31-50a-M': r(15,  1000),
      '51-70a-M': r(15,  1000),  '>70a-M':   r(15,  1000),
      '9-13a-F':  r(11,  600),   '14-18a-F': r(15,  800),
      '19-30a-F': r(15,  1000),  '31-50a-F': r(15,  1000),
      '51-70a-F': r(15,  1000),  '>70a-F':   r(15,  1000),
    },
  },
  {
    id: 'vit-k',
    nome: 'Vitamina K',
    unidade: 'µg/dia',
    categoria: 'Vitamina',
    valores: {
      '0-6m':     ai(2,   null), '7-12m':    ai(2.5, null),
      '1-3a':     ai(30,  null), '4-8a':     ai(55,  null),
      '9-13a-M':  ai(60,  null), '14-18a-M': ai(75,  null),
      '19-30a-M': ai(120, null), '31-50a-M': ai(120, null),
      '51-70a-M': ai(120, null), '>70a-M':   ai(120, null),
      '9-13a-F':  ai(60,  null), '14-18a-F': ai(75,  null),
      '19-30a-F': ai(90,  null), '31-50a-F': ai(90,  null),
      '51-70a-F': ai(90,  null), '>70a-F':   ai(90,  null),
    },
  },
  {
    id: 'vit-b1',
    nome: 'Vitamina B1 (Tiamina)',
    unidade: 'mg/dia',
    categoria: 'Vitamina',
    valores: {
      '0-6m':     ai(0.2, null), '7-12m':    ai(0.3, null),
      '1-3a':     r(0.5, null),  '4-8a':     r(0.6, null),
      '9-13a-M':  r(0.9, null),  '14-18a-M': r(1.2, null),
      '19-30a-M': r(1.2, null),  '31-50a-M': r(1.2, null),
      '51-70a-M': r(1.2, null),  '>70a-M':   r(1.2, null),
      '9-13a-F':  r(0.9, null),  '14-18a-F': r(1.0, null),
      '19-30a-F': r(1.1, null),  '31-50a-F': r(1.1, null),
      '51-70a-F': r(1.1, null),  '>70a-F':   r(1.1, null),
    },
  },
  {
    id: 'vit-b2',
    nome: 'Vitamina B2 (Riboflavina)',
    unidade: 'mg/dia',
    categoria: 'Vitamina',
    valores: {
      '0-6m':     ai(0.3, null), '7-12m':    ai(0.4, null),
      '1-3a':     r(0.5, null),  '4-8a':     r(0.6, null),
      '9-13a-M':  r(0.9, null),  '14-18a-M': r(1.3, null),
      '19-30a-M': r(1.3, null),  '31-50a-M': r(1.3, null),
      '51-70a-M': r(1.3, null),  '>70a-M':   r(1.3, null),
      '9-13a-F':  r(0.9, null),  '14-18a-F': r(1.0, null),
      '19-30a-F': r(1.1, null),  '31-50a-F': r(1.1, null),
      '51-70a-F': r(1.1, null),  '>70a-F':   r(1.1, null),
    },
  },
  {
    id: 'vit-b3',
    nome: 'Vitamina B3 (Niacina)',
    unidade: 'mg NE/dia',
    categoria: 'Vitamina',
    valores: {
      '0-6m':     ai(2,  null), '7-12m':    ai(4,  null),
      '1-3a':     r(6,   10),   '4-8a':     r(8,   15),
      '9-13a-M':  r(12,  20),   '14-18a-M': r(16,  30),
      '19-30a-M': r(16,  35),   '31-50a-M': r(16,  35),
      '51-70a-M': r(16,  35),   '>70a-M':   r(16,  35),
      '9-13a-F':  r(12,  20),   '14-18a-F': r(14,  30),
      '19-30a-F': r(14,  35),   '31-50a-F': r(14,  35),
      '51-70a-F': r(14,  35),   '>70a-F':   r(14,  35),
    },
  },
  {
    id: 'vit-b6',
    nome: 'Vitamina B6',
    unidade: 'mg/dia',
    categoria: 'Vitamina',
    valores: {
      '0-6m':     ai(0.1, null), '7-12m':    ai(0.3, null),
      '1-3a':     r(0.5, 30),   '4-8a':     r(0.6, 40),
      '9-13a-M':  r(1.0, 60),   '14-18a-M': r(1.3, 80),
      '19-30a-M': r(1.3, 100),  '31-50a-M': r(1.3, 100),
      '51-70a-M': r(1.7, 100),  '>70a-M':   r(1.7, 100),
      '9-13a-F':  r(1.0, 60),   '14-18a-F': r(1.2, 80),
      '19-30a-F': r(1.3, 100),  '31-50a-F': r(1.3, 100),
      '51-70a-F': r(1.5, 100),  '>70a-F':   r(1.5, 100),
    },
  },
  {
    id: 'vit-b12',
    nome: 'Vitamina B12',
    unidade: 'µg/dia',
    categoria: 'Vitamina',
    valores: {
      '0-6m':     ai(0.4, null), '7-12m':    ai(0.5, null),
      '1-3a':     r(0.9, null),  '4-8a':     r(1.2, null),
      '9-13a-M':  r(1.8, null),  '14-18a-M': r(2.4, null),
      '19-30a-M': r(2.4, null),  '31-50a-M': r(2.4, null),
      '51-70a-M': r(2.4, null),  '>70a-M':   r(2.4, null),
      '9-13a-F':  r(1.8, null),  '14-18a-F': r(2.4, null),
      '19-30a-F': r(2.4, null),  '31-50a-F': r(2.4, null),
      '51-70a-F': r(2.4, null),  '>70a-F':   r(2.4, null),
    },
  },
  {
    id: 'folato',
    nome: 'Folato (Ácido Fólico)',
    unidade: 'µg DFE/dia',
    categoria: 'Vitamina',
    nota: '1 DFE = 1µg folato alimentar = 0,6µg ácido fólico suplementar',
    valores: {
      '0-6m':     ai(65,  null), '7-12m':    ai(80,  null),
      '1-3a':     r(150,  300),  '4-8a':     r(200,  400),
      '9-13a-M':  r(300,  600),  '14-18a-M': r(400,  800),
      '19-30a-M': r(400,  1000), '31-50a-M': r(400,  1000),
      '51-70a-M': r(400,  1000), '>70a-M':   r(400,  1000),
      '9-13a-F':  r(300,  600),  '14-18a-F': r(400,  800),
      '19-30a-F': r(400,  1000), '31-50a-F': r(400,  1000),
      '51-70a-F': r(400,  1000), '>70a-F':   r(400,  1000),
    },
  },
  // ── MINERAIS ─────────────────────────────────────────────────────────────
  {
    id: 'calcio',
    nome: 'Cálcio',
    unidade: 'mg/dia',
    categoria: 'Mineral',
    valores: {
      '0-6m':     ai(210,  null), '7-12m':    ai(270,  null),
      '1-3a':     ai(500,  2500), '4-8a':     ai(800,  2500),
      '9-13a-M':  ai(1300, 2500), '14-18a-M': ai(1300, 2500),
      '19-30a-M': ai(1000, 2500), '31-50a-M': ai(1000, 2500),
      '51-70a-M': ai(1200, 2500), '>70a-M':   ai(1200, 2500),
      '9-13a-F':  ai(1300, 2500), '14-18a-F': ai(1300, 2500),
      '19-30a-F': ai(1000, 2500), '31-50a-F': ai(1000, 2500),
      '51-70a-F': ai(1200, 2500), '>70a-F':   ai(1200, 2500),
    },
  },
  {
    id: 'ferro',
    nome: 'Ferro',
    unidade: 'mg/dia',
    categoria: 'Mineral',
    valores: {
      '0-6m':     ai(0.27, 40),  '7-12m':    r(11,  40),
      '1-3a':     r(7,   40),    '4-8a':     r(10,  40),
      '9-13a-M':  r(8,   45),    '14-18a-M': r(11,  45),
      '19-30a-M': r(8,   45),    '31-50a-M': r(8,   45),
      '51-70a-M': r(8,   45),    '>70a-M':   r(8,   45),
      '9-13a-F':  r(8,   45),    '14-18a-F': r(15,  45),
      '19-30a-F': r(18,  45),    '31-50a-F': r(18,  45),
      '51-70a-F': r(8,   45),    '>70a-F':   r(8,   45),
    },
  },
  {
    id: 'zinco',
    nome: 'Zinco',
    unidade: 'mg/dia',
    categoria: 'Mineral',
    valores: {
      '0-6m':     ai(2,  4),    '7-12m':    ai(3,  5),
      '1-3a':     r(3,   7),    '4-8a':     r(5,   12),
      '9-13a-M':  r(8,   23),   '14-18a-M': r(11,  34),
      '19-30a-M': r(11,  40),   '31-50a-M': r(11,  40),
      '51-70a-M': r(11,  40),   '>70a-M':   r(11,  40),
      '9-13a-F':  r(8,   23),   '14-18a-F': r(9,   34),
      '19-30a-F': r(8,   40),   '31-50a-F': r(8,   40),
      '51-70a-F': r(8,   40),   '>70a-F':   r(8,   40),
    },
  },
  {
    id: 'magnesio',
    nome: 'Magnésio',
    unidade: 'mg/dia',
    categoria: 'Mineral',
    nota: 'UL refere-se apenas a suplementos (não inclui alimentos)',
    valores: {
      '0-6m':     ai(30,  null), '7-12m':    ai(75,  null),
      '1-3a':     r(80,   65),   '4-8a':     r(130,  110),
      '9-13a-M':  r(240,  350),  '14-18a-M': r(410,  350),
      '19-30a-M': r(400,  350),  '31-50a-M': r(420,  350),
      '51-70a-M': r(420,  350),  '>70a-M':   r(420,  350),
      '9-13a-F':  r(240,  350),  '14-18a-F': r(360,  350),
      '19-30a-F': r(310,  350),  '31-50a-F': r(320,  350),
      '51-70a-F': r(320,  350),  '>70a-F':   r(320,  350),
    },
  },
  {
    id: 'iodo',
    nome: 'Iodo',
    unidade: 'µg/dia',
    categoria: 'Mineral',
    valores: {
      '0-6m':     ai(110, null), '7-12m':    ai(130, null),
      '1-3a':     r(90,   200),  '4-8a':     r(90,   300),
      '9-13a-M':  r(120,  600),  '14-18a-M': r(150,  900),
      '19-30a-M': r(150,  1100), '31-50a-M': r(150,  1100),
      '51-70a-M': r(150,  1100), '>70a-M':   r(150,  1100),
      '9-13a-F':  r(120,  600),  '14-18a-F': r(150,  900),
      '19-30a-F': r(150,  1100), '31-50a-F': r(150,  1100),
      '51-70a-F': r(150,  1100), '>70a-F':   r(150,  1100),
    },
  },
  {
    id: 'selenio',
    nome: 'Selênio',
    unidade: 'µg/dia',
    categoria: 'Mineral',
    valores: {
      '0-6m':     ai(15, 45),   '7-12m':    ai(20, 60),
      '1-3a':     r(20,  90),   '4-8a':     r(30,  150),
      '9-13a-M':  r(40,  280),  '14-18a-M': r(55,  400),
      '19-30a-M': r(55,  400),  '31-50a-M': r(55,  400),
      '51-70a-M': r(55,  400),  '>70a-M':   r(55,  400),
      '9-13a-F':  r(40,  280),  '14-18a-F': r(55,  400),
      '19-30a-F': r(55,  400),  '31-50a-F': r(55,  400),
      '51-70a-F': r(55,  400),  '>70a-F':   r(55,  400),
    },
  },
  {
    id: 'fosforo',
    nome: 'Fósforo',
    unidade: 'mg/dia',
    categoria: 'Mineral',
    valores: {
      '0-6m':     ai(100,  null), '7-12m':    ai(275,  null),
      '1-3a':     r(460,   3000), '4-8a':     r(500,   3000),
      '9-13a-M':  r(1250,  4000), '14-18a-M': r(1250,  4000),
      '19-30a-M': r(700,   4000), '31-50a-M': r(700,   4000),
      '51-70a-M': r(700,   4000), '>70a-M':   r(700,   3000),
      '9-13a-F':  r(1250,  4000), '14-18a-F': r(1250,  4000),
      '19-30a-F': r(700,   4000), '31-50a-F': r(700,   4000),
      '51-70a-F': r(700,   4000), '>70a-F':   r(700,   3000),
    },
  },
]

export function getEstagioVida(idadeAnos: number, sexo: 'M' | 'F'): EstagioVida {
  if (idadeAnos < 0.5)  return '0-6m'
  if (idadeAnos < 1)    return '7-12m'
  if (idadeAnos < 4)    return '1-3a'
  if (idadeAnos < 9)    return '4-8a'
  const s = sexo
  if (idadeAnos < 14)   return s === 'M' ? '9-13a-M'  : '9-13a-F'
  if (idadeAnos < 19)   return s === 'M' ? '14-18a-M' : '14-18a-F'
  if (idadeAnos < 31)   return s === 'M' ? '19-30a-M' : '19-30a-F'
  if (idadeAnos < 51)   return s === 'M' ? '31-50a-M' : '31-50a-F'
  if (idadeAnos < 71)   return s === 'M' ? '51-70a-M' : '51-70a-F'
  return s === 'M' ? '>70a-M' : '>70a-F'
}

export function getDRI(nutrienteId: string, estagio: EstagioVida): DRIEntry | null {
  const n = NUTRIENTES_DRI.find(x => x.id === nutrienteId)
  return n ? n.valores[estagio] : null
}

export function formatEstagioLabel(e: EstagioVida): string {
  const map: Record<EstagioVida, string> = {
    '0-6m': '0–6 meses', '7-12m': '7–12 meses',
    '1-3a': '1–3 anos',  '4-8a':  '4–8 anos',
    '9-13a-M': '9–13 anos (M)',  '14-18a-M': '14–18 anos (M)',
    '19-30a-M': '19–30 anos (M)', '31-50a-M': '31–50 anos (M)',
    '51-70a-M': '51–70 anos (M)', '>70a-M': '> 70 anos (M)',
    '9-13a-F': '9–13 anos (F)',  '14-18a-F': '14–18 anos (F)',
    '19-30a-F': '19–30 anos (F)', '31-50a-F': '31–50 anos (F)',
    '51-70a-F': '51–70 anos (F)', '>70a-F': '> 70 anos (F)',
  }
  return map[e] ?? e
}
