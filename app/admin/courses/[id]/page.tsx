// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Course, Module, Lesson } from '@/types/database'
import Navbar from '@/components/layout/Navbar'
import ImageUpload from '@/components/ui/ImageUpload'

type ModuleWithLessons = Module & { lessons: Lesson[] }

export default function CourseEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', instructor_name: '', image_url: '' })

  // Module/Lesson modal state
  const [modModal, setModModal] = useState<{ open: boolean; editing: Module | null }>({ open: false, editing: null })
  const [lessonModal, setLessonModal] = useState<{ open: boolean; editing: Lesson | null; moduleId: string }>({ open: false, editing: null, moduleId: '' })
  const [modForm, setModForm] = useState({ title: '', order_index: 0 })
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '', duration: '', order_index: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: any } }) => {
      if (!session) { router.replace('/auth'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role !== 'admin') { router.replace('/catalog'); return }
      fetchData()
    })
  }, [params.id])

  const fetchData = async () => {
    const [{ data: courseData }, { data: modulesData }, { data: lessonsData }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', params.id).single(),
      supabase.from('modules').select('*').eq('course_id', params.id).order('order_index'),
      supabase.from('lessons').select('*').order('order_index')
    ])
    if (!courseData) { router.replace('/admin'); return }
    setCourse(courseData)
    setCourseForm({
      title: courseData.title,
      description: courseData.description || '',
      instructor_name: courseData.instructor_name || '',
      image_url: courseData.image_url || ''
    })
    if (modulesData && lessonsData) {
      setModules(modulesData.map((m: Module) => ({
        ...m,
        lessons: lessonsData.filter((l: Lesson) => l.module_id === m.id)
      })))
    }
    setLoading(false)
  }

  const saveCourse = async () => {
    setSaving(true)
    await supabase.from('courses').update({
      title: courseForm.title,
      description: courseForm.description || null,
      instructor_name: courseForm.instructor_name || null,
      image_url: courseForm.image_url || null
    }).eq('id', params.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // MODULE CRUD
  const openNewModule = () => {
    setModForm({ title: '', order_index: modules.length + 1 })
    setModModal({ open: true, editing: null })
  }
  const openEditModule = (mod: Module) => {
    setModForm({ title: mod.title, order_index: mod.order_index })
    setModModal({ open: true, editing: mod })
  }
  const saveModule = async () => {
    setSaving(true)
    if (modModal.editing) {
      const { data } = await supabase.from('modules').update({ title: modForm.title, order_index: modForm.order_index }).eq('id', modModal.editing.id).select().single()
      if (data) setModules(prev => prev.map(m => m.id === data.id ? { ...data, lessons: m.lessons } : m))
    } else {
      const { data } = await supabase.from('modules').insert({ course_id: params.id, title: modForm.title, order_index: modForm.order_index }).select().single()
      if (data) setModules(prev => [...prev, { ...data, lessons: [] }])
    }
    setSaving(false)
    setModModal({ open: false, editing: null })
  }
  const deleteModule = async (id: string) => {
    if (!confirm('¿Eliminar módulo y todas sus lecciones?')) return
    await supabase.from('modules').delete().eq('id', id)
    setModules(prev => prev.filter(m => m.id !== id))
  }

  // LESSON CRUD
  const openNewLesson = (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId)
    setLessonForm({ title: '', video_url: '', duration: '', order_index: (mod?.lessons.length || 0) + 1 })
    setLessonModal({ open: true, editing: null, moduleId })
  }
  const openEditLesson = (lesson: Lesson, moduleId: string) => {
    setLessonForm({ title: lesson.title, video_url: lesson.video_url || '', duration: lesson.duration?.toString() || '', order_index: lesson.order_index })
    setLessonModal({ open: true, editing: lesson, moduleId })
  }
  const saveLesson = async () => {
    setSaving(true)
    const payload = {
      title: lessonForm.title,
      video_url: lessonForm.video_url || null,
      duration: lessonForm.duration ? parseInt(lessonForm.duration) : null,
      order_index: lessonForm.order_index
    }
    if (lessonModal.editing) {
      const { data } = await supabase.from('lessons').update(payload).eq('id', lessonModal.editing.id).select().single()
      if (data) setModules(prev => prev.map(m =>
        m.id === lessonModal.moduleId ? { ...m, lessons: m.lessons.map(l => l.id === data.id ? data : l) } : m
      ))
    } else {
      const { data } = await supabase.from('lessons').insert({ ...payload, module_id: lessonModal.moduleId }).select().single()
      if (data) setModules(prev => prev.map(m =>
        m.id === lessonModal.moduleId ? { ...m, lessons: [...m.lessons, data] } : m
      ))
    }
    setSaving(false)
    setLessonModal({ open: false, editing: null, moduleId: '' })
  }
  const deleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm('¿Eliminar esta lección?')) return
    await supabase.from('lessons').delete().eq('id', lessonId)
    setModules(prev => prev.map(m =>
      m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
    ))
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16 animate-pulse space-y-4">
        <div className="h-8 bg-surface-container-high rounded w-1/2" />
        <div className="h-48 bg-surface-container-high rounded-2xl" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </Link>
          <div>
            <p className="text-primary font-display font-semibold text-xs uppercase tracking-widest">Editor de curso</p>
            <h1 className="font-display font-bold text-2xl text-on-surface">{course?.title}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href={`/course/${params.id}`} target="_blank">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-body transition-colors">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Vista previa
              </button>
            </Link>
            <button
              onClick={saveCourse}
              disabled={saving}
              className="flex items-center gap-1.5 btn-primary px-4 py-2 text-sm font-semibold"
            >
              {saving ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-transparent animate-spin" /> : <span className="material-symbols-outlined text-sm">{saved ? 'check' : 'save'}</span>}
              {saved ? 'Guardado ✓' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Course Form */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6">
          <h2 className="font-display font-semibold text-base text-on-surface mb-5">Información del curso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { field: 'title', label: 'Título *', full: true },
              { field: 'instructor_name', label: 'Instructor', full: false },
              
            ].map(({ field, label, full }) => (
              <div key={field} className={full ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">{label}</label>
                <input
                  type="text"
                  value={(courseForm as any)[field]}
                  onChange={e => setCourseForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Descripción</label>
              <textarea
                value={courseForm.description}
                onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Modules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-base text-on-surface">Módulos y lecciones</h2>
            <button onClick={openNewModule} className="flex items-center gap-1.5 btn-primary px-3 py-2 text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">add</span>
              Módulo
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">layers</span>
              <p className="font-body text-sm text-on-surface-variant mt-3">Sin módulos. Creá el primero.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((mod, modIdx) => (
                <div key={mod.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden">
                  {/* Module Header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-surface-container-low">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs text-primary bg-primary/10">
                        {modIdx + 1}
                      </div>
                      <p className="font-display font-semibold text-sm text-on-surface">{mod.title}</p>
                      <span className="font-body text-xs text-on-surface-variant">({mod.lessons.length} lecciones)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModule(mod)} className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">edit</span>
                      </button>
                      <button onClick={() => deleteModule(mod.id)} className="p-1.5 rounded-lg hover:bg-error-container transition-colors">
                        <span className="material-symbols-outlined text-sm text-on-error-container">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="px-5 py-3">
                    {mod.lessons.map((lesson, i) => (
                      <div key={lesson.id} className="flex items-center gap-3 py-2.5 group">
                        <span className="font-body text-xs text-on-surface-variant w-5 text-center">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm text-on-surface truncate">{lesson.title}</p>
                          {lesson.video_url && (
                            <p className="font-body text-xs text-on-surface-variant/60 truncate mt-0.5">{lesson.video_url}</p>
                          )}
                        </div>
                        {lesson.duration && <span className="font-body text-xs text-on-surface-variant">{lesson.duration}m</span>}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditLesson(lesson, mod.id)} className="p-1 rounded-lg hover:bg-surface-container-high transition-colors">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant">edit</span>
                          </button>
                          <button onClick={() => deleteLesson(lesson.id, mod.id)} className="p-1 rounded-lg hover:bg-error-container transition-colors">
                            <span className="material-symbols-outlined text-sm text-on-error-container">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => openNewLesson(mod.id)}
                      className="w-full flex items-center gap-2 py-2.5 px-2 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-primary text-sm font-body mt-1"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      Agregar lección
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Module Modal */}
      {modModal.open && (
        <div className="fixed inset-0 bg-scrim/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm modal-shadow">
            <h2 className="font-display font-bold text-lg text-on-surface mb-5">
              {modModal.editing ? 'Editar módulo' : 'Nuevo módulo'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Título *</label>
                <input
                  type="text"
                  value={modForm.title}
                  onChange={e => setModForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Introducción a la plataforma"
                  className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Orden</label>
                <input
                  type="number"
                  value={modForm.order_index}
                  onChange={e => setModForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModModal({ open: false, editing: null })} className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-body hover:bg-surface-container transition-colors">
                Cancelar
              </button>
              <button onClick={saveModule} disabled={saving || !modForm.title.trim()} className="flex-1 btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModal.open && (
        <div className="fixed inset-0 bg-scrim/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md modal-shadow">
            <h2 className="font-display font-bold text-lg text-on-surface mb-5">
              {lessonModal.editing ? 'Editar lección' : 'Nueva lección'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Título *</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={e => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Cómo configurar tu menú digital"
                  className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">URL de video (Vimeo / YouTube)</label>
                <input
                  type="text"
                  value={lessonForm.video_url}
                  onChange={e => setLessonForm(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://vimeo.com/123456789"
                  className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Duración (min)</label>
                  <input
                    type="number"
                    value={lessonForm.duration}
                    onChange={e => setLessonForm(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="15"
                    className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Orden</label>
                  <input
                    type="number"
                    value={lessonForm.order_index}
                    onChange={e => setLessonForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-surface-container px-4 py-2.5 rounded-xl text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setLessonModal({ open: false, editing: null, moduleId: '' })} className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-sm font-body hover:bg-surface-container transition-colors">
                Cancelar
              </button>
              <button onClick={saveLesson} disabled={saving || !lessonForm.title.trim()} className="flex-1 btn-primary py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
