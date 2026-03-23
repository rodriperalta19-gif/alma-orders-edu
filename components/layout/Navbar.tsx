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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <nav className="glass-nav sticky top-0 z-50 border-b border-outline-variant/20">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/catalog" className="flex items-center gap-2">
          <img src="/logo.png" alt="Alma Orders" className="h-9 w-auto object-contain" />
          <div className="leading-tight hidden sm:block">
            <span className="font-display font-bold text-sm text-on-surface block">Alma Orders</span>
            <span className="font-body text-[10px] text-on-surface-variant -mt-0.5 block">Centro de Formación</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/catalog" className={`font-body text-sm transition-colors ${pathname === '/catalog' ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
            Cursos
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`font-body text-sm transition-colors ${pathname.startsWith('/admin') ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
              Administrar
            </Link>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-display font-bold text-white flex-shrink-0" style={{background: 'linear-gradient(135deg, #00450d 0%, #065f18 100%)'}}>
              {profile?.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="hidden md:block font-body text-sm text-on-surface max-w-[120px] truncate">{profile?.full_name || 'Usuario'}</span>
            <span className="material-symbols-outlined text-base text-on-surface-variant">expand_more</span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-surface-container-lowest rounded-xl modal-shadow py-2 z-50">
                <div className="px-4 py-2 border-b border-surface-container-high mb-1">
                  <p className="font-body text-xs text-on-surface font-medium truncate">{profile?.full_name}</p>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-display font-semibold">
                      Admin
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">admin_panel_settings</span>
                    <span className="font-body text-sm text-on-surface">Panel Admin</span>
                  </Link>
                )}
                <Link href="/catalog" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-base text-on-surface-variant">school</span>
                  <span className="font-body text-sm text-on-surface">Mis Cursos</span>
                </Link>
                <div className="my-1 h-px bg-surface-container-high mx-4" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors">
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
