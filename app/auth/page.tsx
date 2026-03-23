// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.replace('/catalog')
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, role: 'user' })
    }
    setSuccess('¡Cuenta creada! Revisá tu email para confirmar.')
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
          <img src="/logo.png" alt="Alma Orders" className="h-24 w-auto object-contain mx-auto mb-8" style={{filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'}} />
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

          <h2 className="font-display font-bold text-2xl text-on-surface mb-1">
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}
          </h2>
          <p className="font-body text-on-surface-variant text-sm mb-7">
            {mode === 'login' ? 'Continuá aprendiendo donde lo dejaste.' : 'Empezá a crecer con Alma Orders.'}
          </p>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-6">
            {[['login','Iniciar sesión'],['register','Registrarse']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-display font-semibold transition-all ${
                  mode === m ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Nombre completo</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Tu nombre" className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com" className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
          </div>

          {error && <div className="mt-4 px-4 py-3 bg-error-container rounded-xl text-on-error-container text-sm">{error}</div>}
          {success && <div className="mt-4 px-4 py-3 bg-primary/10 rounded-xl text-primary-dark text-sm font-medium">{success}</div>}

          <button onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading}
            className="btn-primary w-full py-3.5 mt-5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>

          <p className="text-center text-xs text-on-surface-variant/50 mt-6">© 2025 Alma Orders · Academia</p>
        </div>
      </div>
    </div>
  )
}
