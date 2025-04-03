import { PrismaClient } from '@prisma/client'

// Подход рекомендованный Prisma для использования с Next.js 
// для предотвращения создания множества подключений при разработке
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
} 