import { db } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const categories = await db.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: {
          articles: { where: { status: 'PUBLISHED' } }
        }
      }
    }
  })

  return { categories }
})
