import { Suspense } from 'react'
import { MobileBottomNav } from '@/components/navigation/mobile-bottom-nav'
import { QuickAddFab } from '@/components/navigation/quick-add-fab'

export const preferredRegion = 'gru1'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="pb-20 md:pb-6">{children}</div>
      <Suspense fallback={null}>
        <QuickAddFab />
      </Suspense>
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </>
  )
}
