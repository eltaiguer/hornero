import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryDonutChart } from '../category-donut-chart'

describe('CategoryDonutChart', () => {
  it('renders fallback list entries', () => {
    render(<CategoryDonutChart data={[{ category: 'Groceries', amount: 300, percentage: 75 }]} />)

    expect(screen.getByText(/groceries/i)).toBeInTheDocument()
  })
})
