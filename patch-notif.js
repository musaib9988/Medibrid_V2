import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Fix triggerPushNotificationUI to check document.visibilityState
const triggerReplacement = `const triggerPushNotificationUI = (title: string, body: string) => {
    if (document.visibilityState === 'hidden' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
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

// 2. Remove prevChatsRef logic in chatQuery since it's duplicating functionality
const chatQueryClean = `const chatQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
        unsubChats = attachSafeSnapshot(chatQuery, (snapshot: any) => {
          const fetchedChats = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Chat));
          setChats(fetchedChats);
        }, "Chats");`;
content = content.replace(/const chatQuery = query\(collection\(db, 'chats'\)[\s\S]*?\}, "Chats"\);/, chatQueryClean);

// 3. Fix notifQuery to skip initial load
const notifQueryClean = `// Realtime Notifications Listener for All Panels & Roles
        let isInitialNotifLoad = true;
        const notifQuery = query(collection(db, 'notifications'));
        unsubNotifications = attachSafeSnapshot(notifQuery, (snapshot: any) => {
          if (isInitialNotifLoad) {
            isInitialNotifLoad = false;
            return;
          }
          snapshot.docChanges().forEach((change: any) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (data && data.title && data.body) {
                const isForMe = data.targetUserId === userId || data.targetRole === 'all' || (data.targetRole && data.targetRole === userRole);
                if (isForMe) {
                  triggerPushNotificationUI(data.title, data.body);
                }
              }
            }
          });
        }, "Notifications");`;
content = content.replace(/\/\/ Realtime Notifications Listener for All Panels & Roles[\s\S]*?\}, "Notifications"\);/, notifQueryClean);

fs.writeFileSync('src/context/AppContext.tsx', content);
