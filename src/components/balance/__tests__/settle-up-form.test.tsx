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
        members={[{ id: 'u2', name: 'Alex' }]}
        onSubmit={onSubmit}
      />
    )

    await user.selectOptions(screen.getByLabelText(/receiver/i), 'u2')
    await user.type(screen.getByLabelText(/amount/i), '25')
    await user.click(screen.getByRole('button', { name: /record payment/i }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ receiverId: 'u2', amount: 25 }))
  })
})
