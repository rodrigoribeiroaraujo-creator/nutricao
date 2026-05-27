'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/supabase'

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter ao menos 6 caracteres.',
}

function parseError(msg: string) {
  return AUTH_ERRORS[msg] ?? msg
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password)
        router.replace('/')
      } else {
        await signUpWithEmail(email, password)
        setMessage('Verifique seu e-mail para confirmar o cadastro.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro.'
      setError(parseError(msg))
    } finally {
      setLoading(false)
    }
  }

  function handleGoogle() {
    signInWithGoogle(`${window.location.origin}/auth/callback`)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-green-600 md:items-center md:justify-center md:bg-stone-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Topo com branding — só mobile */}
      <div className="flex-1 md:hidden flex flex-col items-center justify-end pb-10 px-4">
        <span className="text-6xl mb-4">🌱</span>
        <h1 className="text-3xl font-bold text-white">NutriCurvas</h1>
        <p className="text-sm text-green-200 mt-1">Avaliação de Crescimento OMS</p>
      </div>

      {/* Card do formulário */}
      <div className="bg-white rounded-t-3xl md:rounded-2xl md:shadow-sm md:border md:border-stone-100 md:w-full md:max-w-sm px-6 pt-8 md:pt-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {/* Logo — só desktop */}
        <div className="hidden md:block text-center mb-8">
          <span className="text-5xl">🌱</span>
          <h1 className="text-2xl font-semibold text-green-700 mt-3">NutriCurvas</h1>
          <p className="text-sm text-stone-400 mt-1">Avaliação de Crescimento OMS</p>
        </div>
        {/* Tabs */}
        <div className="flex bg-stone-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setMessage('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'login' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(''); setMessage('') }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'signup' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
          >
            Criar conta
          </button>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-stone-200 rounded-xl py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 mb-4"
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-stone-100" />
          <span className="text-xs text-stone-300">ou</span>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full"
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )

}
