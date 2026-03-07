import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetProgressBar } from '../budget-progress-bar'

describe('BudgetProgressBar', () => {
  it('renders budget progress text', () => {
    render(<BudgetProgressBar categoryName="Groceries" budgetAmount={500} actualSpent={320} percentage={64} />)

    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
    expect(screen.getByText(/\$320\.00 of \$500\.00 spent/i)).toBeInTheDocument()
    expect(screen.getByText(/64%/)).toBeInTheDocument()
  })
})
