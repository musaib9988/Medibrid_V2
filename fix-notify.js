import fs from 'fs';
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
  `  const triggerPushNotificationUI = (title: string, body: string) => {
    // 1. Show Native Web Push Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.warn("Native Notification popup notice:", e);
      }
    }`,
  `  const triggerPushNotificationUI = (title: string, body: string) => {
    // 1. Show Native Web Push Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, { body, icon: '/favicon.ico' });
          }).catch((err) => {
            new Notification(title, { body, icon: '/favicon.ico' });
          });
        } else {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      } catch (e) {
        console.warn("Native Notification popup notice:", e);
      }
    }`
);

fs.writeFileSync('src/context/AppContext.tsx', code);
