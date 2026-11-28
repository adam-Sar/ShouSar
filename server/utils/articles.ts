import { unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { db } from './db'

export const publicAuthorSelect = {
  id: true,
  name: true,
  username: true,
  role: true,
  roleTitle: true,
  bio: true,
  avatarUrl: true
} as const

export const articleWithRelations = {
  author: { select: publicAuthorSelect },
  category: {
    select: {
      id: true,
      slug: true,
      nameAr: true,
      accent: true
    }
  },
  _count: {
    select: { comments: true, reactions: true }
  }
} as const

// Omit large article bodies when rendering lists/cards
export const articleCardSelect = {
  id: true,
  slug: true,
  title: true,
  lead: true,
  pullQuote: true,
  pullQuoteAuthor: true,
  heroImage: true,
  imageCaption: true,
  readTimeMinutes: true,
  status: true,
  isFeatured: true,
  isBreaking: true,
  tags: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  ...articleWithRelations
} as const

export function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 160))
}

export function isSafeMediaUrl(url: string): boolean {
  const trimmed = url.trim()
  if (trimmed.startsWith('/uploads/')) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export interface ArticleValidationInput {
  title?: string
  lead?: string
  content?: string
  categoryId?: string
  heroImage?: string
  imageCaption?: string
  pullQuote?: string
  pullQuoteAuthor?: string
  tags?: string
}

export function validateArticleInput(body: ArticleValidationInput, partial = false) {
  if (!partial || body.title !== undefined) {
    const title = body.title?.trim() || ''
    if (title.length < 5 || title.length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'العنوان يجب أن يكون بين 5 و 200 حرف' })
    }
  }
  if (!partial || body.lead !== undefined) {
    const lead = body.lead?.trim() || ''
    if (lead.length < 10 || lead.length > 600) {
      throw createError({ statusCode: 400, statusMessage: 'المقدمة يجب أن تكون بين 10 و 600 حرف' })
    }
  }
  if (!partial || body.content !== undefined) {
    const content = body.content?.trim() || ''
    if (content.length < 20 || content.length > 50000) {
      throw createError({ statusCode: 400, statusMessage: 'نص المقال يجب أن يكون بين 20 و 50,000 حرف' })
    }
  }
  if (body.heroImage !== undefined && body.heroImage.trim() && !isSafeMediaUrl(body.heroImage)) {
    throw createError({ statusCode: 400, statusMessage: 'رابط الصورة غير صالح' })
  }
  if (body.imageCaption && body.imageCaption.trim().length > 300) {
    throw createError({ statusCode: 400, statusMessage: 'وصف الصورة طويل جداً' })
  }
  if (body.pullQuote && body.pullQuote.trim().length > 600) {
    throw createError({ statusCode: 400, statusMessage: 'الاقتباس طويل جداً' })
  }
  if (body.pullQuoteAuthor && body.pullQuoteAuthor.trim().length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'اسم قائل الاقتباس طويل جداً' })
  }
  if (body.tags && body.tags.trim().length > 250) {
    throw createError({ statusCode: 400, statusMessage: 'الوسوم طويلة جداً' })
  }
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const cleaned = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

  const base = cleaned || `story-${Date.now()}`
  const existing = await db.article.findUnique({ where: { slug: base }, select: { id: true } })
  if (!existing) return base

  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export async function deleteLocalUploadIfUnused(url: string | null | undefined) {
  if (!url || !url.startsWith('/uploads/')) return
  const filename = basename(url)
  if (!filename || filename === '.gitkeep') return

  const cleanUrl = `/uploads/${filename}`
  const [articleCount, userCount] = await Promise.all([
    db.article.count({
      where: {
        OR: [{ heroImage: cleanUrl }, { content: { contains: cleanUrl } }]
      }
    }),
    db.user.count({ where: { avatarUrl: cleanUrl } })
  ])

  if (articleCount === 0 && userCount === 0) {
    await unlink(join(process.cwd(), 'public', 'uploads', filename)).catch(() => {})
  }
}
