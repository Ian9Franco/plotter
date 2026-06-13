'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Camera, Check, Loader2 } from 'lucide-react'
import { fetchUserProfile, updateUserProfile, uploadAvatar, type Profile } from '@/lib/review/storage'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface ProfileSettingsProps {
  userId: string
  email: string
  onClose: () => void
  onProfileUpdated: (updatedProfile: Profile) => void
}

export default function ProfileSettings({ userId, email, onClose, onProfileUpdated }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const data = await fetchUserProfile(userId)
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
      }
      setLoading(false)
    }
    loadProfile()
  }, [userId])

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setSaving(true)
    const res = await updateUserProfile(userId, { display_name: displayName.trim() })
    if (res.success) {
      toast.success('Nombre actualizado correctamente')
      const updated = { ...profile!, display_name: displayName.trim() }
      setProfile(updated)
      onProfileUpdated(updated)
    } else {
      toast.error('Error al actualizar el nombre')
    }
    setSaving(false)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Confirm image file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Procesando y reescalando imagen...')

    try {
      const uploadRes = await uploadAvatar(userId, file)
      if (uploadRes.success && uploadRes.publicUrl) {
        const profileRes = await updateUserProfile(userId, { avatar_url: uploadRes.publicUrl })
        if (profileRes.success) {
          toast.success('Foto de perfil actualizada correctamente', { id: toastId })
          const updated = { ...profile!, avatar_url: uploadRes.publicUrl }
          setProfile(updated)
          onProfileUpdated(updated)
        } else {
          toast.error('Error al guardar la referencia de la imagen', { id: toastId })
        }
      } else {
        toast.error('Error al subir la imagen', { id: toastId })
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error inesperado al subir la foto', { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-[var(--plotter-orange)] animate-spin" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="p-6 rounded-[32px] w-full flex flex-col gap-6"
      style={{ boxShadow: 'var(--nm-raised)', backgroundColor: 'var(--plotter-card)' }}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="font-['Outfit'] font-black text-lg text-white">Editar Perfil</h3>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 text-[var(--plotter-muted)] hover:text-white border border-white/5"
          style={{ boxShadow: 'var(--nm-pill)', backgroundColor: 'var(--plotter-card)' }}
        >
          Cerrar
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar Upload Frame */}
        <div className="relative group cursor-pointer shrink-0" onClick={handleImageClick}>
          <div 
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center relative border-2 border-white/10"
            style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep)' }}
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-black text-[var(--plotter-orange)] font-['Outfit']">
                {getInitials(displayName || email)}
              </span>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold transition-all duration-300">
              <Camera className="w-4 h-4 mb-0.5 text-[var(--plotter-orange)]" />
              <span>CAMBIAR</span>
            </div>
            
            {/* Uploading loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/85 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[var(--plotter-orange)] animate-spin" />
              </div>
            )}
          </div>
          
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Name Form */}
        <form onSubmit={handleSaveName} className="flex-1 w-full flex flex-col gap-4">
          <div>
            <label className="text-[var(--plotter-muted)] text-[10px] uppercase tracking-wider font-semibold block mb-1.5 pl-1">
              Nombre de pantalla
            </label>
            <div 
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ boxShadow: 'var(--nm-inset)', backgroundColor: 'var(--plotter-deep)' }}
            >
              <User className="w-4 h-4 text-[var(--plotter-muted)]" />
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Ingresa tu nombre..."
                maxLength={20}
                className="w-full bg-transparent border-none text-[var(--plotter-white)] placeholder-[var(--plotter-muted)] focus:outline-none text-xs font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-1">
            <span className="text-[9px] text-[var(--plotter-muted)] pl-1">
              Sesión: <strong className="text-white/60 font-semibold">{email}</strong>
            </span>
            
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-2xl font-['Outfit'] font-black text-xs text-white uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1.5"
              style={{ boxShadow: 'var(--nm-glow-orange)', backgroundColor: 'var(--plotter-orange)' }}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Guardar Nombre
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
