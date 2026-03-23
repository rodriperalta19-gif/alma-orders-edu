// @ts-nocheck
'use client'
export const runtime = 'edge'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Imagen' }: ImageUploadProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('course-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      setError('Error al subir: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(fileName)

    onChange(publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <label className="block text-xs font-display font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="space-y-2">
        {/* Preview */}
        {value && (
          <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-container-high">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange('')}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-on-surface/60 flex items-center justify-center hover:bg-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-white" style={{fontSize:'14px'}}>close</span>
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {/* Upload button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-body text-on-surface disabled:opacity-50"
          >
            {uploading ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-base text-on-surface-variant">upload</span>
            )}
            {uploading ? 'Subiendo...' : 'Subir imagen'}
          </button>

          {/* URL input */}
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="O pegá una URL..."
            className="flex-1 bg-surface-container px-3 py-2.5 rounded-xl text-on-surface placeholder-on-surface-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    </div>
  )
}
