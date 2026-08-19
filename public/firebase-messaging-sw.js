/* eslint-disable no-undef */
// MediBrid Unified Progressive Web App & Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// 1. Initialize Firebase inside Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyBJ2PSl0iCwyFgpW5WLkgmJffOikRZfCLI",
  authDomain: "musaib0.firebaseapp.com",
  projectId: "musaib0",
  storageBucket: "musaib0.firebasestorage.app",
  messagingSenderId: "813318556366",
  appId: "1:813318556366:web:ad9e458eeb2ca93c2f9e9f"
});

const messaging = firebase.messaging();

// 2. Handle Firebase Background Messages (when App is closed or minimized)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Firebase background message received:', payload);
  
  const notificationTitle = payload?.notification?.title || payload?.data?.title || 'MediBrid Update';
  const notificationBody = payload?.notification?.body || payload?.data?.body || 'You have a new update from MediBrid.';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    image: payload?.notification?.image || payload?.data?.image,
    vibrate: [200, 100, 200, 100, 200],
    tag: payload?.data?.tag || `medibrid-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload?.data?.url || payload?.fcmOptions?.link || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open_app', title: 'Open MediBrid' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 3. Fallback Raw Web Push Event Listener (Catches direct WebPush / VAPID / FCM direct pushes)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);
  
  let data = {
    title: 'MediBrid Healthcare',
    body: 'New notification from MediBrid',
    url: '/'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data.title = parsed.title || parsed.notification?.title || parsed.data?.title || data.title;
      data.body = parsed.body || parsed.notification?.body || parsed.data?.body || data.body;
      data.url = parsed.url || parsed.data?.url || parsed.fcmOptions?.link || data.url;
      data.image = parsed.image || parsed.notification?.image || parsed.data?.image;
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    image: data.image,
    vibrate: [200, 100, 200, 100, 200],
    tag: `medibrid-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url,
      timestamp: Date.now()
    },
    actions: [
      { action: 'open_app', title: 'View Details' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 4. Notification Click Listener - Brings App to front or opens target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // If closed, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 5. PWA Lifecycle & Cache Management
const CACHE_NAME = 'medibrid-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET and API / Firebase Firestore requests directly to network
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('fcm.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
