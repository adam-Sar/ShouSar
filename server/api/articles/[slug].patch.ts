import { db } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import {
  articleWithRelations,
  deleteLocalUploadIfUnused,
  estimateReadTime,
  validateArticleInput
} from '~/server/utils/articles'

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
    throw createError({ statusCode: 403, statusMessage: 'غير مسموح بتعديل هذا المقال' })
  }

  const body = await readBody<{
    title?: string
    lead?: string
    content?: string
    categoryId?: string
    heroImage?: string
    imageCaption?: string
    pullQuote?: string
    pullQuoteAuthor?: string
    tags?: string
    status?: string
    isFeatured?: boolean
    isBreaking?: boolean
  }>(event)

  validateArticleInput(body, true)

  if (body.categoryId !== undefined && body.categoryId.trim() !== existing.categoryId) {
    const category = await db.category.findUnique({ where: { id: body.categoryId.trim() } })
    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'التصنيف المختار غير صالح' })
    }
  }

  const updated = await db.$transaction(async (tx) => {
    if (isStaff && body.isFeatured === true) {
      await tx.article.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } })
    }

    const nextContent = body.content?.trim() ?? existing.content

    return tx.article.update({
      where: { id: existing.id },
      data: {
        title: body.title?.trim() ?? existing.title,
        lead: body.lead?.trim() ?? existing.lead,
        content: nextContent,
        readTimeMinutes: estimateReadTime(nextContent),
        categoryId: body.categoryId?.trim() || existing.categoryId,
        heroImage: body.heroImage?.trim() || existing.heroImage,
        imageCaption: body.imageCaption !== undefined ? body.imageCaption.trim() || null : existing.imageCaption,
        pullQuote: body.pullQuote !== undefined ? body.pullQuote.trim() || null : existing.pullQuote,
        pullQuoteAuthor:
          body.pullQuoteAuthor !== undefined ? body.pullQuoteAuthor.trim() || null : existing.pullQuoteAuthor,
        tags: body.tags !== undefined ? body.tags.trim() : existing.tags,
        status: body.status === 'DRAFT' || body.status === 'PUBLISHED' ? body.status : existing.status,
        isFeatured: isStaff && body.isFeatured !== undefined ? body.isFeatured : existing.isFeatured,
        isBreaking: isStaff && body.isBreaking !== undefined ? body.isBreaking : existing.isBreaking
      },
      include: articleWithRelations
    })
  })

  if (updated.heroImage !== existing.heroImage) {
    await deleteLocalUploadIfUnused(existing.heroImage)
  }

  return { article: updated }
})
