import { supabase } from '../supabase'

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
  created_at?: string
  profiles?: Profile | null
}

const LOCAL_STORAGE_KEY = 'plotter_local_reviews'

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
export async function saveReview(review: Omit<Review, 'id' | 'created_at'>): Promise<{ success: boolean; storage: 'cloud' | 'local'; error?: any }> {
  try {
    // Check if session exists
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const reviewToInsert = {
        ...review,
        user_id: session.user.id
      }
      
      const { error } = await supabase
        .from('reviews')
        .insert([reviewToInsert])
        
      if (error) throw error
      
      return { success: true, storage: 'cloud' }
    } else {
      // Offline/Local storage
      const localReviews = getLocalReviews()
      const newReview: Review = {
        ...review,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      }
      localReviews.push(newReview)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localReviews))
      return { success: true, storage: 'local' }
    }
  } catch (err) {
    console.error('Error saving review:', err)
    return { success: false, storage: 'local', error: err }
  }
}

let isSyncing = false

// Sync local reviews to Supabase
export async function syncLocalReviews(userId: string): Promise<{ success: boolean; count: number; error?: any }> {
  if (typeof window === 'undefined') return { success: true, count: 0 }
  if (isSyncing) return { success: true, count: 0 }
  
  isSyncing = true
  try {
    const localReviews = getLocalReviews()
    if (localReviews.length === 0) {
      isSyncing = false
      return { success: true, count: 0 }
    }
    
    // Clear queue BEFORE inserting to prevent duplicate calls from racing
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    
    // Map to include user_id and clean metadata
    const reviewsToInsert = localReviews.map(review => ({
      user_id: userId,
      reviewer_name: review.reviewer_name,
      title: review.title,
      year: review.year,
      rating: review.rating,
      review_text: review.review_text,
      description: review.description || '',
      poster_path: review.poster_path || null,
      created_at: review.created_at || new Date().toISOString()
    }))
    
    const { error } = await supabase
      .from('reviews')
      .insert(reviewsToInsert)
      
    if (error) {
      // Restore queue if insertion fails
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localReviews))
      throw error
    }
    
    return { success: true, count: reviewsToInsert.length }
  } catch (err) {
    console.error('Error syncing local reviews:', err)
    return { success: false, count: 0, error: err }
  } finally {
    isSyncing = false
  }
}

// Fetch all community reviews, joining profile data.
// Strategy: Try the PostgREST embedded join first. If the FK from
// reviews.user_id → profiles.id hasn't been added yet (PGRST200),
// fall back to fetching profiles separately and merging them manually.
export async function fetchCommunityReviews(): Promise<Review[]> {
  try {
    // Attempt 1: PostgREST join (works after FK migration is applied in Supabase)
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url)')
      .order('created_at', { ascending: false })

    // PGRST200 = no FK relationship found → fall through to manual merge
    if (error && error.code !== 'PGRST200') throw error
    if (!error) return data || []

    // Attempt 2: Fetch reviews and profiles independently, then merge
    console.warn(
      'fetchCommunityReviews: FK join unavailable (PGRST200). ' +
      'Run the migration in app/sql/schema.sql to enable it. ' +
      'Falling back to manual profile merge.'
    )

    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (reviewsError) throw reviewsError
    if (!reviews || reviews.length === 0) return []

    // Collect unique non-null user_ids to fetch profiles for
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))]

    let profilesMap: Record<string, Profile> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map(p => [p.id, p]))
      }
    }

    // Attach profile to each review
    return reviews.map(review => ({
      ...review,
      profiles: review.user_id ? (profilesMap[review.user_id] ?? null) : null
    }))
  } catch (err) {
    console.error('Error fetching community reviews:', err)
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

