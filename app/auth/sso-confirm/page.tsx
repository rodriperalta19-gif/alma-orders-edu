// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SSOConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [status, setStatus] = useState('Verificando tu acceso...')
  const [error, setError] = useState('')

  useEffect(() => {
    const actionLink = searchParams.get('action_link')
    const next = searchParams.get('next') || '/catalog'
    const email = searchParams.get('email')

    if (!actionLink) {
      router.replace('/auth?error=invalid_sso')
      return
    }

    const handleSSO = async () => {
      try {
        setStatus('Iniciando sesión automática...')

        // Extract token_hash from action_link
        const url = new URL(actionLink)
        const tokenHash = url.searchParams.get('token_hash') ||
          url.searchParams.get('token')
        const type = url.searchParams.get('type') || 'magiclink'

        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'magiclink',
          })

          if (error) {
            console.warn('OTP verify failed, trying direct link:', error.message)
          } else if (data.session) {
            setStatus('¡Acceso concedido! Redirigiendo...')
            setTimeout(() => router.replace(next), 500)
            return
          }
        }

        // Fallback: redirect to action_link directly
        window.location.href = actionLink

      } catch (err: any) {
        console.error('SSO confirm error:', err)
        setError('Error al iniciar sesión. Redirigiendo al login...')
        setTimeout(() => router.replace('/auth?error=invalid_sso'), 2000)
      }
    }

    handleSSO()
  }, [])

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <img src="/logo-dark.png" alt="Alma Orders" className="h-20 w-20 rounded-full object-contain mx-auto mb-6" />

        {!error ? (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
            <p className="font-display font-semibold text-white text-lg mb-2">Academia Alma Orders</p>
            <p className="font-body text-white/60 text-sm">{status}</p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-5xl text-error/70 mb-4 block">error</span>
            <p className="font-display font-semibold text-white text-lg mb-2">Algo salió mal</p>
            <p className="font-body text-white/60 text-sm">{error}</p>
          </>
        )}
      </div>
    </div>
  )
}
