import { EventEmitter } from 'node:events'
import type { LiveUpdateItem } from '~/types/news'

class LiveBus extends EventEmitter {}

const globalForBus = globalThis as unknown as {
  shousarLiveBus?: LiveBus
}

export const liveBus = globalForBus.shousarLiveBus ?? new LiveBus()

if (process.env.NODE_ENV !== 'production') {
  globalForBus.shousarLiveBus = liveBus
}

export function broadcastLiveEvent(payload: { type: 'created' | 'deleted'; update?: LiveUpdateItem; id?: string }) {
  liveBus.emit('update', payload)
}
