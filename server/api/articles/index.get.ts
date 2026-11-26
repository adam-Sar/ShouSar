import { db } from '~/server/utils/db'
import { getSessionUser } from '~/server/utils/auth'
import { articleWithRelations } from '~/server/utils/articles'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category = typeof query.category === 'string' ? query.category.trim() : ''
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const tag = typeof query.tag === 'string' ? query.tag.trim() : ''
  const authorUsername = typeof query.author === 'string' ? query.author.trim() : ''
  const mine = query.mine === '1'
  const bookmarked = query.bookmarked === '1'
  const breakingOnly = query.breaking === '1'
  const showAll = query.all === '1'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 12))

  const sessionUser = await getSessionUser(event)
  const isStaff = sessionUser && (sessionUser.role === 'ADMIN' || sessionUser.role === 'EDITOR')

  const where: Record<string, unknown> = {}

  if (mine) {
    if (!sessionUser) {
      throw createError({ statusCode: 401, statusMessage: 'يجب تسجيل الدخول أولاً' })
    }
    where.authorId = sessionUser.id
  } else if (bookmarked) {
    if (!sessionUser) {
      throw createError({ statusCode: 401, statusMessage: 'يجب تسجيل الدخول أولاً' })
    }
    where.status = 'PUBLISHED'
    where.bookmarks = { some: { userId: sessionUser.id } }
  } else if (showAll && isStaff) {
    // Staff moderation view sees both drafts and published articles
  } else {
    where.status = 'PUBLISHED'
  }

  if (category) {
    where.category = { slug: category }
  }

  if (breakingOnly) {
    where.isBreaking = true
  }

  if (authorUsername) {
    where.author = { username: authorUsername }
  }

  if (tag) {
    where.tags = { contains: tag }
  }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { lead: { contains: q } },
      { content: { contains: q } },
      { tags: { contains: q } }
    ]
  }

  const [total, articles] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      include: articleWithRelations,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    })
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  }
})
