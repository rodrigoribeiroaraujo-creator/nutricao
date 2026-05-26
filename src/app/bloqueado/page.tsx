'use client'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase'

export default function BloqueadoPage() {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-stone-50">
      <div className="w-full max-w-sm text-center">
        <span className="text-4xl">🚫</span>
        <h1 className="text-xl font-semibold text-stone-800 mt-4">Acesso bloqueado</h1>
        <p className="text-sm text-stone-400 mt-2">
          Sua conta foi bloqueada. Entre em contato com o administrador do sistema.
        </p>
        <button
          onClick={handleSignOut}
          className="mt-6 text-sm text-stone-400 hover:text-stone-600 underline"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
