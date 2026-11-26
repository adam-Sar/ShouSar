import { db } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { publicAuthorSelect } from '~/server/utils/articles'

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

  const body = await readBody<{ body?: string }>(event)
  const commentBody = body.body?.trim() || ''

  if (commentBody.length < 2 || commentBody.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'التعليق يجب أن يكون بين حرفين و 2000 حرف' })
  }

  const comment = await db.comment.create({
    data: {
      body: commentBody,
      articleId: article.id,
      authorId: user.id
    },
    include: {
      author: { select: publicAuthorSelect }
    }
  })

  return { comment }
})
