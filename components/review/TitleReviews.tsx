import type { Review } from '@/lib/review/storage'

export default function TitleReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null

  return (
    <section className="px-4 mt-8">
      <h2 className="font-['Outfit'] font-bold text-sm text-[var(--plotter-white)] mb-3">
        En Plotter
      </h2>
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="glass-card rounded-[var(--radius-lg)] p-4"
          >
            <p className="text-xs text-[var(--plotter-muted)] font-semibold">
              {review.profiles?.display_name || review.reviewer_name}
              <span className="mx-2 text-white/20">·</span>
              {review.rating}
            </p>
            <p className="text-sm text-[var(--plotter-white)] mt-2 leading-relaxed">
              {review.review_text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
