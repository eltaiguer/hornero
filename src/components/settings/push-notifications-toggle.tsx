'use client'

import { useEffect, useMemo, useState } from 'react'

interface PushNotificationsToggleProps {
  householdId: string
}

function base64UrlToUint8Array(base64Url: string) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export function PushNotificationsToggle({ householdId }: PushNotificationsToggleProps) {
  const vapidPublicKey = useMemo(() => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '', [])
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const canUsePush =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setSupported(canUsePush)
    if (!canUsePush) return

    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setEnabled(Boolean(subscription))
      })
      .catch(() => {
        setEnabled(false)
      })
  }, [])

  async function handleToggle(next: boolean) {
    if (!supported || busy) return
    if (!vapidPublicKey) {
      setStatus('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.')
      return
    }

    setBusy(true)
    setStatus('')

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      if (next) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setStatus('Notification permission was denied.')
          setEnabled(false)
          return
        }

        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
          })
        }

        const response = await fetch(`/api/households/${householdId}/notifications/subscriptions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })
        if (!response.ok) {
          throw new Error('Could not register push subscription')
        }

        setEnabled(true)
        setStatus('Notifications enabled.')
        return
      }

      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await fetch(`/api/households/${householdId}/notifications/subscriptions`, {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }

      setEnabled(false)
      setStatus('Notifications disabled.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Notification setup failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Push notifications</p>
          <p className="text-sm text-gray-600">Budget alerts and payment reminders</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            disabled={!supported || busy}
            onChange={(event) => void handleToggle(event.target.checked)}
          />
          <span className="text-sm">{enabled ? 'On' : 'Off'}</span>
        </label>
      </div>
      {!supported && <p className="text-sm text-amber-700">This browser does not support push notifications.</p>}
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  )
}
