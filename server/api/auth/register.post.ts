import { db } from '~/server/utils/db'
import { hashPassword, setSessionCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    name?: string
    username?: string
    email?: string
    password?: string
    bio?: string
    roleTitle?: string
  }>(event)

  const name = body.name?.trim() || ''
  const rawUsername = (body.username || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
  const email = body.email?.trim().toLowerCase() || ''
  const password = body.password || ''

  if (name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'الاسم مطلوب (حرفان على الأقل)' })
  }
  if (rawUsername.length < 3) {
    throw createError({ statusCode: 400, statusMessage: 'اسم المستخدم يجب أن يكون 3 أحرف إنجليزية على الأقل' })
  }
  if (!email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'البريد الإلكتروني غير صالح' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username: rawUsername }] },
    select: { email: true, username: true }
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: existing.email === email ? 'البريد الإلكتروني مسجل مسبقاً' : 'اسم المستخدم محجوز'
    })
  }

  const passwordHash = await hashPassword(password)
  const user = await db.user.create({
    data: {
      name,
      username: rawUsername,
      email,
      passwordHash,
      role: 'USER',
      roleTitle: body.roleTitle?.trim() || 'كاتب ومساهم',
      bio: body.bio?.trim() || 'كاتب ومساهم في منصة شو صار.',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=008751&color=fff`
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

  await setSessionCookie(event, user.id)
  return { user }
})
