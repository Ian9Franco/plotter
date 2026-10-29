'use client'

import { useState } from 'react'
import Image from 'next/image'

type PosterSize = 'w185' | 'w342' | 'w500' | 'w780'
type BackdropSize = 'w300' | 'w780' | 'w1280'

interface TmdbImageProps {
  path: string | null
  alt: string
  size?: PosterSize | BackdropSize
  className?: string
  priority?: boolean
  sizes?: string
}

export default function TmdbImage({
  path,
  alt,
  size = 'w342',
  className = 'object-cover',
  priority = false,
  sizes = '(max-width: 640px) 45vw, 220px',
}: TmdbImageProps) {
  const [failed, setFailed] = useState(false)

  if (!path || failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/placeholder-poster.svg" alt="" className={`h-full w-full object-cover ${className}`} />
    )
  }

  return (
    <Image
      src={`https://image.tmdb.org/t/p/${size}${path}`}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
