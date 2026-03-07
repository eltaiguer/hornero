import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import path from 'path'

let testPrisma: PrismaClient

const TEST_DB_URL = 'file:./prisma/test.db'
const TEST_DB_PATH = path.join(process.cwd(), 'prisma', 'test.db')
const TEST_CACHE_PATH = path.join(process.cwd(), '.cache')

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    // Prisma v7 reads datasource URL from env, not constructor args
    process.env.DATABASE_URL = TEST_DB_URL
    testPrisma = new PrismaClient()
  }
  return testPrisma
}

export async function resetTestDatabase(): Promise<void> {
  if (existsSync(TEST_DB_PATH)) {
    unlinkSync(TEST_DB_PATH)
  }
  mkdirSync(TEST_CACHE_PATH, { recursive: true })

  execSync('npx prisma db push --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      XDG_CACHE_HOME: TEST_CACHE_PATH,
      HOME: process.cwd(),
    },
    stdio: 'pipe',
  })
}

export async function disconnectTestDatabase(): Promise<void> {
  await testPrisma?.$disconnect()
}
