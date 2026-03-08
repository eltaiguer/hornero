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

    expect(screen.getByText(/alex/i)).toBeInTheDocument()
    expect(screen.getByText(/sam/i)).toBeInTheDocument()
    expect(screen.getByText(/\$60\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$40\.00/)).toBeInTheDocument()
  })
})
