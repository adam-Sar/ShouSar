import type { H3Event } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function enforceRateLimit(event: H3Event, scope: string, maxRequests: number, windowMs: number) {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'local'
  const key = `${scope}:${ip}`
  const now = Date.now()

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
