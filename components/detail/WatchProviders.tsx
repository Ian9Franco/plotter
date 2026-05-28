'use client'

import { getLogoUrl } from '@/lib/tmdb/client'
import type { WatchProviders } from '@/lib/tmdb/types'
import { Tv } from 'lucide-react'

interface WatchProvidersProps {
  providers: WatchProviders | null
}

export default function WatchProvidersSection({ providers }: WatchProvidersProps) {
  if (!providers) return null

  const flatrate = providers.flatrate || []
  const rent     = providers.rent || []
  const buy      = providers.buy || []

  if (!flatrate.length && !rent.length && !buy.length) return null

  return (
    <div className="px-4 mt-6">
      <div className="glass-card rounded-[var(--radius-lg)] p-4">
        <div className="flex items-center gap-2 mb-4">
          <Tv className="w-4 h-4 text-[var(--plotter-green)]" />
          <h2 className="font-['Outfit'] font-bold text-sm text-white">Dónde ver</h2>
        </div>

        {flatrate.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-[var(--plotter-muted)] uppercase tracking-wider mb-2">Streaming</p>
            <div className="flex flex-wrap gap-2">
              {flatrate.slice(0, 6).map(p => (
                <ProviderLogo key={p.provider_id} provider={p} />
              ))}
            </div>
          </div>
        )}

        {rent.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-[var(--plotter-muted)] uppercase tracking-wider mb-2">Alquiler</p>
            <div className="flex flex-wrap gap-2">
              {rent.slice(0, 6).map(p => (
                <ProviderLogo key={p.provider_id} provider={p} />
              ))}
            </div>
          </div>
        )}

        {buy.length > 0 && (
          <div>
            <p className="text-[10px] text-[var(--plotter-muted)] uppercase tracking-wider mb-2">Compra</p>
            <div className="flex flex-wrap gap-2">
              {buy.slice(0, 6).map(p => (
                <ProviderLogo key={p.provider_id} provider={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProviderLogo({ provider }: { provider: { provider_id: number; provider_name: string; logo_path: string } }) {
  const logoUrl = getLogoUrl(provider.logo_path, 'w92')
  return (
    <div
      className="w-10 h-10 rounded-[var(--radius-sm)] overflow-hidden border border-[var(--plotter-border)] bg-[var(--plotter-card)]"
      title={provider.provider_name}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={provider.provider_name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Tv className="w-4 h-4 text-[var(--plotter-subtle)]" />
        </div>
      )}
    </div>
  )
}
