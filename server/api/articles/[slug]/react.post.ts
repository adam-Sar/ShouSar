import { db } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const rawSlug = getRouterParam(event, 'slug')
  if (!rawSlug) {
    throw createError({ statusCode: 400, statusMessage: 'معرّف المقال مفقود' })
  }

  const slug = decodeURIComponent(rawSlug)
  const article = await db.article.findUnique({
    where: { slug },
    select: { id: true, status: true }
  })

  if (!article || article.status !== 'PUBLISHED') {
    throw createError({ statusCode: 404, statusMessage: 'المقال غير موجود' })
  }

  const existing = await db.reaction.findUnique({
    where: { articleId_userId: { articleId: article.id, userId: user.id } }
  })

  let reacted = false
  if (existing) {
    await db.reaction.delete({ where: { id: existing.id } })
  } else {
    await db.reaction.create({ data: { articleId: article.id, userId: user.id, type: 'LIKE' } })
    reacted = true
  }

  const count = await db.reaction.count({ where: { articleId: article.id } })
  return { reacted, count }
})
