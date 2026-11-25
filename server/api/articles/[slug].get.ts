import { db } from '~/server/utils/db'
import { getSessionUser } from '~/server/utils/auth'
import { articleWithRelations, publicAuthorSelect } from '~/server/utils/articles'

export default defineEventHandler(async (event) => {
  const rawSlug = getRouterParam(event, 'slug')
  if (!rawSlug) {
    throw createError({ statusCode: 400, statusMessage: 'معرّف المقال مفقود' })
  }

  const slug = decodeURIComponent(rawSlug)
  const sessionUser = await getSessionUser(event)

  const article = await db.article.findUnique({
    where: { slug },
    include: {
      ...articleWithRelations,
      comments: {
        include: { author: { select: publicAuthorSelect } },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'المقال غير موجود' })
  }

  const isStaff = sessionUser && (sessionUser.role === 'ADMIN' || sessionUser.role === 'EDITOR')
  const isOwner = sessionUser && sessionUser.id === article.authorId

  if (article.status !== 'PUBLISHED' && !isStaff && !isOwner) {
    throw createError({ statusCode: 404, statusMessage: 'المقال غير متاح للعرض العام' })
  }

  if (article.status === 'PUBLISHED') {
    await db.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } }
    })
  }

  const related = await db.article.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: article.id }
    },
    include: articleWithRelations,
    orderBy: [{ publishedAt: 'desc' }],
    take: 3
  })

  return { article, related }
})
