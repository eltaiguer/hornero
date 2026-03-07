import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MonthlySummaryCard } from '../monthly-summary-card'

describe('MonthlySummaryCard', () => {
  it('renders summary values', () => {
    render(<MonthlySummaryCard totalSpent={600} vsLastMonthPct={50} vsBudgetPct={85.7} />)

    expect(screen.getByText(/\$600\.00/)).toBeInTheDocument()
    expect(screen.getByText(/50%/)).toBeInTheDocument()
  })
})
