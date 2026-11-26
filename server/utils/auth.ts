import type { H3Event } from 'h3'
import { randomUUID } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { db } from './db'

const COOKIE_NAME = 'shousar_session'
let devEphemeralSecret: string | null = null

function getSecretKey(event: H3Event) {
  const config = useRuntimeConfig(event)
  const secret = (config.sessionSecret || '').trim()
  if (secret.length >= 32) {
    return new TextEncoder().encode(secret)
  }
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Server misconfiguration: SESSION_SECRET must be at least 32 characters'
    })
  }
  devEphemeralSecret ??= `${randomUUID()}-${randomUUID()}`
  return new TextEncoder().encode(devEphemeralSecret)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function setSessionCookie(event: H3Event, userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey(event))

  const reqProto = getHeader(event, 'x-forwarded-proto') || getRequestURL(event).protocol.replace(':', '')

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: reqProto === 'https'
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecretKey(event))
    const userId = payload.sub
    if (!userId) return null

    return await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        bio: true,
        roleTitle: true,
        avatarUrl: true,
        createdAt: true
      }
    })
  } catch {
    return null
  }
}

export async function requireAuth(event: H3Event) {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'يجب تسجيل الدخول أولاً' })
  }
  return user
}

export async function requireStaff(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
    throw createError({ statusCode: 403, statusMessage: 'صلاحية محرر أو مدير مطلوبة' })
  }
  return user
}
