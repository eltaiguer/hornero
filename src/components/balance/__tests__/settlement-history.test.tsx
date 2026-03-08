import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettlementHistory } from '../settlement-history'

describe('SettlementHistory', () => {
  it('renders settlement list', () => {
    render(
      <SettlementHistory
        items={[
          { id: 'st-1', payer: { name: 'Sam' }, receiver: { name: 'Alex' }, amount: 20, date: '2026-03-01' },
        ]}
      />
    )

    expect(screen.getByText(/sam/i)).toBeInTheDocument()
    expect(screen.getByText(/alex/i)).toBeInTheDocument()
    expect(screen.getByText(/\$20\.00/)).toBeInTheDocument()
  })
})
