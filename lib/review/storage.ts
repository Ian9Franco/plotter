import { supabase } from '../supabase'
import { getSupabaseServer } from '../supabase/server'

function reviewsDb() {
  if (typeof window === 'undefined') {
    const server = getSupabaseServer()
    if (!server) {
      throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }
    return server
  }
  return supabase
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  updated_at?: string
}

export interface Review {
  id?: string
  user_id?: string | null
  reviewer_name: string
  title: string
  year: string
  rating: number
  review_text: string
  description?: string
  poster_path?: string | null
  tmdb_id?: number | null
  media_type?: 'movie' | 'tv' | null
  created_at?: string
  profiles?: Profile | null
}

export interface ReviewPage {
  reviews: Review[]
  hasMore: boolean
}

const LOCAL_STORAGE_KEY = 'plotter_local_reviews'
const SYNC_LOCK_KEY = 'plotter_sync_lock'
const SYNC_LOCK_TTL_MS = 120_000
const DEFAULT_PAGE_SIZE = 20

// Helper to get local reviews
export function getLocalReviews(): Review[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (err) {
    console.error('Error reading local reviews:', err)
    return []
  }
}

// Helper to save review (cloud if logged in, local if not)
function reviewRow(review: Omit<Review, 'id' | 'created_at' | 'profiles'>, userId: string) {
  return {
    user_id: userId,
    reviewer_name: review.reviewer_name,
    title: review.title,
    year: review.year,
    rating: review.rating,
    review_text: review.review_text,
    description: review.description || '',
    poster_path: review.poster_path || null,
    tmdb_id: review.tmdb_id ?? null,
    media_type: review.media_type ?? null,
  }
}

async function upsertOwnedReview(
  userId: string,
  row: ReturnType<typeof reviewRow>,
  createdAt?: string,
): Promise<'inserted' | 'updated'> {
  if (row.tmdb_id != null && row.media_type) {
    const { data: existing, error: findError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('tmdb_id', row.tmdb_id)
      .eq('media_type', row.media_type)
      .maybeSingle()

    if (findError) throw findError

    if (existing?.id) {
      const { error } = await supabase.from('reviews').update(row).eq('id', existing.id)
      if (error) throw error
      return 'updated'
    }
  }

  const { error } = await supabase.from('reviews').insert([{ ...row, ...(createdAt ? { created_at: createdAt } : {}) }])
  if (error?.code === '23505' && row.tmdb_id != null && row.media_type) {
    const { error: updateError } = await supabase
      .from('reviews')
      .update(row)
      .eq('user_id', userId)
      .eq('tmdb_id', row.tmdb_id)
      .eq('media_type', row.media_type)
    if (updateError) throw updateError
    return 'updated'
  }
  if (error) throw error
  return 'inserted'
}

export async function saveReview(
  review: Omit<Review, 'id' | 'created_at' | 'profiles'>,
): Promise<{ success: boolean; storage: 'cloud' | 'local'; updated?: boolean; error?: unknown }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const outcome = await upsertOwnedReview(session.user.id, reviewRow(review, session.user.id))
      return { success: true, storage: 'cloud', updated: outcome === 'updated' }
    }

    const localReviews = getLocalReviews()
    const sameTitle = review.tmdb_id != null && review.media_type
      ? localReviews.findIndex((item) => item.tmdb_id === review.tmdb_id && item.media_type === review.media_type)
      : -1

    if (sameTitle >= 0) {
      localReviews[sameTitle] = {
        ...localReviews[sameTitle],
        ...review,
        id: localReviews[sameTitle].id,
        created_at: localReviews[sameTitle].created_at,
      }
    } else {
      localReviews.push({
        ...review,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
      })
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localReviews))
    return { success: true, storage: 'local', updated: sameTitle >= 0 }
  } catch (err) {
    console.error('Error saving review:', err)
    return { success: false, storage: 'local', error: err }
  }
}

function tryAcquireSyncLock(): string | null {
  if (typeof window === 'undefined') return null
  const now = Date.now()
  const token = `${now}-${Math.random().toString(36).slice(2)}`
  try {
    const existing = localStorage.getItem(SYNC_LOCK_KEY)
    if (existing) {
      const parsed = JSON.parse(existing) as { token?: string; ts?: number }
      if (parsed.ts && now - parsed.ts < SYNC_LOCK_TTL_MS) return null
    }
    localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({ token, ts: now }))
    const check = JSON.parse(localStorage.getItem(SYNC_LOCK_KEY) || '{}') as { token?: string }
    return check.token === token ? token : null
  } catch {
    return null
  }
}

function stillHoldSyncLock(token: string) {
  try {
    const existing = localStorage.getItem(SYNC_LOCK_KEY)
    if (!existing) return false
    const parsed = JSON.parse(existing) as { token?: string }
    if (parsed.token !== token) return false
    localStorage.setItem(SYNC_LOCK_KEY, JSON.stringify({ token, ts: Date.now() }))
    return true
  } catch {
    return false
  }
}

function releaseSyncLock(token: string) {
  try {
    const existing = localStorage.getItem(SYNC_LOCK_KEY)
    if (!existing) return
    const parsed = JSON.parse(existing) as { token?: string }
    if (parsed.token === token) localStorage.removeItem(SYNC_LOCK_KEY)
  } catch {
    // The queue itself is the source of truth if the lock cannot be parsed.
  }
}

function dropSyncedLocalReview(review: Review) {
  const current = getLocalReviews().filter((item) => item.id !== review.id)
  if (current.length === 0) localStorage.removeItem(LOCAL_STORAGE_KEY)
  else localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current))
}

