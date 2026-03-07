import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteMemberForm } from '../invite-member-form'

describe('InviteMemberForm', () => {
  it('should render email input and invite button', () => {
    render(<InviteMemberForm onInvite={vi.fn()} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument()
  })

  it('should call onInvite with email', async () => {
    const onInvite = vi.fn()
    const user = userEvent.setup()
    render(<InviteMemberForm onInvite={onInvite} />)

    await user.type(screen.getByLabelText(/email/i), 'friend@example.com')
    await user.click(screen.getByRole('button', { name: /invite/i }))

    expect(onInvite).toHaveBeenCalledWith('friend@example.com')
  })

  it('should show error for invalid email', async () => {
    const user = userEvent.setup()
    render(<InviteMemberForm onInvite={vi.fn()} />)

    await user.type(screen.getByLabelText(/email/i), 'bad-email')
    await user.click(screen.getByRole('button', { name: /invite/i }))

    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
  })

  it('should clear input after successful invite', async () => {
    const onInvite = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<InviteMemberForm onInvite={onInvite} />)

    const input = screen.getByLabelText(/email/i)
    await user.type(input, 'friend@example.com')
    await user.click(screen.getByRole('button', { name: /invite/i }))

    expect(input).toHaveValue('')
  })
})
