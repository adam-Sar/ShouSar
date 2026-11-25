import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { requireAuth } from '~/server/utils/auth'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

const MAX_BYTES = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const form = await readMultipartFormData(event)
  const filePart = form?.find((item) => item.name === 'file' && item.data)

  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'لم يتم إرفاق صورة' })
  }

  const ext = filePart.type ? ALLOWED_TYPES[filePart.type] : undefined
  if (!ext) {
    throw createError({ statusCode: 400, statusMessage: 'الصيغ المدعومة هي JPG أو PNG أو WebP فقط' })
  }

  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'الحد الأقصى لحجم الصورة 5 ميغابايت' })
  }

  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  await writeFile(join(uploadsDir, filename), filePart.data)

  return { url: `/uploads/${filename}` }
})
