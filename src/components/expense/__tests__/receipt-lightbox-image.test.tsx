import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReceiptLightboxImage } from '../receipt-lightbox-image'

describe('ReceiptLightboxImage', () => {
  it('opens and closes lightbox', async () => {
    const user = userEvent.setup()

    render(<ReceiptLightboxImage src="/uploads/test.jpg" alt="Receipt" />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByAltText('Receipt full size')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByAltText('Receipt full size')).not.toBeInTheDocument()
  })
})
