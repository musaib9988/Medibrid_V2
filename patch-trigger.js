import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const triggerReplacement = `const triggerPushNotificationUI = (title: string, body: string) => {
    // Show Native Web Push Notification if permission granted and the user is not actively focused on this window
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && !document.hasFocus()) {
      try {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, { body, icon: '/icon-192.svg', badge: '/icon-192.svg' });
          }).catch((err) => {
            new Notification(title, { body, icon: '/icon-192.svg', badge: '/icon-192.svg' } as any);
          });
        } else {
          new Notification(title, { body, icon: '/icon-192.svg', badge: '/icon-192.svg' } as any);
        }
      } catch (e) {
        console.warn("Native Notification popup notice:", e);
      }
    }
    setActiveNotificationToast({ id: Date.now().toString(), title, body });
    setTimeout(() => {
      setActiveNotificationToast(null);
    }, 6000);
  };`;

content = content.replace(/const triggerPushNotificationUI = \(title: string, body: string\) => \{[\s\S]*?\}, 6000\);\n  \};/, triggerReplacement);

fs.writeFileSync('src/context/AppContext.tsx', content);
