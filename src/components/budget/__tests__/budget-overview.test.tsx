import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetOverview } from '../budget-overview'

describe('BudgetOverview', () => {
  it('renders progress items', () => {
    render(
      <BudgetOverview
        items={[{ budgetId: 'b-1', categoryId: 'cat-1', categoryName: 'Groceries', budgetAmount: 500, actualSpent: 320, percentage: 64 }]}
      />
    )

    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
  })

  it('shows actionable empty-state CTA when household context is available', () => {
    render(<BudgetOverview items={[]} householdId="hh-1" month={3} year={2026} />)

    expect(screen.getByText(/no budgets set for this month/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /set your first budget/i })).toHaveAttribute(
      'href',
      '/household/budgets?householdId=hh-1&month=3&year=2026#budget-form'
    )
  })
})
