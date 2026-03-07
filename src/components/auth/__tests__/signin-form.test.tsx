import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignInForm } from '../signin-form'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

import { signIn } from 'next-auth/react'

describe('SignInForm', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset()
  })

  it('should render email input and submit button', () => {
    render(<SignInForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should call signIn with email when form is submitted', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'user@example.com',
      callbackUrl: '/dashboard',
    })
  })

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<SignInForm />)

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })
})
