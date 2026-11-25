import { db } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))

  const updates = await db.liveUpdate.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  return { updates }
})
