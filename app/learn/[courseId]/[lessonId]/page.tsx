// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LearnPage({ params }) {
  const router = useRouter()
  const supabase = createClient()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [params.courseId, params.lessonId])

  useEffect(() => {
    setSidebarOpen(false)
  }, [params.lessonId])

  const fetchData = async () => {
    const [{ data: courseData }, { data: modulesData }, { data: lessonData }, { data: allLessons }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', params.courseId).single(),
      supabase.from('modules').select('*').eq('course_id', params.courseId).order('order_index'),
      supabase.from('lessons').select('*').eq('id', params.lessonId).single(),
      supabase.from('lessons').select('*, modules!inner(course_id)').eq('modules.course_id', params.courseId).order('order_index'),
    ])
    if (!courseData || !lessonData) { router.replace('/catalog'); return }
    setCourse(courseData)
    setCurrentLesson(lessonData)
    if (modulesData && allLessons) {
      setModules(modulesData.map(m => ({ ...m, lessons: allLessons.filter(l => l.module_id === m.id) })))
    }
    setLoading(false)
  }

  const allLessons = modules.flatMap(m => m.lessons)
  const currentIdx = allLessons.findIndex(l => l.id === params.lessonId)
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null

  const getEmbedUrl = (url) => {
    if (!url) return null
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=0&title=0&byline=0&portrait=0&color=00C853`
    if (url.includes('player.vimeo.com')) return url
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`
    return url
  }

  const embedUrl = currentLesson ? getEmbedUrl(currentLesson.video_url) : null

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      {/* Top Bar */}
      <div className="flex-shrink-0 bg-[#141414] border-b border-white/10">
        <div className="h-14 px-4 flex items-center gap-4">
          <Link href={`/course/${params.courseId}`} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="hidden md:block">Volver</span>
          </Link>
          <div className="flex-1 min-w-0 mx-4">
            <p className="font-display font-semibold text-white text-sm truncate">{course?.title}</p>
            <p className="font-body text-xs text-white/50 truncate">{currentLesson?.title}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base">menu</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden relative">

        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          {/* Video */}
          <div className="bg-black relative" style={{ paddingTop: '56.25%' }}>
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
                <span className="material-symbols-outlined text-6xl text-white/20">videocam_off</span>
              </div>
            )}
          </div>

          {/* Lesson Info */}
          <div className="bg-[#141414] px-6 py-5">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="font-display font-bold text-xl text-white leading-snug">{currentLesson?.title}</h1>
                  {currentLesson?.duration && (
                    <span className="font-body text-xs text-white/40 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {currentLesson.duration} min
                    </span>
                  )}
                </div>
              </div>

              {currentLesson?.description && (
                <div className="bg-white/5 rounded-xl p-4 mb-5">
                  <p className="font-body text-sm text-white/70 leading-relaxed">{currentLesson.description}</p>
                </div>
              )}

              {/* Prev/Next */}
              <div className="flex items-center justify-between py-4 border-t border-white/10">
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
                    <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-display font-semibold btn-primary">
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

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={[
            'bg-[#141414] flex flex-col overflow-y-auto border-l border-white/10',
            'fixed top-0 right-0 h-full w-[85vw] max-w-xs z-30 transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-80 md:flex-shrink-0 md:z-auto md:h-auto',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
            !sidebarOpen ? 'hidden md:flex md:flex-col' : 'flex flex-col',
          ].join(' ')}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
            <p className="font-display font-semibold text-white text-sm">Contenido del curso</p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {modules.map((mod, modIdx) => (
            <div key={mod.id}>
              <div className="px-4 py-3 bg-white/5">
                <p className="font-display font-semibold text-xs text-white/50 uppercase tracking-wider">
                  {modIdx + 1}. {mod.title}
                </p>
              </div>
              {mod.lessons.map((lesson, i) => {
                const active = lesson.id === params.lessonId
                return (
                  <Link key={lesson.id} href={`/learn/${params.courseId}/${lesson.id}`}>
                    <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-primary/20' : 'hover:bg-white/5'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/20' : 'bg-white/10'}`}>
                        <span className="font-body text-[10px] text-white/50">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-body text-xs leading-snug ${active ? 'text-white font-medium' : 'text-white/70'}`}>
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
      </div>
    </div>
  )
}
