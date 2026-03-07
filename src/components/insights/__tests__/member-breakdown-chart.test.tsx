import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemberBreakdownChart } from '../member-breakdown-chart'

describe('MemberBreakdownChart', () => {
  it('renders member rows', () => {
    render(<MemberBreakdownChart data={[{ userId: 'u1', name: 'Alex', amount: 200 }]} />)

    expect(screen.getByText(/alex/i)).toBeInTheDocument()
  })
})
