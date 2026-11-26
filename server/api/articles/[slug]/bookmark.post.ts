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

  const existing = await db.bookmark.findUnique({
    where: { articleId_userId: { articleId: article.id, userId: user.id } }
  })

  let bookmarked = false
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } })
  } else {
    await db.bookmark.create({ data: { articleId: article.id, userId: user.id } })
    bookmarked = true
  }

  return { bookmarked }
})
