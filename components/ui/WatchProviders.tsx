import { getLogoUrl } from '@/lib/tmdb/client'
import type { WatchProviders as WatchProvidersType } from '@/lib/tmdb/types'
import { motion } from 'framer-motion'

interface WatchProvidersProps {
  providers: WatchProvidersType | null
}

export function WatchProviders({ providers }: WatchProvidersProps) {
  if (!providers) return null

  const allProviders = [
    ...(providers.flatrate || []),
    ...(providers.free || []),
    ...(providers.ads || []),
    ...(providers.rent || []),
    ...(providers.buy || [])
  ]

  // Deduplicate by provider_id
  const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values())

  if (uniqueProviders.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {uniqueProviders.slice(0, 4).map((provider, i) => (
        <motion.img
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * i, type: 'spring', stiffness: 200 }}
          key={provider.provider_id}
          src={getLogoUrl(provider.logo_path, 'w45')}
          alt={provider.provider_name}
          title={provider.provider_name}
          className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover shadow-sm border border-white/20 hover:scale-110 transition-transform cursor-help"
        />
      ))}
    </div>
  )
}
