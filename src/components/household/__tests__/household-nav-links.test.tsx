import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HouseholdNavLinks } from '../household-nav-links'

describe('HouseholdNavLinks', () => {
  it('renders key household navigation links', () => {
    render(<HouseholdNavLinks householdId="hh-1" />)

    expect(screen.getByRole('link', { name: 'Add expense' })).toHaveAttribute(
      'href',
      '/household/expenses/new?id=hh-1'
    )
    expect(screen.getByRole('link', { name: 'Expenses' })).toHaveAttribute(
      'href',
      '/household/expenses?id=hh-1'
    )
    expect(screen.getByRole('link', { name: 'Recurring' })).toHaveAttribute(
      'href',
      '/household/recurring?id=hh-1'
    )
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute(
      'href',
      '/household/insights?id=hh-1'
    )
  })
})
