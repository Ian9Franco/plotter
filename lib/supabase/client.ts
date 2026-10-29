import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | undefined

function missingEnvError(): Error {
  return new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Plotter no usa placeholder.supabase.co.',
  )
}

export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

  if (!url || !key) {
    if (isBuild) {
      browserClient = createClient('https://placeholder.supabase.co', 'placeholder-key')
      return browserClient
    }
    throw missingEnvError()
  }

  browserClient = createClient(url, key)
  return browserClient
}

// Lazy proxy so importing this module does not crash the build. The first
// call in development throws if the public env vars are missing.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseBrowser()
    const value = client[prop as keyof SupabaseClient]
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
  },
})
