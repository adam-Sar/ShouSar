import { db } from '~/server/utils/db'
import { requireStaff } from '~/server/utils/auth'
import { broadcastLiveEvent } from '~/server/utils/liveBus'

export default defineEventHandler(async (event) => {
  await requireStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'معرّف التحديث مفقود' })
  }

  await db.liveUpdate.delete({ where: { id } })
  broadcastLiveEvent({ type: 'deleted', id })
  return { ok: true }
})
