// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.replace('/catalog')
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: 'user'
      })
    }
    setSuccess('¡Cuenta creada! Revisá tu email para confirmar.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background ambient gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00450d 0%, #065f18 100%)'}}>
              <span className="text-white font-display font-bold text-lg">A</span>
            </div>
            <span className="font-display font-bold text-2xl text-on-surface">Alma Orders</span>
          </div>
          <p className="text-on-surface-variant font-body text-sm mt-1">Centro de Formación</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 modal-shadow">
          {/* Tabs */}
          <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-8">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-2xl text-on-surface mb-1">
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear una cuenta'}
          </h1>
          <p className="text-on-surface-variant text-sm mb-8">
            {mode === 'login' ? 'Accedé a tus cursos y continuá aprendiendo.' : 'Empezá a aprender con Alma Orders.'}
          </p>

          {/* Fields */}
          <div className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 px-4 py-3 bg-error-container rounded-xl text-on-error-container text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 px-4 py-3 bg-primary/10 rounded-xl text-primary text-sm">
              {success}
            </div>
          )}

          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            className="btn-primary w-full py-3.5 mt-6 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          © 2025 Alma Orders · Plataforma de Formación
        </p>
      </div>
    </div>
  )
}
