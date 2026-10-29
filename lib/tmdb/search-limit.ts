// Per-instance search cap. Each Node process (and each Vercel isolate) keeps
// its own Map, so the limit is not global. Enough to stop a local loop without
// a shared store. Move to a shared counter if abuse shows up across instances.

const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

const hitsByIp = new Map<string, number[]>()

export function consumeSearchBudget(ip: string, now = Date.now()): { ok: true } | { ok: false; retryAfter: number } {
  const recent = (hitsByIp.get(ip) ?? []).filter((ts) => now - ts < WINDOW_MS)

  if (recent.length >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000))
    hitsByIp.set(ip, recent)
    return { ok: false, retryAfter }
  }

  recent.push(now)
  hitsByIp.set(ip, recent)

  if (hitsByIp.size > 5000) {
    for (const [key, stamps] of hitsByIp) {
      const fresh = stamps.filter((ts) => now - ts < WINDOW_MS)
      if (fresh.length === 0) hitsByIp.delete(key)
      else hitsByIp.set(key, fresh)
    }
  }

  return { ok: true }
}

export function resetSearchBudget() {
  hitsByIp.clear()
}
