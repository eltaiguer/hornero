import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecurringExpenseList } from '../recurring-expense-list'

describe('RecurringExpenseList', () => {
  it('renders recurring rows', () => {
    render(
      <RecurringExpenseList
        items={[
          {
            id: 'r-1',
            description: 'Rent',
            amount: 100,
            frequency: 'monthly',
            nextDueDate: '2026-03-01T00:00:00.000Z',
            active: true,
          },
        ]}
      />
    )

    expect(screen.getByText(/rent/i)).toBeInTheDocument()
    expect(screen.getByText(/monthly/i)).toBeInTheDocument()
  })
})
