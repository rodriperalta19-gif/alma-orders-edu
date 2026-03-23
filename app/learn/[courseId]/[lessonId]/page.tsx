// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Course, Module, Lesson } from '@/types/database'

type ModuleWithLessons = Module & { lessons: Lesson[] }

export default function LearnPage({ params }: { params: { courseId: string; lessonId: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleWithLessons[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [markingDone, setMarkingDone] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (!session) { router.replace('/auth'); return }
      setUserId(session.user.id)
      fetchData(session.user.id)
    })
  }, [params.courseId, params.lessonId])

  const fetchData = async (uid: string) => {
    const [{ data: courseData }, { data: modulesData }, { data: lessonData }, { data: allLessons }, { data: progressData }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', params.courseId).single(),
      supabase.from('modules').select('*').eq('course_id', params.courseId).order('order_index'),
      supabase.from('lessons').select('*').eq('id', params.lessonId).single(),
      supabase.from('lessons').select('*, modules!inner(course_id)').eq('modules.course_id', params.courseId).order('order_index'),
      supabase.from('user_progress').select('lesson_id, is_completed').eq('user_id', uid)
    ])

    if (!courseData || !lessonData) { router.replace('/catalog'); return }
    setCourse(courseData)
    setCurrentLesson(lessonData)

    if (modulesData && allLessons) {
      setModules(modulesData.map(m => ({
        ...m,
        lessons: allLessons.filter((l: any) => l.module_id === m.id)
      })))
    }
    if (progressData) {
      setCompletedLessons(new Set(progressData.filter(p => p.is_completed).map(p => p.lesson_id)))
    }
    setLoading(false)
  }

  const markComplete = async () => {
    if (!userId || !currentLesson || completedLessons.has(currentLesson.id)) return
    setMarkingDone(true)
    await supabase.from('user_progress').upsert({
      user_id: userId,
      lesson_id: currentLesson.id,
      is_completed: true
    }, { onConflict: 'user_id,lesson_id' })
    setCompletedLessons(prev => new Set([...prev, currentLesson.id]))
    setMarkingDone(false)
  }

  // Navigate to next lesson
  const getNextLesson = () => {
    const allLessons = modules.flatMap(m => m.lessons)
    const idx = allLessons.findIndex(l => l.id === params.lessonId)
    return idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null
  }

  const getPrevLesson = () => {
    const allLessons = modules.flatMap(m => m.lessons)
    const idx = allLessons.findIndex(l => l.id === params.lessonId)
    return idx > 0 ? allLessons[idx - 1] : null
  }

  const getVimeoEmbedUrl = (url: string | null) => {
    if (!url) return null
    // Handle various Vimeo URL formats
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=0&title=0&byline=0&portrait=0&color=00450d`
    // If it's already a player URL or other embed
    if (url.includes('player.vimeo.com')) return url
    // YouTube support
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
    return url
  }

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0)
  const doneCount = [...completedLessons].filter(id =>
    modules.some(m => m.lessons.some(l => l.id === id))
  ).length
  const pct = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0
  const nextLesson = getNextLesson()
  const prevLesson = getPrevLesson()
  const isCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false
  const embedUrl = currentLesson ? getVimeoEmbedUrl(currentLesson.video_url) : null

  if (loading) return (
    <div className="min-h-screen bg-on-surface flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      {/* Top Bar */}
      <div className="glass-nav border-b border-white/10 flex-shrink-0" style={{background: 'rgba(13,13,13,0.9)'}}>
        <div className="h-14 px-4 flex items-center gap-4">
          <Link href={`/course/${params.courseId}`} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="hidden md:block">Volver al curso</span>
          </Link>

          <div className="flex-1 min-w-0 mx-4">
            <p className="font-display font-semibold text-white text-sm truncate">{course?.title}</p>
            <p className="font-body text-xs text-white/50 truncate">{currentLesson?.title}</p>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="progress-leaf h-full transition-all duration-500" style={{width: `${pct}%`}} />
            </div>
            <span className="font-display font-semibold text-xs text-white/60">{pct}%</span>
          </div>

          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-base">menu</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Player */}
          <div className="bg-black relative" style={{paddingTop: '56.25%'}}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={currentLesson?.title}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-6xl text-white/20">videocam_off</span>
                  <p className="font-body text-white/40 text-sm mt-3">Video no disponible</p>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Controls */}
          <div className="bg-[#141414] px-6 py-5">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-bold text-xl text-white leading-snug">{currentLesson?.title}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    {currentLesson?.duration && (
                      <span className="font-body text-xs text-white/40 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {currentLesson.duration} min
                      </span>
                    )}
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-xs font-body text-primary">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        Completada
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={markComplete}
                  disabled={isCompleted || markingDone}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${
                    isCompleted
                      ? 'bg-primary/20 text-primary cursor-default'
                      : 'btn-primary'
                  }`}
                >
                  {markingDone ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-base">{isCompleted ? 'check_circle' : 'done'}</span>
                  )}
                  {isCompleted ? 'Completada' : 'Marcar como hecha'}
                </button>
              </div>

              {/* Prev/Next */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                {prevLesson ? (
                  <Link href={`/learn/${params.courseId}/${prevLesson.id}`}>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white text-sm font-body">
                      <span className="material-symbols-outlined text-base">chevron_left</span>
                      <span className="hidden md:block">Anterior</span>
                    </button>
                  </Link>
                ) : <div />}

                {nextLesson ? (
                  <Link href={`/learn/${params.courseId}/${nextLesson.id}`}>
                    <button onClick={markComplete} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-display font-semibold btn-primary">
                      <span>Siguiente lección</span>
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </Link>
                ) : (
                  <Link href={`/course/${params.courseId}`}>
                    <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-display font-semibold btn-primary">
                      <span className="material-symbols-outlined text-base">emoji_events</span>
                      Finalizar curso
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 flex-shrink-0 bg-[#141414] flex flex-col overflow-y-auto border-l border-white/10">
            <div className="p-4 border-b border-white/10">
              <p className="font-display font-semibold text-white text-sm">Contenido del curso</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="progress-leaf h-full" style={{width: `${pct}%`}} />
                </div>
                <span className="font-display font-bold text-xs text-primary">{pct}%</span>
              </div>
            </div>

            {modules.map((mod, modIdx) => (
              <div key={mod.id}>
                <div className="px-4 py-3 bg-white/5">
                  <p className="font-display font-semibold text-xs text-white/50 uppercase tracking-wider">
                    {modIdx + 1}. {mod.title}
                  </p>
                </div>
                {mod.lessons.map((lesson, i) => {
                  const done = completedLessons.has(lesson.id)
                  const active = lesson.id === params.lessonId
                  return (
                    <Link key={lesson.id} href={`/learn/${params.courseId}/${lesson.id}`}>
                      <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        active ? 'bg-primary/20' : 'hover:bg-white/5'
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          done ? 'bg-primary' : active ? 'bg-white/20' : 'bg-white/10'
                        }`}>
                          {done ? (
                            <span className="material-symbols-outlined text-white" style={{fontSize:'11px'}}>check</span>
                          ) : (
                            <span className="font-body text-[10px] text-white/50">{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-body text-xs leading-snug ${active ? 'text-white font-medium' : done ? 'text-white/40' : 'text-white/70'}`}>
                            {lesson.title}
                          </p>
                          {lesson.duration && (
                            <p className="font-body text-[10px] text-white/30 mt-0.5">{lesson.duration} min</p>
                          )}
                        </div>
                        {active && <span className="material-symbols-outlined text-primary text-sm">play_arrow</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
