import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  sqliteConfigured?: boolean
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

if (!globalForPrisma.sqliteConfigured && (process.env.DATABASE_URL || '').startsWith('file:')) {
  globalForPrisma.sqliteConfigured = true
  // WAL mode prevents concurrent read/write lock contention in SQLite
  db.$executeRawUnsafe('PRAGMA journal_mode = WAL;').catch(() => {})
  db.$executeRawUnsafe('PRAGMA busy_timeout = 5000;').catch(() => {})
}
