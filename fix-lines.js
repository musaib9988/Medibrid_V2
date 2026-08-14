import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const replacement = `  const showBackgroundNotification = async (title: string, body: string, url: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, {
            body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            data: { url }
          });
        } catch(e) {
          console.error("SW notification error", e);
        }
      } else {
        new Notification(title, { body, icon: '/icon-192.svg' } as any);
      }
    }
  };

  const triggerPushNotificationUI = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, { body, icon: '/icon.svg', badge: '/icon.svg' });
          }).catch((err) => {
            new Notification(title, { body, icon: '/icon.svg', badge: '/icon.svg' } as any);
          });
        } else {
          new Notification(title, { body, icon: '/icon.svg', badge: '/icon.svg' } as any);
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

// replace from `const showBackgroundNotification` to `}, 6000);\n  };`
content = content.replace(/const showBackgroundNotification = async.*setTimeout\(\(\) => \{\s*setActiveNotificationToast\(null\);\s*\}, 6000\);\s*\};/s, replacement);

fs.writeFileSync('src/context/AppContext.tsx', content);

