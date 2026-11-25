import { db } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const rawSlug = getRouterParam(event, 'slug')
  if (!rawSlug) {
    throw createError({ statusCode: 400, statusMessage: 'معرّف المقال مفقود' })
  }

  const slug = decodeURIComponent(rawSlug)
  const existing = await db.article.findUnique({ where: { slug } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'المقال غير موجود' })
  }

  const isStaff = user.role === 'ADMIN' || user.role === 'EDITOR'
  if (existing.authorId !== user.id && !isStaff) {
    throw createError({ statusCode: 403, statusMessage: 'غير مسموح بحذف هذا المقال' })
  }

  await db.article.delete({ where: { id: existing.id } })
  return { ok: true }
})
