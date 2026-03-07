import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'

describe('PWA manifest', () => {
  it('contains required fields', () => {
    const raw = readFileSync('public/manifest.json', 'utf-8')
    const manifest = JSON.parse(raw)

    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.display).toBe('standalone')
    expect(Array.isArray(manifest.icons)).toBe(true)
  })
})
