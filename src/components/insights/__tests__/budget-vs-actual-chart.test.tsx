import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetVsActualChart } from '../budget-vs-actual-chart'

describe('BudgetVsActualChart', () => {
  it('renders budget comparison rows', () => {
    render(<BudgetVsActualChart data={[{ category: 'Groceries', budget: 500, actual: 320 }]} />)

    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
    expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$320\.00/)).toBeInTheDocument()
  })
})
