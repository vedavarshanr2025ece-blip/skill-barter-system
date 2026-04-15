import React from 'react'

/** Renders 1–5 filled/empty stars. */
export default function RatingStars({ rating = 0, max = 5, size = '1rem' }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }} aria-label={`Rating: ${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ fontSize: size, color: i < rating ? 'var(--clr-accent)' : 'var(--clr-border)' }}>
          ★
        </span>
      ))}
    </div>
  )
}
