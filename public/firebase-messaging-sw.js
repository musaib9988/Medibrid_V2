/* eslint-disable no-undef */
// MediBrid Unified Progressive Web App & Firebase Cloud Messaging Service Worker
// Handles background push events, data payload processing, and offline state when app is closed or terminated.

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// 1. Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyBJ2PSl0iCwyFgpW5WLkgmJffOikRZfCLI",
  authDomain: "musaib0.firebaseapp.com",
  projectId: "musaib0",
  storageBucket: "musaib0.firebasestorage.app",
  messagingSenderId: "813318556366",
  appId: "1:813318556366:web:ad9e458eeb2ca93c2f9e9f"
});

const messaging = firebase.messaging();

// 2. Persistent IndexedDB Storage for Background Notifications
const DB_NAME = 'medibrid_notifications_db';
const DB_VERSION = 1;
const STORE_NAME = 'background_notifications';

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveNotificationToDB(notificationItem) {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(notificationItem);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[SW DB] Could not persist notification to IndexedDB:', err);
    return false;
  }
}

// 3. Helper to format notification options from FCM payload
function buildNotificationFromPayload(payload) {
  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = notification.title || data.title || data.heading || 'MediBrid Healthcare Update';
  const body = notification.body || data.body || data.message || 'You have a new update regarding your appointment or clinic.';
  const icon = notification.icon || data.icon || '/icon-192.png';
  const badge = notification.badge || data.badge || '/icon-192.png';
  const image = notification.image || data.image || data.imageUrl || null;
  const tag = data.tag || data.appointmentId || `medibrid-${Date.now()}`;
  const targetUrl = data.url || data.link || data.click_action || '/';

  const notificationOptions = {
    body,
    icon,
    badge,
    image: image || undefined,
    tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: targetUrl,
      rawPayload: data,
      receivedAt: Date.now()
    },
    actions: [
      { action: 'open_app', title: 'Open MediBrid' }
    ]
  };

  return { title, options: notificationOptions, dataPayload: data };
}

// 4. Handle Firebase Background Messages (when app is minimized, terminated or closed)
messaging.onBackgroundMessage(async (payload) => {
  console.log('[SW FCM] Background message received:', payload);
  
  const { title, options, dataPayload } = buildNotificationFromPayload(payload);

  // Persistently save payload to IndexedDB so app can read it when launched
  await saveNotificationToDB({
    id: options.tag || `fcm-${Date.now()}`,
    title,
    body: options.body,
    data: dataPayload,
    receivedAt: Date.now(),
    read: false
  });

  return self.registration.showNotification(title, options);
});

// 5. Direct WebPush / VAPID Push Event Fallback (Handles direct Push Events & Raw Data Payloads)
self.addEventListener('push', (event) => {
  console.log('[SW Push] Raw push event received:', event);

  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        notification: {
          title: 'MediBrid Alert',
          body: event.data.text() || 'New healthcare notification received.'
        }
      };
    }
  }

  const { title, options, dataPayload } = buildNotificationFromPayload(payload);

  const processAndShow = async () => {
    await saveNotificationToDB({
      id: options.tag || `push-${Date.now()}`,
      title,
      body: options.body,
      data: dataPayload,
      receivedAt: Date.now(),
      read: false
    });

    return self.registration.showNotification(title, options);
  };

  event.waitUntil(processAndShow());
});

// 6. Handle Notification Click (Terminated / Background App Launch & Window Focus)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window client is already open, focus it and route
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data
            });
            return client.focus();
          }
        }
      }
      // If terminated/closed, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 7. Communication Channel with Foreground React App
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'GET_BACKGROUND_NOTIFICATIONS') {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        event.ports[0].postMessage({ status: 'ok', notifications: req.result || [] });
      };
    } catch (e) {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ status: 'error', error: e.message });
      }
    }
  }
});

// 8. Service Worker Lifecycle & Offline Asset Caching
const CACHE_NAME = 'medibrid-cache-v3';
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
