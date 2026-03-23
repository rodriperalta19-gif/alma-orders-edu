// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState({ totalCourses: 0, completedLessons: 0, totalLessons: 0 })

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth'); return }
      setUserId(session.user.id)
      fetchProfile(session.user.id)
      fetchStats(session.user.id)
    })
  }, [])

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) {
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || ''
      })
    }
    setLoading(false)
  }

  const fetchStats = async (uid) => {
    const { data: progress } = await supabase.from('user_progress').select('lesson_id, is_completed').eq('user_id', uid)
    const { data: allLessons } = await supabase.from('lessons').select('id')
    const { data: courses } = await supabase.from('courses').select('id')
    setStats({
      totalCourses: courses?.length || 0,
      completedLessons: progress?.filter(p => p.is_completed).length || 0,
      totalLessons: allLessons?.length || 0
    })
  }

  const saveProfile = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
      avatar_url: form.avatar_url
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { alert('La imagen debe ser menor a 3MB'); return }
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const fileName = `avatar-${userId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('course-images').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(fileName)
      setForm(prev => ({ ...prev, avatar_url: publicUrl }))
    }
    setUploadingAvatar(false)
  }

  const progressPct = stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-16 animate-pulse space-y-4">
        <div className="h-8 bg-surface-container-high rounded w-1/3" />
        <div className="h-48 bg-surface-container-high rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/catalog" className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-on-surface">Mi perfil</h1>
            <p className="font-body text-sm text-on-surface-variant">Editá tu información personal</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Cursos disponibles', value: stats.totalCourses, icon: 'school' },
            { label: 'Lecciones completadas', value: stats.completedLessons, icon: 'check_circle' },
            { label: 'Progreso general', value: `${progressPct}%`, icon: 'trending_up' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-4 text-center border border-outline-variant/20">
              <span className="material-symbols-outlined text-2xl text-primary mb-1 block">{s.icon}</span>
              <p className="font-display font-bold text-xl text-on-surface">{s.value}</p>
              <p className="font-body text-[11px] text-on-surface-variant leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {stats.totalLessons > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-5 mb-6 border border-outline-variant/20">
            <div className="flex items-center justify-between mb-2">
              <p className="font-display font-semibold text-sm text-on-surface">Progreso general</p>
              <span className="font-display font-bold text-sm text-primary">{progressPct}%</span>
            </div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div className="progress-leaf h-full transition-all duration-700" style={{width:`${progressPct}%`}} />
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-2">
              {stats.completedLessons} de {stats.totalLessons} lecciones completadas
            </p>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/20">
          <h2 className="font-display font-semibold text-base text-on-surface mb-6">Información personal</h2>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container-high flex-shrink-0">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-display font-bold text-white"
                    style={{background:'linear-gradient(135deg,#00C853,#009624)'}}>
                    {form.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors">
                {uploadingAvatar
                  ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-white" style={{fontSize:'14px'}}>edit</span>
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div>
              <p className="font-display font-semibold text-base text-on-surface">{form.full_name || 'Sin nombre'}</p>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">
                {profile?.role === 'admin' ? '⚡ Administrador' : '👤 Estudiante'}
              </p>
              <button onClick={() => fileRef.current?.click()}
                className="font-body text-xs text-primary hover:underline mt-1 block">
                Cambiar foto de perfil
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Nombre completo
              </label>
              <input type="text" value={form.full_name}
                onChange={e => setForm(prev => ({...prev, full_name: e.target.value}))}
                placeholder="Tu nombre completo"
                className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Teléfono / WhatsApp
              </label>
              <input type="tel" value={form.phone}
                onChange={e => setForm(prev => ({...prev, phone: e.target.value}))}
                placeholder="+54 9 261 000-0000"
                className="w-full bg-surface-container px-4 py-3 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving}
            className="btn-primary w-full py-3.5 mt-6 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving
              ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <span className="material-symbols-outlined text-base">{saved ? 'check' : 'save'}</span>
            }
            {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-4 bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/20">
          <Link href="/catalog" className="flex items-center gap-3 px-2 py-2.5 hover:bg-surface-container-low rounded-xl transition-colors">
            <span className="material-symbols-outlined text-base text-primary">school</span>
            <span className="font-body text-sm text-on-surface">Ver mis cursos</span>
            <span className="material-symbols-outlined text-base text-on-surface-variant ml-auto">chevron_right</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
