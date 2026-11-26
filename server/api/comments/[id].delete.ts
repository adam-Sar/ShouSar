import { db } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'معرّف التعليق مفقود' })
  }

  const comment = await db.comment.findUnique({ where: { id } })
  if (!comment) {
    throw createError({ statusCode: 404, statusMessage: 'التعليق غير موجود' })
  }

  const isStaff = user.role === 'ADMIN' || user.role === 'EDITOR'
  if (comment.authorId !== user.id && !isStaff) {
    throw createError({ statusCode: 403, statusMessage: 'غير مسموح بحذف هذا التعليق' })
  }

  await db.comment.delete({ where: { id: comment.id } })
  return { ok: true }
})
