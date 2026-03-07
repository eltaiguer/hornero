import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BalanceCard } from '../balance-card'

describe('BalanceCard', () => {
  it('renders positive and negative balances', () => {
    render(<BalanceCard name="Alex" balance={42.5} />)
    expect(screen.getByText(/alex/i)).toBeInTheDocument()
    expect(screen.getByText(/\$42\.50/)).toBeInTheDocument()
  })
})
