import { db } from '~/server/utils/db'
import { articleWithRelations, publicAuthorSelect } from '~/server/utils/articles'

export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'username')
  if (!username) {
    throw createError({ statusCode: 400, statusMessage: 'اسم الكاتب مطلوب' })
  }

  const author = await db.user.findUnique({
    where: { username: decodeURIComponent(username).toLowerCase() },
    select: publicAuthorSelect
  })

  if (!author) {
    throw createError({ statusCode: 404, statusMessage: 'الكاتب غير موجود' })
  }

  const articles = await db.article.findMany({
    where: {
      authorId: author.id,
      status: 'PUBLISHED'
    },
    include: articleWithRelations,
    orderBy: { publishedAt: 'desc' }
  })

  return { author, articles }
})
