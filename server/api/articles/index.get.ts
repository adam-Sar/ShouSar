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
  const showAll = query.all === '1'
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))

  const sessionUser = await getSessionUser(event)
  const isStaff = sessionUser && (sessionUser.role === 'ADMIN' || sessionUser.role === 'EDITOR')

  const where: Record<string, unknown> = {}

  if (mine) {
    if (!sessionUser) {
      throw createError({ statusCode: 401, statusMessage: 'يجب تسجيل الدخول أولاً' })
    }
    where.authorId = sessionUser.id
  } else if (showAll && isStaff) {
    // Staff moderation view sees both drafts and published articles
  } else {
    where.status = 'PUBLISHED'
  }

  if (category) {
    where.category = { slug: category }
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

  const articles = await db.article.findMany({
    where,
    include: articleWithRelations,
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
    take: limit
  })

  return { articles }
})
