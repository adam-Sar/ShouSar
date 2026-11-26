import { db } from '~/server/utils/db'
import { hashPassword, requireAuth, verifyPassword } from '~/server/utils/auth'
import { deleteLocalUploadIfUnused, isSafeMediaUrl } from '~/server/utils/articles'

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAuth(event)

  const body = await readBody<{
    name?: string
    roleTitle?: string
    bio?: string
    avatarUrl?: string
    currentPassword?: string
    newPassword?: string
  }>(event)

  const name = body.name?.trim()
  if (name !== undefined && (name.length < 2 || name.length > 80)) {
    throw createError({ statusCode: 400, statusMessage: 'الاسم يجب أن يكون بين 2 و 80 حرفاً' })
  }
  if (body.roleTitle !== undefined && body.roleTitle.trim().length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'الصفة التحريرية طويلة جداً' })
  }
  if (body.bio !== undefined && body.bio.trim().length > 500) {
    throw createError({ statusCode: 400, statusMessage: 'النبذة التعريفية يجب ألا تتجاوز 500 حرف' })
  }
  if (body.avatarUrl !== undefined && body.avatarUrl.trim() && !isSafeMediaUrl(body.avatarUrl)) {
    throw createError({ statusCode: 400, statusMessage: 'رابط الصورة الشخصية غير صالح' })
  }

  let nextPasswordHash: string | undefined
  if (body.newPassword) {
    if (body.newPassword.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' })
    }
    const existing = await db.user.findUnique({ where: { id: sessionUser.id } })
    if (!existing || !body.currentPassword || !(await verifyPassword(body.currentPassword, existing.passwordHash))) {
      throw createError({ statusCode: 401, statusMessage: 'كلمة المرور الحالية غير صحيحة' })
    }
    nextPasswordHash = await hashPassword(body.newPassword)
  }

  const user = await db.user.update({
    where: { id: sessionUser.id },
    data: {
      name: name || sessionUser.name,
      roleTitle: body.roleTitle !== undefined ? body.roleTitle.trim() || 'كاتب ومساهم' : sessionUser.roleTitle,
      bio: body.bio !== undefined ? body.bio.trim() : sessionUser.bio,
      avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl.trim() || sessionUser.avatarUrl : sessionUser.avatarUrl,
      ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {})
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      bio: true,
      roleTitle: true,
      avatarUrl: true
    }
  })

  if (user.avatarUrl !== sessionUser.avatarUrl) {
    await deleteLocalUploadIfUnused(sessionUser.avatarUrl)
  }

  return { user }
})
