self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Hornero', body: event.data.text() }
  }

  const title = payload.title || 'Hornero'
  const options = {
    body: payload.body || '',
    data: payload.data || {},
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const householdId = event.notification?.data?.householdId
  const targetUrl = householdId ? `/household?householdId=${householdId}` : '/household'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})

self.addEventListener('fetch', () => {
  // Intentionally empty for now.
})
