import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, '_')
}

type UploadableFile = Blob & { name?: string }

export async function uploadReceipt(expenseId: string, file: UploadableFile) {
  if (!file || file.size === 0) {
    throw new Error('Receipt file is required')
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const originalName = file.name ?? 'upload.bin'
  const extension = path.extname(originalName) || '.bin'
  const filename = `${expenseId}-${Date.now()}-${sanitizeFileName(originalName.replace(extension, ''))}${extension}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const absolutePath = path.join(uploadDir, filename)
  const publicUrl = `/uploads/${filename}`

  await mkdir(uploadDir, { recursive: true })
  await writeFile(absolutePath, bytes)

  return prisma.expense.update({
    where: { id: expenseId },
    data: { receiptUrl: publicUrl },
  })
}

export async function clearReceipt(expenseId: string) {
  return prisma.expense.update({
    where: { id: expenseId },
    data: { receiptUrl: null },
  })
}
