'use client'
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => router.replace('/'))
    } else {
      router.replace('/')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <span className="text-3xl">🌱</span>
        <p className="mt-3 text-stone-400 text-sm">Autenticando...</p>
      </div>
    </div>
  )
}
