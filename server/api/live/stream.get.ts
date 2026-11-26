import { liveBus } from '~/server/utils/liveBus'
import { getClientIp } from '~/server/utils/rateLimit'

const activeStreamsPerIp = new Map<string, number>()
const MAX_STREAMS_PER_IP = 5

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  const currentCount = activeStreamsPerIp.get(ip) ?? 0
  if (currentCount >= MAX_STREAMS_PER_IP) {
    throw createError({ statusCode: 429, statusMessage: 'عدد اتصالات البث المباشر تجاوز الحد المسموح به' })
  }
  activeStreamsPerIp.set(ip, currentCount + 1)

  const eventStream = createEventStream(event)

  const onUpdate = (payload: unknown) => {
    eventStream.push(JSON.stringify(payload)).catch(() => {})
  }

  liveBus.on('update', onUpdate)

  const heartbeat = setInterval(() => {
    eventStream.push(JSON.stringify({ type: 'ping' })).catch(() => {})
  }, 25000)

  eventStream.onClosed(async () => {
    clearInterval(heartbeat)
    liveBus.off('update', onUpdate)
    const remaining = (activeStreamsPerIp.get(ip) ?? 1) - 1
    if (remaining <= 0) {
      activeStreamsPerIp.delete(ip)
    } else {
      activeStreamsPerIp.set(ip, remaining)
    }
    await eventStream.close()
  })

  return eventStream.send()
})
