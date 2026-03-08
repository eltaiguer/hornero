'use client'

import { useState } from 'react'
import type { CreateSettlementInput } from '@/lib/validations/settlement'
import { formatCurrency } from '@/lib/formatting'
import { SettleUpForm } from './settle-up-form'

interface SimplifiedDebtsProps {
  debts: Array<{ fromUserId: string; toUserId: string; fromName: string; toName: string; amount: number }>
  currentUserId: string
  onSettle: (input: CreateSettlementInput) => void | Promise<void>
}

export function SimplifiedDebts({ debts, currentUserId, onSettle }: SimplifiedDebtsProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  if (!debts.length) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center text-green-700 font-medium">
        ✓ Everyone is settled up!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {debts.map((debt, index) => {
        const key = `${debt.fromUserId}-${debt.toUserId}-${index}`
        const canSettle = debt.fromUserId === currentUserId

        return (
          <div key={key} className="space-y-2">
            <div className="rounded-md border p-4 text-center">
              <p className="font-medium">{debt.fromName} → {debt.toName}</p>
              <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(debt.amount)}</p>
              <p className="text-sm text-gray-500">{debt.fromName} pays {debt.toName}</p>
              {canSettle ? (
                <button
                  type="button"
                  onClick={() => setExpandedKey((current) => (current === key ? null : key))}
                  className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Settle Up
                </button>
              ) : null}
            </div>

            {canSettle && expandedKey === key ? (
              <SettleUpForm
                receiverId={debt.toUserId}
                receiverName={debt.toName}
                defaultAmount={debt.amount}
                onSubmit={onSettle}
                onCancel={() => setExpandedKey(null)}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
