// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

export default function StudentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role !== 'admin') { setAccessDenied(true); setLoading(false); return }
      fetchStudents()
    })
  }, [])

  const fetchStudents = async () => {
    const [{ data: profiles }, { data: progress }, { data: lessons }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_progress').select('user_id, is_completed'),
      supabase.from('lessons').select('id')
    ])
    const totalLessons = lessons?.length || 0
    const enriched = (profiles || []).map(p => {
      const userProgress = progress?.filter(pr => pr.user_id === p.id) || []
      const completed = userProgress.filter(pr => pr.is_completed).length
      const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0
      return { ...p, completedLessons: completed, totalLessons, pct }
    })
    setStudents(enriched)
    setLoading(false)
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.toLowerCase().includes(search.toLowerCase())
  )

  const totalStudents = students.filter(s => s.role === 'user').length
  const activeStudents = students.filter(s => s.role === 'user' && s.completedLessons > 0).length
  const avgProgress = totalStudents > 0
    ? Math.round(students.filter(s => s.role === 'user').reduce((acc, s) => acc + s.pct, 0) / totalStudents)
    : 0

  if (accessDenied) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <span className="material-symbols-outlined text-6xl text-error/50">lock</span>
        <h1 className="font-display font-bold text-2xl text-on-surface mt-4 mb-2">Acceso denegado</h1>
        <Link href="/catalog"><button className="btn-primary px-6 py-3 text-sm font-semibold mt-2">Volver a cursos</button></Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-1">
              <span className="text-primary font-display font-semibold text-xs uppercase tracking-widest">Panel Admin</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-on-surface">Alumnos registrados</h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total alumnos', value: totalStudents, icon: 'people', color: '#00C853' },
            { label: 'Con actividad', value: activeStudents, icon: 'trending_up', color: '#0a0a0a' },
            { label: 'Progreso promedio', value: `${avgProgress}%`, icon: 'emoji_events', color: '#00C853' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{backgroundColor: s.color + '15'}}>
                <span className="material-symbols-outlined text-base" style={{color: s.color}}>{s.icon}</span>
              </div>
              <p className="font-display font-bold text-3xl text-on-surface">{loading ? '—' : s.value}</p>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative mb-5">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full bg-surface-container-lowest pl-11 pr-4 py-3 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border border-outline-variant/20" />
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container-high rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">people</span>
            <p className="font-display font-semibold text-on-surface-variant mt-3">{search ? 'Sin resultados' : 'Sin alumnos registrados'}</p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-surface-container-low border-b border-outline-variant/20">
              <div className="col-span-4"><p className="font-display font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Alumno</p></div>
              <div className="col-span-3"><p className="font-display font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Teléfono</p></div>
              <div className="col-span-3"><p className="font-display font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Progreso</p></div>
              <div className="col-span-2"><p className="font-display font-semibold text-xs text-on-surface-variant uppercase tracking-wider">Rol</p></div>
            </div>
            {filtered.map((student, i) => (
              <div key={student.id} className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-surface-container-low transition-colors ${i < filtered.length - 1 ? 'border-b border-outline-variant/10' : ''}`}>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-display font-bold text-white" style={{background:'linear-gradient(135deg,#00C853,#009624)'}}>
                        {student.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-medium text-sm text-on-surface truncate">{student.full_name || 'Sin nombre'}</p>
                    <p className="font-body text-xs text-on-surface-variant/60">{student.created_at ? new Date(student.created_at).toLocaleDateString('es-AR') : ''}</p>
                  </div>
                </div>
                <div className="col-span-3">
                  {student.phone ? (
                    <a href={`https://wa.me/${student.phone.replace(/\D/g,'')}`} target="_blank" className="flex items-center gap-1.5 text-primary hover:underline">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      <span className="font-body text-sm">{student.phone}</span>
                    </a>
                  ) : <span className="font-body text-sm text-on-surface-variant/40">—</span>}
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="progress-leaf h-full" style={{width:`${student.pct}%`}} />
                    </div>
                    <span className="font-display font-bold text-xs text-primary w-8 text-right">{student.pct}%</span>
                  </div>
                  <p className="font-body text-[11px] text-on-surface-variant mt-0.5">{student.completedLessons}/{student.totalLessons} lecciones</p>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-display font-bold ${student.role === 'admin' ? 'bg-primary/15 text-primary-dark' : 'bg-surface-container text-on-surface-variant'}`}>
                    {student.role === 'admin' ? '⚡ Admin' : '👤 Alumno'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
