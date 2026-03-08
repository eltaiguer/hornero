const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const shortMonthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`
}

export function formatDateForInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatShortDateLabel(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  return shortMonthDayFormatter.format(date)
}

export function formatMonthYear(value: Date) {
  return monthYearFormatter.format(value)
}

export function formatRelativeExpenseDate(value: Date | string, now = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value
  const item = new Date(date)
  item.setHours(0, 0, 0, 0)

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.round((today.getTime() - item.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (item.getFullYear() === today.getFullYear()) return shortMonthDayFormatter.format(item)
  return longDateFormatter.format(item)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
