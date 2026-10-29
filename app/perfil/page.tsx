'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileSettings from '@/components/profile/ProfileSettings'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/review/storage'

export default function PerfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return <div className="min-h-[40vh] pt-10 flex items-center justify-center text-[var(--plotter-muted)] text-sm">Cargando perfil…</div>
  }

  if (!user) {
    return (
      <div className="min-h-[40vh] pt-10 px-6 text-center">
        <p className="text-[var(--plotter-muted)] text-sm">Entrá para editar tu perfil.</p>
        <button
          type="button"
          onClick={() => router.push('/reviews?entrar=1')}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--plotter-orange)' }}
        >
          Entrar
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
      <ProfileSettings
        userId={user.id}
        email={user.email || ''}
        onClose={() => router.push('/reviews')}
        onProfileUpdated={(_profile: Profile) => undefined}
      />
    </div>
  )
}
