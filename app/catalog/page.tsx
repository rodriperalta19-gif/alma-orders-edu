// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'

export default function CatalogPage() {
  const supabase = createClient()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    const { data: coursesData } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    if (coursesData) setCourses(coursesData)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-display font-semibold text-xs uppercase tracking-widest">Academia Alma Orders</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-white leading-tight mb-4">
              Educación práctica<br/>para hacer crecer<br/>
              <span style={{color:'#00C853'}}>tu negocio</span>
            </h1>
            <p className="font-body text-white/60 text-lg leading-relaxed">
              Formación especializada en Ventas, Finanzas, Marketing, Atención al Cliente y Experiencia de Entrega.
            </p>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl text-on-surface">Cursos disponibles</h2>
            <p className="font-body text-sm text-on-surface-variant mt-0.5">{courses.length} curso{courses.length !== 1 ? 's' : ''} publicados</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-surface-container-high" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-24 bg-surface-container-lowest rounded-2xl">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">school</span>
            <p className="font-display font-semibold text-xl text-on-surface-variant mt-4">Próximamente</p>
            <p className="font-body text-on-surface-variant/60 text-sm mt-2">El equipo está preparando los primeros cursos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link key={course.id} href={`/course/${course.id}`}>
                <div className="bg-surface-container-lowest rounded-2xl overflow-hidden card-hover cursor-pointer border border-outline-variant/20">
                  <div className="h-48 bg-surface-container-high relative overflow-hidden">
                    {course.image_url ? (
                      <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center hero-gradient">
                        <span className="material-symbols-outlined text-5xl text-primary/60">play_circle</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-primary px-2.5 py-1 rounded-full">
                      <span className="font-display font-bold text-xs text-white">Gratis</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-bold text-base text-on-surface leading-snug mb-1 line-clamp-2">{course.title}</h3>
                    {course.instructor_name && (
                      <p className="font-body text-xs text-on-surface-variant mb-2">por {course.instructor_name}</p>
                    )}
                    {course.description && (
                      <p className="font-body text-sm text-on-surface-variant leading-relaxed line-clamp-2 mb-4">{course.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="material-symbols-outlined text-sm text-primary">play_circle</span>
                      <span className="font-body text-xs text-primary font-semibold">Ver curso</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
