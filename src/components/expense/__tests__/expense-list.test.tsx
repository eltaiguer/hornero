import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpenseList } from '../expense-list'

describe('ExpenseList', () => {
  it('renders expense rows', () => {
    render(
      <ExpenseList
        expenses={[
          {
            id: 'exp-1',
            description: 'Groceries',
            amount: 120,
            date: '2026-03-01T00:00:00.000Z',
            category: { name: 'Groceries', emoji: '🛒' },
            payer: { name: 'Alex' },
          },
        ]}
      />
    )

    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
    expect(screen.getByText(/\$120\.00/)).toBeInTheDocument()
    expect(screen.getByText(/paid by alex/i)).toBeInTheDocument()
  })
})
