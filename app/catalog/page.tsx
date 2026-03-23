// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Course } from '@/types/database'
import Navbar from '@/components/layout/Navbar'

export default function CatalogPage() {
  const router = useRouter()
  const supabase = createClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (!session) router.replace('/auth')
      else fetchCourses(session.user.id)
    })
  }, [])

  const fetchCourses = async (userId: string) => {
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    if (!coursesData) { setLoading(false); return }
    setCourses(coursesData)

    // Fetch progress per course
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, module_id, modules!inner(course_id)')
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', userId)

    if (lessonsData && progressData) {
      const completedSet = new Set(progressData.filter(p => p.is_completed).map(p => p.lesson_id))
      const progressMap: Record<string, { done: number; total: number }> = {}
      for (const lesson of lessonsData as any[]) {
        const courseId = lesson.modules?.course_id
        if (!courseId) continue
        if (!progressMap[courseId]) progressMap[courseId] = { done: 0, total: 0 }
        progressMap[courseId].total++
        if (completedSet.has(lesson.id)) progressMap[courseId].done++
      }
      setProgress(progressMap)
    }
    setLoading(false)
  }

  const getProgressPct = (courseId: string) => {
    const p = progress[courseId]
    if (!p || p.total === 0) return 0
    return Math.round((p.done / p.total) * 100)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-primary font-display font-semibold text-sm uppercase tracking-widest mb-3">Centro de Formación</p>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-on-surface leading-tight mb-4">
              Dominá el arte de la<br />
              <span style={{background: 'linear-gradient(135deg, #00450d, #065f18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>gastronomía digital</span>
            </h1>
            <p className="font-body text-on-surface-variant text-lg leading-relaxed">
              Accedé a formación especializada para hacer crecer tu negocio con Alma Orders.
            </p>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display font-bold text-2xl text-on-surface">Cursos disponibles</h2>
          <span className="font-body text-sm text-on-surface-variant">{courses.length} curso{courses.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-surface-container-high" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/40">school</span>
            <p className="font-display font-semibold text-xl text-on-surface-variant mt-4">No hay cursos disponibles aún</p>
            <p className="font-body text-on-surface-variant/60 text-sm mt-2">El equipo de Alma Orders está preparando el contenido.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const pct = getProgressPct(course.id)
              return (
                <Link key={course.id} href={`/course/${course.id}`}>
                  <div className="bg-surface-container-lowest rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                    {/* Thumbnail */}
                    <div className="h-48 bg-surface-container-high relative overflow-hidden">
                      {course.image_url ? (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00450d15 0%, #065f1825 100%)'}}>
                          <span className="material-symbols-outlined text-5xl text-primary/40">play_circle</span>
                        </div>
                      )}
                      {pct > 0 && (
                        <div className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                          <span className="font-display font-bold text-xs text-primary">{pct}%</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-display font-bold text-base text-on-surface leading-snug mb-1 line-clamp-2">{course.title}</h3>
                      {course.instructor_name && (
                        <p className="font-body text-xs text-on-surface-variant mb-3">por {course.instructor_name}</p>
                      )}
                      {course.description && (
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-2 mb-4">{course.description}</p>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-body text-xs text-on-surface-variant">
                            {pct === 0 ? 'Comenzar' : pct === 100 ? 'Completado ✓' : 'En progreso'}
                          </span>
                          {pct > 0 && <span className="font-display font-semibold text-xs text-primary">{pct}%</span>}
                        </div>
                        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          {pct > 0 && (
                            <div className="progress-leaf h-full transition-all duration-500" style={{width: `${pct}%`}} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
