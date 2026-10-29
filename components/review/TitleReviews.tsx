'use client'

import type { Review } from '@/lib/review/storage'

interface TitleReviewsProps {
  reviews: Review[]
  currentUserId?: string | null
}

export default function TitleReviews({ reviews, currentUserId }: TitleReviewsProps) {
  if (reviews.length === 0) return null

  const ordered = [...reviews].sort((a, b) => {
    if (currentUserId && a.user_id === currentUserId) return -1
    if (currentUserId && b.user_id === currentUserId) return 1
    return 0
  })

  return (
    <section className="px-4 mt-8">
      <h2 className="font-['Outfit'] font-bold text-sm text-[var(--plotter-white)] mb-3">
        En Plotter
      </h2>
      <ul className="flex flex-col gap-3">
        {ordered.map((review) => (
          <li key={review.id} className="glass-card rounded-[var(--radius-lg)] p-4">
            <p className="text-xs text-[var(--plotter-muted)] font-semibold">
              {review.profiles?.display_name || review.reviewer_name}
              {currentUserId && review.user_id === currentUserId ? ' · Tu reseña' : ''}
              <span className="mx-2 text-white/20">·</span>
              {review.rating}
              {review.created_at && (
                <>
                  <span className="mx-2 text-white/20">·</span>
                  {new Date(review.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </>
              )}
            </p>
            <p className="text-sm text-[var(--plotter-white)] mt-2 leading-relaxed line-clamp-3">
              {review.review_text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
