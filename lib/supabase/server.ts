import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Public anon client for Server Components that read data anyone can select
// (the community feed, reviews of a title). Cookie sessions via @supabase/ssr
// wait until profile and "mis reseñas" render on the server. Until then the
// browser client in ./client.ts stays the only place that signs in.

let serverClient: SupabaseClient | undefined

export function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!serverClient) serverClient = createClient(url, key)
  return serverClient
}
