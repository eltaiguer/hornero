import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpendingTrendChart } from '../spending-trend-chart'

describe('SpendingTrendChart', () => {
  it('renders trend rows', () => {
    render(<SpendingTrendChart data={[{ month: '2026-03', total: 500 }]} />)

    expect(screen.getByText(/2026-03/)).toBeInTheDocument()
    expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
  })
})
