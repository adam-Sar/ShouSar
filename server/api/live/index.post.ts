import { db } from '~/server/utils/db'
import { requireStaff } from '~/server/utils/auth'
import { broadcastLiveEvent } from '~/server/utils/liveBus'

export default defineEventHandler(async (event) => {
  await requireStaff(event)

  const body = await readBody<{
    title?: string
    summary?: string
    linkSlug?: string
    isUrgent?: boolean
  }>(event)

  const title = body.title?.trim() || ''
  if (title.length < 4 || title.length > 280) {
    throw createError({ statusCode: 400, statusMessage: 'نص التحديث يجب أن يكون بين 4 و 280 حرفاً' })
  }
  if (body.summary && body.summary.trim().length > 600) {
    throw createError({ statusCode: 400, statusMessage: 'ملخص التحديث طويل جداً' })
  }

  const update = await db.liveUpdate.create({
    data: {
      title,
      summary: body.summary?.trim() || null,
      linkSlug: body.linkSlug?.trim() || null,
      isUrgent: Boolean(body.isUrgent)
    }
  })

  broadcastLiveEvent({
    type: 'created',
    update: { ...update, createdAt: update.createdAt.toISOString() }
  })

  return { update }
})
