import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettleUpForm } from '../settle-up-form'

describe('SettleUpForm', () => {
  it('submits settlement input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <SettleUpForm
        receiverId="u2"
        receiverName="Alex"
        defaultAmount={25}
        onSubmit={onSubmit}
      />
    )

    await user.clear(screen.getByLabelText(/amount/i))
    await user.type(screen.getByLabelText(/amount/i), '25')
    await user.click(screen.getByRole('button', { name: /record payment/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ receiverId: 'u2', amount: 25 }))
  })
})
