import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { requireAuth } from '~/server/utils/auth'
import { enforceRateLimit } from '~/server/utils/rateLimit'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

const MAX_BYTES = 5 * 1024 * 1024

function detectImageSignature(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png'
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'webp'
  }
  return null
}

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  enforceRateLimit(event, 'upload', 20, 10 * 60 * 1000)

  const form = await readMultipartFormData(event)
  const filePart = form?.find((item) => item.name === 'file' && item.data)

  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'لم يتم إرفاق صورة' })
  }

  const declaredExt = filePart.type ? ALLOWED_TYPES[filePart.type] : undefined
  const detectedExt = detectImageSignature(filePart.data)
  if (!declaredExt || !detectedExt) {
    throw createError({ statusCode: 400, statusMessage: 'الملف غير صالح — الصيغ المدعومة هي JPG أو PNG أو WebP فقط' })
  }

  if (filePart.data.length > MAX_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'الحد الأقصى لحجم الصورة 5 ميغابايت' })
  }

  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${detectedExt}`
  await writeFile(join(uploadsDir, filename), filePart.data)

  return { url: `/uploads/${filename}` }
})
