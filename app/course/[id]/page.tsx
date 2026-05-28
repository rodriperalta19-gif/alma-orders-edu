// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

export default function CourseDetailPage({ params }) {
  const router = useRouter()
  const supabase = createClient()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModules, setOpenModules] = useState(new Set())

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    const [{ data: courseData }, { data: modulesData }, { data: lessonsData }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', params.id).single(),
      supabase.from('modules').select('*').eq('course_id', params.id).order('order_index'),
      supabase.from('lessons').select('*, modules!inner(course_id)').eq('modules.course_id', params.id).order('order_index'),
    ])

    if (!courseData) { router.replace('/catalog'); return }
    setCourse(courseData)

    if (modulesData && lessonsData) {
      const enriched = modulesData.map(m => ({
        ...m,
        lessons: lessonsData.filter(l => l.module_id === m.id)
      }))
      setModules(enriched)
      if (enriched.length > 0) setOpenModules(new Set([enriched[0].id]))
    }
    setLoading(false)
  }

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const firstLesson = modules[0]?.lessons[0]

  const toggleModule = (id) => {
    setOpenModules(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const formatDuration = (mins) => {
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
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">lock_open</span>
                  <span className="font-body text-sm text-on-surface-variant">Acceso libre</span>
                </div>
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 modal-shadow h-fit">
              {course.image_url && (
                <img src={course.image_url} alt={course.title} className="w-full h-36 object-cover rounded-xl mb-5" />
              )}

              {firstLesson && (
                <Link href={`/learn/${course.id}/${firstLesson.id}`}>
                  <button className="btn-primary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">school</span>
                    Comenzar curso
                  </button>
                </Link>
              )}

              <p className="font-body text-xs text-on-surface-variant text-center mt-3">
                Sin registro · Acceso inmediato
              </p>
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
                    </p>
                  </div>
                </div>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-200 ${openModules.has(mod.id) ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {openModules.has(mod.id) && (
                <div className="px-5 pb-3">
                  {mod.lessons.map((lesson, i) => (
                    <Link key={lesson.id} href={`/learn/${course.id}/${lesson.id}`}>
                      <div className="flex items-center gap-4 py-3 px-3 -mx-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-container-high">
                          <span className="font-body text-xs text-on-surface-variant">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm leading-snug text-on-surface">{lesson.title}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lesson.duration && (
                            <span className="font-body text-xs text-on-surface-variant">{formatDuration(lesson.duration)}</span>
                          )}
                          <span className="material-symbols-outlined text-base text-on-surface-variant/50">play_circle</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
