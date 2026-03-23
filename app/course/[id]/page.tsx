// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Course, Module, Lesson } from '@/types/database'
import Navbar from '@/components/layout/Navbar'

type ModuleWithLessons = Module & { lessons: Lesson[] }

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithLessons[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (!session) { router.replace('/auth'); return }
      setUserId(session.user.id)
      fetchData(session.user.id)
    })
  }, [params.id])

  const fetchData = async (uid: string) => {
    const [{ data: courseData }, { data: modulesData }, { data: lessonsData }, { data: progressData }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', params.id).single(),
      supabase.from('modules').select('*').eq('course_id', params.id).order('order_index'),
      supabase.from('lessons').select('*, modules!inner(course_id)').eq('modules.course_id', params.id).order('order_index'),
      supabase.from('user_progress').select('lesson_id, is_completed').eq('user_id', uid)
    ])

    if (!courseData) { router.replace('/catalog'); return }
    setCourse(courseData)

    if (modulesData && lessonsData) {
      const enriched = modulesData.map(m => ({
        ...m,
        lessons: lessonsData.filter((l: any) => l.module_id === m.id)
      }))
      setModules(enriched)
      // Open first module by default
      if (enriched.length > 0) setOpenModules(new Set([enriched[0].id]))
    }

    if (progressData) {
      setCompletedLessons(new Set(progressData.filter(p => p.is_completed).map(p => p.lesson_id)))
    }
    setLoading(false)
  }

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedCount = modules.reduce((acc, m) => acc + m.lessons.filter(l => completedLessons.has(l.id)).length, 0)
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const firstLesson = modules[0]?.lessons[0]

  const toggleModule = (id: string) => {
    setOpenModules(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const formatDuration = (mins: number | null) => {
    if (!mins) return ''
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16 animate-pulse space-y-6">
        <div className="h-8 bg-surface-container-high rounded w-3/4" />
        <div className="h-4 bg-surface-container-high rounded w-1/2" />
        <div className="h-64 bg-surface-container-high rounded-2xl" />
      </div>
    </div>
  )

  if (!course) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="bg-surface-container-low">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <Link href="/catalog" className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-sm font-body mb-6">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver al catálogo
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Info */}
            <div className="lg:col-span-2">
              <h1 className="font-display font-bold text-3xl md:text-4xl text-on-surface leading-tight mb-3">{course.title}</h1>
              {course.instructor_name && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background: 'linear-gradient(135deg, #00450d, #065f18)'}}>
                    {course.instructor_name.charAt(0)}
                  </div>
                  <span className="font-body text-sm text-on-surface-variant">{course.instructor_name}</span>
                </div>
              )}
              {course.description && (
                <p className="font-body text-on-surface-variant leading-relaxed text-base">{course.description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">layers</span>
                  <span className="font-body text-sm text-on-surface-variant">{modules.length} módulo{modules.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">play_circle</span>
                  <span className="font-body text-sm text-on-surface-variant">{totalLessons} lección{totalLessons !== 1 ? 'es' : ''}</span>
                </div>
                {progressPct > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">trending_up</span>
                    <span className="font-body text-sm text-on-surface-variant">{progressPct}% completado</span>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 modal-shadow h-fit">
              {course.image_url && (
                <img src={course.image_url} alt={course.title} className="w-full h-36 object-cover rounded-xl mb-5" />
              )}

              {/* Progress Bar */}
              {progressPct > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body text-xs text-on-surface-variant">Progreso</span>
                    <span className="font-display font-bold text-xs text-primary">{progressPct}%</span>
                  </div>
                  <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="progress-leaf h-full transition-all duration-700" style={{width: `${progressPct}%`}} />
                  </div>
                  <p className="font-body text-xs text-on-surface-variant mt-1.5">{completedCount} de {totalLessons} lecciones</p>
                </div>
              )}

              {firstLesson && (
                <Link href={`/learn/${course.id}/${firstLesson.id}`}>
                  <button className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">
                      {progressPct > 0 ? 'play_arrow' : 'school'}
                    </span>
                    {progressPct === 0 ? 'Comenzar curso' : progressPct === 100 ? 'Repasar curso' : 'Continuar'}
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Syllabus */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="font-display font-bold text-2xl text-on-surface mb-6">Contenido del curso</h2>

        <div className="space-y-3">
          {modules.map((mod, modIndex) => (
            <div key={mod.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm text-primary bg-primary/10">
                    {modIndex + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-display font-semibold text-base text-on-surface">{mod.title}</p>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      {mod.lessons.length} lección{mod.lessons.length !== 1 ? 'es' : ''}
                      {' · '}
                      {mod.lessons.filter(l => completedLessons.has(l.id)).length} completadas
                    </p>
                  </div>
                </div>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${openModules.has(mod.id) ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {openModules.has(mod.id) && (
                <div className="px-5 pb-3">
                  {mod.lessons.map((lesson, i) => {
                    const done = completedLessons.has(lesson.id)
                    return (
                      <Link key={lesson.id} href={`/learn/${course.id}/${lesson.id}`}>
                        <div className="flex items-center gap-4 py-3 px-3 -mx-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-primary' : 'bg-surface-container-high'}`}>
                            {done ? (
                              <span className="material-symbols-outlined text-xs text-white" style={{fontSize:'14px'}}>check</span>
                            ) : (
                              <span className="font-body text-xs text-on-surface-variant">{i + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-body text-sm leading-snug ${done ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                              {lesson.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {lesson.duration && (
                              <span className="font-body text-xs text-on-surface-variant">{formatDuration(lesson.duration)}</span>
                            )}
                            <span className="material-symbols-outlined text-base text-on-surface-variant/50">play_circle</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
