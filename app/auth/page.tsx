// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const ssoError = searchParams.get('error')

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.replace('/admin')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - dark */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <img src="/logo-dark.png" alt="Alma Orders" className="h-24 w-auto object-contain mx-auto mb-8" />
          <h1 className="font-display font-bold text-4xl text-white leading-tight mb-4">
            Academia<br/>
            <span style={{color:'#00C853'}}>Alma Orders</span>
          </h1>
          <p className="font-body text-white/60 text-lg leading-relaxed">
            Educación práctica en Ventas, Finanzas, Marketing, Atención al Cliente y Experiencia de Entrega.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {['📦 Delivery', '💰 Finanzas', '📱 Marketing', '⭐ Atención'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-body">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-surface-container-lowest">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo.png" alt="Alma Orders" className="h-16 w-auto object-contain mx-auto" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-4">
            <span className="material-symbols-outlined text-primary text-sm">admin_panel_settings</span>
            <span className="text-primary font-display font-semibold text-xs uppercase tracking-widest">Acceso Administrador</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-on-surface mb-1">
            Ingresá al panel
          </h2>
          <p className="font-body text-on-surface-variant text-sm mb-7">
            Acceso exclusivo para administradores.
          </p>

          {/* SSO Error */}
          {ssoError && (
            <div className="mb-5 px-4 py-3 bg-error-container rounded-xl text-on-error-container text-sm text-center">
              {ssoError === 'missing_token' ? 'Token de acceso faltante.' : 'El link de acceso no es válido o expiró.'}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
          </div>

          {error && <div className="mt-4 px-4 py-3 bg-error-container rounded-xl text-on-error-container text-sm">{error}</div>}

          <button onClick={handleLogin} disabled={loading}
            className="btn-primary w-full py-3.5 mt-5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            {loading ? 'Ingresando...' : 'Ingresar al panel'}
          </button>

          <p className="text-center text-xs text-on-surface-variant/50 mt-6">© 2025 Alma Orders · Academia</p>
        </div>
      </div>
    </div>
  )
}
