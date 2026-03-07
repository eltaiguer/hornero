import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetAlert } from '../budget-alert'

describe('BudgetAlert', () => {
  it('renders warning alerts', () => {
    render(<BudgetAlert alerts={[{ categoryName: 'Groceries', percentage: 90, level: 'warning' }]} />)

    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
    expect(screen.getByText(/90%/)).toBeInTheDocument()
  })
})
