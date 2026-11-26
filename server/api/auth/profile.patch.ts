import { db } from '~/server/utils/db'
import { hashPassword, requireAuth, verifyPassword } from '~/server/utils/auth'

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
  if (name !== undefined && name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'الاسم يجب أن يكون حرفين على الأقل' })
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

  return { user }
})
