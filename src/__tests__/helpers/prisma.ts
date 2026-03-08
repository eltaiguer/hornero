import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

let testPrisma: PrismaClient | undefined
let migrationsApplied = false

const APP_TABLES = [
  'notification_dispatches',
  'push_subscriptions',
  'recurring_expenses',
  'budgets',
  'settlements',
  'expense_splits',
  'expenses',
  'categories',
  'household_invites',
  'member_salary_history',
  'household_members',
  'households',
  'verification_tokens',
  'sessions',
  'accounts',
  'users',
]

function getTestDatabaseUrl() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error(
      'Integration tests require TEST_DATABASE_URL pointing to a dedicated Postgres test database.'
    )
  }
  return url
}

function getTestDirectUrl() {
  return process.env.TEST_DIRECT_URL ?? process.env.DIRECT_URL ?? getTestDatabaseUrl()
}

function getPrismaEnv() {
  const dbUrl = getTestDatabaseUrl()
  const directUrl = getTestDirectUrl()
  return {
    ...process.env,
    DATABASE_URL: dbUrl,
    DIRECT_URL: directUrl,
  }
}

function applyMigrationsOnce() {
  if (migrationsApplied) return

  execSync('npx prisma migrate deploy', {
    env: getPrismaEnv(),
    stdio: 'pipe',
  })
  migrationsApplied = true
}

async function truncateAllTables(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${APP_TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`
  )
}

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    process.env.DATABASE_URL = getTestDatabaseUrl()
    process.env.DIRECT_URL = getTestDirectUrl()
    testPrisma = new PrismaClient()
  }
  return testPrisma
}

export async function resetTestDatabase(): Promise<void> {
  applyMigrationsOnce()
  const prisma = getTestPrisma()
  await truncateAllTables(prisma)
}

export async function disconnectTestDatabase(): Promise<void> {
  await testPrisma?.$disconnect()
}
