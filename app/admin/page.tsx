// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Course } from '@/types/database'
import Navbar from '@/components/layout/Navbar'
import ImageUpload from '@/components/ui/ImageUpload'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ users: 0, lessons: 0, completions: 0 })
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newCourse, setNewCourse] = useState({ title: '', description: '', instructor_name: '', image_url: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      if (!session) { router.replace('/auth'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role !== 'admin') { router.replace('/catalog'); return }
      fetchData()
    })
  }, [])

  const fetchData = async () => {
    const [{ data: coursesData }, { data: profiles }, { data: lessons }, { data: progress }] = await Promise.all([
      supabase.from('courses').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('lessons').select('id', { count: 'exact' }),
      supabase.from('user_progress').select('id', { count: 'exact' }).eq('is_completed', true)
    ])
    if (coursesData) setCourses(coursesData)
    setStats({
      users: profiles?.length || 0,
      lessons: lessons?.length || 0,
      completions: progress?.length || 0
    })
    setLoading(false)
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('¿Seguro que querés eliminar este curso? Se borrarán todos sus módulos y lecciones.')) return
    setDeleting(id)
    await supabase.from('courses').delete().eq('id', id)
    setCourses(prev => prev.filter(c => c.id !== id))
    setDeleting(null)
  }

  const createCourse = async () => {
    if (!newCourse.title.trim()) return
    setSaving(true)
    const { data } = await supabase.from('courses').insert({
      title: newCourse.title,
      description: newCourse.description || null,
      instructor_name: newCourse.instructor_name || null,
      image_url: newCourse.image_url || null
    }).select().single()
    if (data) {
      setCourses(prev => [data, ...prev])
      setShowNewModal(false)
      setNewCourse({ title: '', description: '', instructor_name: '', image_url: '' })
      router.push(`/admin/courses/${data.id}`)
    }
    setSaving(false)
  }

  const statCards = [
    { label: 'Cursos', value: courses.length, icon: 'school', color: '#00450d' },
    { label: 'Usuarios', value: stats.users, icon: 'people', color: '#4c616c' },
    { label: 'Lecciones', value: stats.lessons, icon: 'play_circle', color: '#00433b' },
    { label: 'Completadas', value: stats.completions, icon: 'emoji_events', color: '#00450d' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-primary font-display font-semibold text-sm uppercase tracking-widest mb-1">Panel Admin</p>
            <h1 className="font-display font-bold text-3xl text-on-surface">Academia Alma Orders</h1>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary px-5 py-3 text-sm font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nuevo curso
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map(s => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor: s.color + '15'}}>
                  <span className="material-symbols-outlined text-base" style={{color: s.color}}>{s.icon}</span>
                </div>
              </div>
              <p className="font-display font-bold text-3xl text-on-surface">{loading ? '—' : s.value}</p>
              <p className="font-body text-xs text-on-surface-variant mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Course List */}
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface mb-5">Gestión de cursos</h2>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-container-high rounded-2xl animate-pulse" />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">school</span>
              <p className="font-display font-semibold text-on-surface-variant mt-4">Sin cursos todavía</p>
              <p className="font-body text-sm text-on-surface-variant/60 mt-1 mb-5">Creá el primer curso para empezar</p>
              <button onClick={() => setShowNewModal(true)} className="btn-primary px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-base">add</span>
                Crear curso
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-5 hover:shadow-sm transition-shadow">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-surface-container-high">
                    {course.image_url ? (
                      <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant/30">school</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-base text-on-surface truncate">{course.title}</h3>
                    <p className="font-body text-sm text-on-surface-variant truncate mt-0.5">
                      {course.instructor_name || 'Sin instructor'} · {course.description?.slice(0, 80) || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/courses/${course.id}`}>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-body transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Editar
                      </button>
                    </Link>
                    <button
                      onClick={() => deleteCourse(course.id)}
                      disabled={deleting === course.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error-container hover:bg-error/20 text-on-error-container text-xs font-body transition-colors disabled:opacity-50"
                    >
                      {deleting === course.id ? (
                        <span className="w-3 h-3 rounded-full border border-on-error-container border-t-transparent animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-sm">delete</span>
                      )}
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Course Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-scrim/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-7 w-full max-w-md modal-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-on-surface">Nuevo curso</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {[
                { field: 'title', label: 'Título del curso *', placeholder: 'Ej: Gestión de pedidos con Alma Orders' },
                { field: 'instructor_name', label: 'Instructor', placeholder: 'Nombre del instructor' },
                      ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={(newCourse as any)[field]}
                    onChange={e => setNewCourse(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              ))}
              <ImageUpload
                label="Imagen del curso"
                value={newCourse.image_url}
                onChange={url => setNewCourse(prev => ({ ...prev, image_url: url }))}
              />
              <div>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  value={newCourse.description}
                  onChange={e => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descripción del curso..."
                  rows={3}
                  className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface text-sm font-body hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createCourse}
                disabled={saving || !newCourse.title.trim()}
                className="flex-1 btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving && <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />}
                Crear y editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