// Insert first. A row leaves localStorage only after Supabase accepts it.
// The lock is shared across tabs; a module flag would not be.
export async function syncLocalReviews(userId: string): Promise<{ success: boolean; count: number; error?: unknown }> {
  if (typeof window === 'undefined') return { success: true, count: 0 }

  const token = tryAcquireSyncLock()
  if (!token) return { success: true, count: 0 }

  let synced = 0
  try {
    const localReviews = getLocalReviews()
    for (const review of localReviews) {
      if (!stillHoldSyncLock(token)) break
      try {
        await upsertOwnedReview(userId, reviewRow(review, userId), review.created_at)
        dropSyncedLocalReview(review)
        synced += 1
      } catch (err) {
        console.error('Error syncing one local review:', err)
        releaseSyncLock(token)
        return { success: false, count: synced, error: err }
      }
    }
    return { success: true, count: synced }
  } finally {
    releaseSyncLock(token)
  }
}

interface ReviewQuery {
  limit?: number
  before?: string
  userId?: string
  tmdbId?: number
  mediaType?: 'movie' | 'tv'
}

function pageFromRows(rows: Review[], limit: number): ReviewPage {
  const hasMore = rows.length > limit
  return { reviews: hasMore ? rows.slice(0, limit) : rows, hasMore }
}

async function attachProfiles(reviews: Review[]): Promise<Review[]> {
  const userIds = [...new Set(reviews.map((review) => review.user_id).filter(Boolean))] as string[]
  if (userIds.length === 0) {
    return reviews.map((review) => ({ ...review, profiles: null }))
  }

  const { data: profiles } = await reviewsDb()
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', userIds)

  const profilesMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile]))
  return reviews.map((review) => ({
    ...review,
    profiles: review.user_id ? (profilesMap[review.user_id] ?? null) : null,
  }))
}

function applyReviewFilters<T extends { lt: Function; eq: Function }>(query: T, options: ReviewQuery): T {
  let next = query
  if (options.before) next = next.lt('created_at', options.before) as T
  if (options.userId) next = next.eq('user_id', options.userId) as T
  if (options.tmdbId != null) next = next.eq('tmdb_id', options.tmdbId) as T
  if (options.mediaType) next = next.eq('media_type', options.mediaType) as T
  return next
}

async function queryReviews(options: ReviewQuery): Promise<ReviewPage> {
  const limit = options.limit ?? DEFAULT_PAGE_SIZE
  const db = reviewsDb()

  const joinedQuery = applyReviewFilters(
    db.from('reviews').select('*, profiles(display_name, avatar_url)').order('created_at', { ascending: false }).limit(limit + 1),
    options,
  )
  const joined = await joinedQuery
  if (!joined.error) return pageFromRows((joined.data ?? []) as unknown as Review[], limit)

  if (joined.error.code !== 'PGRST200') throw joined.error

  console.warn(
    'reviews join unavailable (PGRST200). Apply app/sql/2026-reviews-profiles-fk.sql. Falling back to this page only.',
  )

  const plainQuery = applyReviewFilters(
    db.from('reviews').select('*').order('created_at', { ascending: false }).limit(limit + 1),
    options,
  )
  const plain = await plainQuery
  if (plain.error) throw plain.error
  const page = pageFromRows((plain.data ?? []) as unknown as Review[], limit)
  return { ...page, reviews: await attachProfiles(page.reviews) }
}

export async function fetchCommunityReviews(options: { limit?: number; before?: string } = {}): Promise<ReviewPage> {
  try {
    return await queryReviews(options)
  } catch (err) {
    console.error('Error fetching community reviews:', err)
    return { reviews: [], hasMore: false }
  }
}

export async function fetchUserReviews(
  userId: string,
  options: { limit?: number; before?: string } = {},
): Promise<ReviewPage> {
  try {
    return await queryReviews({ ...options, userId })
  } catch (err) {
    console.error('Error fetching user reviews:', err)
    return { reviews: [], hasMore: false }
  }
}

export async function fetchReviewsForTitle(
  tmdbId: number,
  mediaType: 'movie' | 'tv',
  limit = 10,
): Promise<Review[]> {
  try {
    const page = await queryReviews({ tmdbId, mediaType, limit })
    return page.reviews
  } catch (err) {
    console.error('Error fetching title reviews:', err)
    return []
  }
}

// Delete a review
export async function deleteReview(reviewId: string): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Error deleting review:', err)
    return { success: false, error: err }
  }
}

// Fetch user profile from Supabase profiles table
export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      
    if (error) {
      // If profile doesn't exist, we create it dynamically as a fallback
      if (error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user && userData.user.id === userId) {
          const defaultName = userData.user.email ? userData.user.email.split('@')[0] : 'Usuario'
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: userId, display_name: defaultName })
            .select()
            .single()
          if (!insertError) return newProfile
        }
      }
      throw error
    }
    return data
  } catch (err) {
    console.error('Error fetching user profile:', err)
    return null
  }
}

// Update user profile details
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id'>>
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      
    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Error updating user profile:', err)
    return { success: false, error: err }
  }
}

// Client-side image resizing using HTML Canvas API to avoid high-quality storage bloating
export function resizeImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Canvas image resizing is only supported in the browser'))
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Failed to get 2D canvas context'))
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Blob conversion failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

// Upload a user's avatar, performing client-side resizing first
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; publicUrl?: string; error?: any }> {
  try {
    const resizedBlob = await resizeImage(file, 400, 400, 0.8)
    
    // Standard file name path to avoid name collisions and RLS folder structure matches
    const fileExt = 'jpg'
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, resizedBlob, {
        contentType: 'image/jpeg',
        upsert: true
      })
      
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
      
    return { success: true, publicUrl }
  } catch (err) {
    console.error('Error uploading avatar:', err)
    return { success: false, error: err }
  }
}

