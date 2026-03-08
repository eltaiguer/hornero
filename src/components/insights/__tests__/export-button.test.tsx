import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportButton } from '../export-button'

describe('ExportButton', () => {
  it('calls export callback with range', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()

    render(<ExportButton onExport={onExport} />)

    await user.clear(screen.getByLabelText(/from/i))
    await user.type(screen.getByLabelText(/from/i), '2026-03-01')
    await user.clear(screen.getByLabelText(/to/i))
    await user.type(screen.getByLabelText(/to/i), '2026-03-31')
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({ from: '2026-03-01', to: '2026-03-31' })
    )
  })
})
