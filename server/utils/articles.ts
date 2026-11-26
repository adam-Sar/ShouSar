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

export function estimateReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 160))
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
