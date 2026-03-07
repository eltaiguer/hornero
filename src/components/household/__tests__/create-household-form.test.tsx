import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateHouseholdForm } from '../create-household-form'

const mockOnSubmit = vi.fn()

describe('CreateHouseholdForm', () => {
  beforeEach(() => {
    mockOnSubmit.mockReset()
  })

  it('should render name and currency fields', () => {
    render(<CreateHouseholdForm onSubmit={mockOnSubmit} />)
    expect(screen.getByLabelText(/household name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('should call onSubmit with form data', async () => {
    const user = userEvent.setup()
    render(<CreateHouseholdForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/household name/i), 'My Family')
    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Family' })
    )
  })

  it('should show error when name is empty', async () => {
    const user = userEvent.setup()
    render(<CreateHouseholdForm onSubmit={mockOnSubmit} />)

    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})
