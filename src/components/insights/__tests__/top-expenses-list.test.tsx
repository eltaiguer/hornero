import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopExpensesList } from '../top-expenses-list'

describe('TopExpensesList', () => {
  it('renders top expense items', () => {
    render(<TopExpensesList items={[{ id: 'e1', description: 'Rent', amount: 400 }]} />)

    expect(screen.getByText(/rent/i)).toBeInTheDocument()
    expect(screen.getByText(/\$400\.00/)).toBeInTheDocument()
  })
})
