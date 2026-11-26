import { db } from '~/server/utils/db'

interface WeatherCache {
  temp: number
  label: string
  fetchedAt: number
}

let weatherCache: WeatherCache | null = null
const CACHE_TTL_MS = 30 * 60 * 1000

function weatherCodeToArabic(code: number): string {
  if (code === 0) return 'صحو'
  if (code <= 3) return 'غائم جزئياً'
  if (code <= 48) return 'ضبابي'
  if (code <= 67) return 'ماطر'
  if (code <= 77) return 'مثلج'
  if (code <= 99) return 'عاصف'
  return 'صحو'
}

export default defineEventHandler(async () => {
  const now = Date.now()
  if (!weatherCache || now - weatherCache.fetchedAt > CACHE_TTL_MS) {
    try {
      const res = await $fetch<{
        current?: { temperature_2m?: number; weather_code?: number }
      }>(
        'https://api.open-meteo.com/v1/forecast?latitude=33.8938&longitude=35.5018&current=temperature_2m,weather_code',
        { timeout: 2500 }
      )
      if (typeof res?.current?.temperature_2m === 'number') {
        weatherCache = {
          temp: Math.round(res.current.temperature_2m),
          label: weatherCodeToArabic(res.current.weather_code ?? 0),
          fetchedAt: now
        }
      }
    } catch {
      // Keep stale cache or fallback silently when offline
    }
  }

  let usdRate = '89,500'
  try {
    const setting = await db.siteSetting.findUnique({ where: { key: 'usd_lbp_rate' } })
    if (setting?.value) usdRate = setting.value
  } catch {
    // Table may not exist before prisma push in early builds
  }

  return {
    weather: {
      city: 'بيروت',
      temp: weatherCache?.temp ?? 24,
      label: weatherCache?.label ?? 'صحو'
    },
    usdRate
  }
})
