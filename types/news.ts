export interface PublicAuthor {
  id: string
  name: string
  username: string
  role: string
  roleTitle?: string | null
  bio?: string | null
  avatarUrl?: string | null
}

export interface CategoryItem {
  id: string
  slug: string
  nameAr: string
  accent: string
  order?: number
  _count?: { articles: number }
}

export interface ArticleComment {
  id: string
  body: string
  createdAt: string
  author: PublicAuthor
}

export interface ArticleItem {
  id: string
  slug: string
  title: string
  lead: string
  content: string
  pullQuote?: string | null
  pullQuoteAuthor?: string | null
  heroImage: string
  imageCaption?: string | null
  readTimeMinutes: number
  status: 'DRAFT' | 'PUBLISHED'
  isFeatured: boolean
  isBreaking: boolean
  tags: string
  views: number
  createdAt: string
  updatedAt: string
  publishedAt: string
  author: PublicAuthor
  category: CategoryItem
  _count?: { comments: number; reactions?: number }
  comments?: ArticleComment[]
  userReacted?: boolean
  userBookmarked?: boolean
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

export interface LiveUpdateItem {
  id: string
  title: string
  summary?: string | null
  linkSlug?: string | null
  isUrgent: boolean
  createdAt: string
}
