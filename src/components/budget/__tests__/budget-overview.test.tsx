import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetOverview } from '../budget-overview'

describe('BudgetOverview', () => {
  it('renders progress items', () => {
    render(
      <BudgetOverview
        items={[{ categoryId: 'cat-1', categoryName: 'Groceries', budgetAmount: 500, actualSpent: 320, percentage: 64 }]}
      />
    )

    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
  })
})
