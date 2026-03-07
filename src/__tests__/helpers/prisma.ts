import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import path from 'path'

let testPrisma: PrismaClient

const TEST_DB_URL = `file:${path.join(process.cwd(), 'prisma', 'test.db')}`

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    // Prisma v7 reads datasource URL from env, not constructor args
    process.env.DATABASE_URL = TEST_DB_URL
    testPrisma = new PrismaClient()
  }
  return testPrisma
}

export async function resetTestDatabase(): Promise<void> {
  execSync('npx prisma db push --force-reset --accept-data-loss', {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
    },
    stdio: 'pipe',
  })
}

export async function disconnectTestDatabase(): Promise<void> {
  await testPrisma?.$disconnect()
}
