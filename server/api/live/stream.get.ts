import { liveBus } from '~/server/utils/liveBus'

export default defineEventHandler(async (event) => {
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
    await eventStream.close()
  })

  return eventStream.send()
})
