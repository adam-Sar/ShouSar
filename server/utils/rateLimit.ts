import type { H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 5000

export function getClientIp(event: H3Event): string {
  const trustProxy = process.env.TRUST_PROXY === 'true'
  return getRequestIP(event, { xForwardedFor: trustProxy }) || event.node.req.socket.remoteAddress || 'local'
}

export function enforceRateLimit(event: H3Event, scope: string, maxRequests: number, windowMs: number) {
  const ip = getClientIp(event)
  const key = `${scope}:${ip}`
  const now = Date.now()

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (now > b.resetAt) buckets.delete(k)
    }
    if (buckets.size > MAX_BUCKETS) {
      buckets.clear()
    }
  }

  const existing = buckets.get(key)
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  existing.count += 1
  if (existing.count > maxRequests) {
    throw createError({
      statusCode: 429,
      statusMessage: 'تم تجاوز عدد المحاولات المسموح به مؤقتاً، يرجى الانتظار قليلاً'
    })
  }
}
