// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setChecked(true)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setMenuOpen(false)
    router.replace('/catalog')
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <nav className="glass-nav sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/catalog" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Alma Orders" className="h-10 w-auto object-contain" />
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/catalog" className={`px-4 py-2 rounded-xl font-body text-sm font-medium transition-all ${
            pathname === '/catalog'
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}>
            Cursos
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`px-4 py-2 rounded-xl font-body text-sm font-medium transition-all ${
              pathname.startsWith('/admin')
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}>
              Administrar
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="relative">
          {checked && !profile ? (
            // No hay sesión: mostrar botón discreto de acceso admin
            <Link href="/auth">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all text-xs font-body">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span className="hidden md:block">Admin</span>
              </button>
            </Link>
          ) : profile ? (
            // Hay sesión: mostrar menú de usuario
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container-high transition-all">
              <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-display font-bold text-white"
                    style={{background: 'linear-gradient(135deg, #00C853 0%, #009624 100%)'}}>
                    {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="font-body text-xs font-semibold text-on-surface leading-tight max-w-[110px] truncate">{profile?.full_name || 'Admin'}</p>
                {isAdmin && <p className="font-body text-[10px] text-primary leading-tight">Admin</p>}
              </div>
              <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
            </button>
          ) : null}

          {menuOpen && profile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-2xl modal-shadow py-2 z-50 border border-outline-variant/20">
                <div className="px-4 py-3 border-b border-surface-container-high">
                  <p className="font-display font-semibold text-sm text-on-surface truncate">{profile?.full_name}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-display font-bold bg-primary/15 text-primary-dark">
                    ⚡ Admin
                  </span>
                </div>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-base text-primary">admin_panel_settings</span>
                    <span className="font-body text-sm text-on-surface">Panel Admin</span>
                  </Link>
                )}
                <div className="my-1 mx-4 h-px bg-surface-container-high" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">logout</span>
                  <span className="font-body text-sm text-on-surface">Cerrar sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
