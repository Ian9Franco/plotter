'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { syncLocalReviews } from '@/lib/review/storage'

// One listener for the whole app. onAuthStateChange already emits the initial
// session, so getSession() must not sync again or a login inserts twice.
export default function ReviewSync() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) return
      if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return
      syncLocalReviews(session.user.id)
        .then((result) => {
          if (result.count > 0) {
            window.dispatchEvent(new CustomEvent('plotter-reviews-synced', { detail: result.count }))
          }
        })
        .catch((err) => console.error('Error syncing local reviews:', err))
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
