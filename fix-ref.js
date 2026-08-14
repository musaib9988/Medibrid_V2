import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

if (!content.includes('import { createContext, useContext, useState, useEffect, ReactNode, useRef }')) {
    content = content.replace(
        "import { createContext, useContext, useState, useEffect, ReactNode }",
        "import { createContext, useContext, useState, useEffect, ReactNode, useRef }"
    );
}

if (!content.includes('prevChatsRef = useRef')) {
    content = content.replace(
        "const [activeNotificationToast, setActiveNotificationToast] = useState<{ id: string; title: string; body: string } | null>(null);",
        `const [activeNotificationToast, setActiveNotificationToast] = useState<{ id: string; title: string; body: string } | null>(null);

  const prevChatsRef = useRef<Record<string, string>>({});

  const showBackgroundNotification = async (title: string, body: string, url: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, {
            body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            vibrate: [200, 100, 200],
            data: { url }
          });
        } catch(e) {
          console.error("SW notification error", e);
        }
      } else {
        new Notification(title, { body, icon: '/icon-192.svg' });
      }
    }
  };`
    );
}

// Fix the setNotification to setActiveNotificationToast in the chat query replacement
content = content.replace(
  /setNotification\(\{/g,
  "setActiveNotificationToast({"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
