import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NutriCurvas – Avaliação de Crescimento OMS',
  description: 'Acompanhe o crescimento de pacientes com base nas curvas da OMS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  )
}
