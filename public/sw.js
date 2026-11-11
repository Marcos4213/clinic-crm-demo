self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const path = new URL(event.request.url).pathname
  if (/\.(mp3|m4a|ogg)$/i.test(path)) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }))
    return
  }
  event.respondWith(fetch(event.request))
})
