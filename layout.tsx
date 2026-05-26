import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'

const font = Figtree({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'NutriCurvas – Avaliação de Crescimento OMS',
  description: 'Acompanhe o crescimento de pacientes com base nas curvas da OMS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={font.variable}>
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  )
}
