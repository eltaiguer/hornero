import { formatCurrency, formatShortDateLabel } from '@/lib/formatting'

interface SalaryHistoryEntry {
  salary: number | null
  effectiveFrom: Date | string
}

interface MemberWithHistory {
  userId: string
  name: string
  currentSalary: number | null
  history: SalaryHistoryEntry[]
}

interface SalaryHistorySectionProps {
  members: MemberWithHistory[]
}

export function SalaryHistorySection({ members }: SalaryHistorySectionProps) {
  if (members.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Member Salaries</h2>

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.userId} className="rounded-md border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{member.name}</span>
              <span className="text-sm tabular-nums text-gray-700">
                {member.currentSalary != null
                  ? formatCurrency(member.currentSalary)
                  : 'Not set'}
              </span>
            </div>

            {member.history.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  {member.history.length} salary{' '}
                  {member.history.length === 1 ? 'change' : 'changes'}
                </summary>
                <ul className="mt-2 space-y-1">
                  {member.history.map((entry, i) => (
                    <li key={i} className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Effective {formatShortDateLabel(entry.effectiveFrom)}
                      </span>
                      <span className="tabular-nums">
                        {entry.salary != null ? formatCurrency(entry.salary) : 'Removed'}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
