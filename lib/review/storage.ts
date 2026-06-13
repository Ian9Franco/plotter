import { supabase } from '../supabase'

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

// Sync local reviews to Supabase
export async function syncLocalReviews(userId: string): Promise<{ success: boolean; count: number; error?: any }> {
  if (typeof window === 'undefined') return { success: true, count: 0 }
  try {
    const localReviews = getLocalReviews()
    if (localReviews.length === 0) return { success: true, count: 0 }
    
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
      
    if (error) throw error
    
    // Clear queue upon success
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    return { success: true, count: reviewsToInsert.length }
  } catch (err) {
    console.error('Error syncing local reviews:', err)
    return { success: false, count: 0, error: err }
  }
}

// Fetch all community reviews
export async function fetchCommunityReviews(): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) throw error
    return data || []
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
