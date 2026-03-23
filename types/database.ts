export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          instructor_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          instructor_name?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          image_url?: string | null
          instructor_name?: string | null
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order_index: number
        }
        Update: {
          title?: string
          order_index?: number
        }
      }
      lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          video_url: string | null
          duration: number | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          video_url?: string | null
          duration?: number | null
          order_index: number
        }
        Update: {
          title?: string
          video_url?: string | null
          duration?: number | null
          order_index?: number
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          is_completed?: boolean
        }
        Update: {
          is_completed?: boolean
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Module = Database['public']['Tables']['modules']['Row']
export type Lesson = Database['public']['Tables']['lessons']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
