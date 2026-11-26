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

  // Deduplicate view count per browser session cookie for 30 minutes
  if (article.status === 'PUBLISHED') {
    const viewedCookie = getCookie(event, 'shousar_viewed') || ''
    const viewedIds = viewedCookie.split(',').filter(Boolean)
    if (!viewedIds.includes(article.id)) {
      await db.article.update({
        where: { id: article.id },
        data: { views: { increment: 1 } }
      })
      article.views += 1
      const nextViewed = [article.id, ...viewedIds].slice(0, 20).join(',')
      setCookie(event, 'shousar_viewed', nextViewed, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 30
      })
    }
  }

  let userReacted = false
  let userBookmarked = false
  if (sessionUser) {
    const [r, b] = await Promise.all([
      db.reaction.findUnique({
        where: { articleId_userId: { articleId: article.id, userId: sessionUser.id } },
        select: { id: true }
      }),
      db.bookmark.findUnique({
        where: { articleId_userId: { articleId: article.id, userId: sessionUser.id } },
        select: { id: true }
      })
    ])
    userReacted = Boolean(r)
    userBookmarked = Boolean(b)
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

  return {
    article: {
      ...article,
      userReacted,
      userBookmarked
    },
    related
  }
})
