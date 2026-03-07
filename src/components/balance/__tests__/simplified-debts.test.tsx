import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SimplifiedDebts } from '../simplified-debts'

describe('SimplifiedDebts', () => {
  it('renders debt instructions', () => {
    render(
      <SimplifiedDebts
        debts={[{ fromName: 'Sam', toName: 'Alex', amount: 30 }]}
      />
    )

    expect(screen.getByText(/sam pays alex/i)).toBeInTheDocument()
    expect(screen.getByText(/\$30\.00/)).toBeInTheDocument()
  })
})
