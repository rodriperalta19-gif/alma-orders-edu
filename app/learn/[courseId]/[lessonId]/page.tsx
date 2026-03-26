// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LearnPage({ params }) {
  const router = useRouter()
  const supabase = createClient()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [currentLesson, setCurrentLesson] = useState(null)
  const [userId, setUserId] = useState(null)
  const [completedLessons, setCompletedLessons] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [markingDone, setMarkingDone] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRating, setUserRating] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [totalRatings, setTotalRatings] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [savingComment, setSavingComment] = useState(false)
  const [savingRating, setSavingRating] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/auth'); return }
      setUserId(session.user.id)
      fetchData(session.user.id)
    })
  }, [params.courseId, params.lessonId])

  const fetchData = async (uid) => {
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
      setModules(modulesData.map(m => ({ ...m, lessons: allLessons.filter(l => l.module_id === m.id) })))
    }
    if (progressData) {
      setCompletedLessons(new Set(progressData.filter(p => p.is_completed).map(p => p.lesson_id)))
    }
    setLoading(false)
    fetchRatingsAndComments(lessonData.id, uid)
  }

  const fetchRatingsAndComments = async (lessonId, uid) => {
    const [{ data: ratingsData }, { data: myRating }, { data: commentsData }] = await Promise.all([
      supabase.from('lesson_ratings').select('rating').eq('lesson_id', lessonId),
      supabase.from('lesson_ratings').select('rating').eq('lesson_id', lessonId).eq('user_id', uid).single(),
      supabase.from('lesson_comments').select('*').eq('lesson_id', lessonId).order('created_at', { ascending: false })
    ])
    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((a, r) => a + r.rating, 0) / ratingsData.length
      setAvgRating(Math.round(avg * 10) / 10)
      setTotalRatings(ratingsData.length)
    }
    if (myRating) setUserRating(myRating.rating)
    if (commentsData) setComments(commentsData)
  }

  const markComplete = async () => {
    if (!userId || !currentLesson || completedLessons.has(currentLesson.id)) return
    setMarkingDone(true)
    await supabase.from('user_progress').upsert({ user_id: userId, lesson_id: currentLesson.id, is_completed: true }, { onConflict: 'user_id,lesson_id' })
    setCompletedLessons(prev => new Set([...prev, currentLesson.id]))
    setMarkingDone(false)
  }

  const saveRating = async (rating) => {
    if (!userId || savingRating) return
    setSavingRating(true)
    setUserRating(rating)
    await supabase.from('lesson_ratings').upsert({ user_id: userId, lesson_id: currentLesson.id, rating }, { onConflict: 'user_id,lesson_id' })
    fetchRatingsAndComments(currentLesson.id, userId)
    setSavingRating(false)
  }

  const submitComment = async () => {
    if (!comment.trim() || !userId || savingComment) return
    setSavingComment(true)
    await supabase.from('lesson_comments').insert({ user_id: userId, lesson_id: currentLesson.id, comment: comment.trim() })
    setComment('')
    fetchRatingsAndComments(currentLesson.id, userId)
    setSavingComment(false)
  }

  const allLessons = modules.flatMap(m => m.lessons)
  const currentIdx = allLessons.findIndex(l => l.id === params.lessonId)
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const doneCount = [...completedLessons].filter(id => allLessons.some(l => l.id === id)).length
  const pct = allLessons.length > 0 ? Math.round((doneCount / allLessons.length) * 100) : 0
  const isCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false

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
          <div className="hidden md:flex items-center gap-3">
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="progress-leaf h-full transition-all duration-500" style={{width:`${pct}%`}} />
            </div>
            <span className="font-display font-semibold text-xs text-white/60">{pct}%</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-base">menu</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video + Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video */}
          <div className="bg-black relative" style={{paddingTop:'56.25%'}}>
            {embedUrl ? (
              <iframe src={embedUrl} className="absolute inset-0 w-full h-full" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={currentLesson?.title} />
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
                <button onClick={markComplete} disabled={isCompleted || markingDone}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${isCompleted ? 'bg-primary/20 text-primary cursor-default' : 'btn-primary'}`}>
                  {markingDone ? <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" /> : <span className="material-symbols-outlined text-base">{isCompleted ? 'check_circle' : 'done'}</span>}
                  {isCompleted ? 'Completada' : 'Marcar como hecha'}
                </button>
              </div>

              {/* Description */}
              {currentLesson?.description && (
                <div className="bg-white/5 rounded-xl p-4 mb-5">
                  <p className="font-body text-sm text-white/70 leading-relaxed">{currentLesson.description}</p>
                </div>
              )}

              {/* Prev/Next */}
              <div className="flex items-center justify-between py-4 border-t border-white/10 mb-6">
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

              {/* Rating */}
              <div className="bg-white/5 rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display font-semibold text-white text-sm">¿Cómo calificás esta lección?</p>
                  {totalRatings > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="font-display font-bold text-white text-sm">{avgRating}</span>
                      <span className="font-body text-xs text-white/40">({totalRatings})</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button key={star}
                      onClick={() => saveRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl transition-transform hover:scale-110"
                    >
                      <span style={{color: star <= (hoverRating || userRating) ? '#FBBF24' : 'rgba(255,255,255,0.2)'}}>★</span>
                    </button>
                  ))}
                  {userRating > 0 && <span className="font-body text-xs text-white/40 ml-2">Tu calificación: {userRating}/5</span>}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-white/5 rounded-xl p-5">
                <p className="font-display font-semibold text-white text-sm mb-4">Comentarios ({comments.length})</p>
                
                {/* New comment input */}
                <div className="flex gap-3 mb-5">
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Dejá tu comentario sobre esta lección..."
                    rows={2}
                    className="flex-1 bg-white/10 text-white placeholder-white/30 text-sm px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button onClick={submitComment} disabled={!comment.trim() || savingComment}
                    className="btn-primary px-4 py-2 text-sm font-semibold flex-shrink-0 self-end rounded-xl disabled:opacity-50">
                    {savingComment ? <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" /> : 'Enviar'}
                  </button>
                </div>

                {/* Comments list */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="font-body text-sm text-white/30 text-center py-4">Sé el primero en comentar.</p>
                  ) : comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{background:'linear-gradient(135deg,#00C853,#009624)'}}>
                        U
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-display font-semibold text-xs text-white">Usuario</span>
                          <span className="font-body text-xs text-white/30">{new Date(c.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                        <p className="font-body text-sm text-white/70 leading-relaxed">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <div className="progress-leaf h-full" style={{width:`${pct}%`}} />
                </div>
                <span className="font-display font-bold text-xs text-primary">{pct}%</span>
              </div>
            </div>
            {modules.map((mod, modIdx) => (
              <div key={mod.id}>
                <div className="px-4 py-3 bg-white/5">
                  <p className="font-display font-semibold text-xs text-white/50 uppercase tracking-wider">{modIdx + 1}. {mod.title}</p>
                </div>
                {mod.lessons.map((lesson, i) => {
                  const done = completedLessons.has(lesson.id)
                  const active = lesson.id === params.lessonId
                  return (
                    <Link key={lesson.id} href={`/learn/${params.courseId}/${lesson.id}`}>
                      <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${active ? 'bg-primary/20' : 'hover:bg-white/5'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-primary' : active ? 'bg-white/20' : 'bg-white/10'}`}>
                          {done ? <span className="material-symbols-outlined text-white" style={{fontSize:'11px'}}>check</span> : <span className="font-body text-[10px] text-white/50">{i+1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-body text-xs leading-snug ${active ? 'text-white font-medium' : done ? 'text-white/40' : 'text-white/70'}`}>{lesson.title}</p>
                          {lesson.duration && <p className="font-body text-[10px] text-white/30 mt-0.5">{lesson.duration} min</p>}
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
