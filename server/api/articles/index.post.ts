import { db } from '~/server/utils/db'
import { requireAuth } from '~/server/utils/auth'
import { articleWithRelations, estimateReadTime, generateUniqueSlug } from '~/server/utils/articles'

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const isStaff = user.role === 'ADMIN' || user.role === 'EDITOR'

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

  const title = body.title?.trim() || ''
  const lead = body.lead?.trim() || ''
  const content = body.content?.trim() || ''
  const categoryId = body.categoryId?.trim() || ''

  if (title.length < 5) {
    throw createError({ statusCode: 400, statusMessage: 'العنوان قصير جداً (5 أحرف على الأقل)' })
  }
  if (lead.length < 10) {
    throw createError({ statusCode: 400, statusMessage: 'المقدمة مطلوبة (10 أحرف على الأقل)' })
  }
  if (content.length < 20) {
    throw createError({ statusCode: 400, statusMessage: 'نص المقال قصير جداً (20 حرفاً على الأقل)' })
  }

  const category = await db.category.findUnique({ where: { id: categoryId } })
  if (!category) {
    throw createError({ statusCode: 400, statusMessage: 'التصنيف المختار غير صالح' })
  }

  const slug = await generateUniqueSlug(title)
  const status = body.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED'
  const isFeatured = isStaff && Boolean(body.isFeatured)
  const isBreaking = isStaff && Boolean(body.isBreaking)

  const article = await db.$transaction(async (tx) => {
    if (isFeatured) {
      await tx.article.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } })
    }

    return tx.article.create({
      data: {
        slug,
        title,
        lead,
        content,
        pullQuote: body.pullQuote?.trim() || null,
        pullQuoteAuthor: body.pullQuoteAuthor?.trim() || null,
        heroImage: body.heroImage?.trim() || DEFAULT_COVER,
        imageCaption: body.imageCaption?.trim() || null,
        readTimeMinutes: estimateReadTime(content),
        status,
        isFeatured,
        isBreaking,
        tags: body.tags?.trim() || category.nameAr,
        authorId: user.id,
        categoryId: category.id,
        publishedAt: new Date()
      },
      include: articleWithRelations
    })
  })

  return { article }
})
