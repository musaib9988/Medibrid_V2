import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { pushService } from './services/pushNotificationService';

// 1. Initialize Service Worker for Web PWA / Background FCM
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(registration => {
      console.log('[SW] Unified FCM & PWA service worker registered:', registration.scope);
    }).catch(registrationError => {
      console.log('[SW] Registration notice:', registrationError);
    });
  });
}

// 2. Initialize Native Capacitor Push Notifications, channels, and persistent background handlers
pushService.initNativePush();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
