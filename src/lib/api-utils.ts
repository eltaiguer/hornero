/**
 * Utility to create JSON responses compatible with both
 * Next.js runtime and Vitest test environment.
 */
export function jsonResponse(data: unknown, init?: { status?: number }) {
  return Response.json(data, init)
}
