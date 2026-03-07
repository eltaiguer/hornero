import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SalaryInput } from '../salary-input'

describe('SalaryInput', () => {
  it('should render with current salary value', () => {
    render(<SalaryInput currentSalary={5000} onSave={vi.fn()} currency="USD" />)
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument()
  })

  it('should render empty when salary is null', () => {
    render(<SalaryInput currentSalary={null} onSave={vi.fn()} currency="USD" />)
    expect(screen.getByPlaceholderText(/enter.*salary/i)).toBeInTheDocument()
  })

  it('should call onSave with numeric value', async () => {
    const onSave = vi.fn()
    const user = userEvent.setup()
    render(<SalaryInput currentSalary={null} onSave={onSave} currency="USD" />)

    await user.type(screen.getByRole('spinbutton'), '6500')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(onSave).toHaveBeenCalledWith(6500, expect.any(String))
  })

  it('should display currency label', () => {
    render(<SalaryInput currentSalary={5000} onSave={vi.fn()} currency="EUR" />)
    expect(screen.getByText('EUR')).toBeInTheDocument()
  })
})
