import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SplitPreview } from '../split-preview'

describe('SplitPreview', () => {
  it('renders member split rows', () => {
    render(
      <SplitPreview
        splits={[
          { userId: 'u1', name: 'Alex', amountOwed: 60 },
          { userId: 'u2', name: 'Sam', amountOwed: 40 },
        ]}
      />
    )

    expect(screen.getByText(/alex owes \$60\.00/i)).toBeInTheDocument()
    expect(screen.getByText(/sam owes \$40\.00/i)).toBeInTheDocument()
  })
})
