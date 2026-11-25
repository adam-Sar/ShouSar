import { db } from '~/server/utils/db'
import { verifyPassword, setSessionCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password || ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' })
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: 'بيانات الدخول غير صحيحة' })
  }

  await setSessionCookie(event, user.id)

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      bio: user.bio,
      roleTitle: user.roleTitle,
      avatarUrl: user.avatarUrl
    }
  }
})
