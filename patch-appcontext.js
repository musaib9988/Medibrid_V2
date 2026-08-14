import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. We need a ref or state outside the snapshot to remember previous lastMessageTime.
// Since AppContext is a functional component, we can use a ref.

const importLine = "import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';";
if (content.includes("import { createContext, useContext, useState, useEffect, ReactNode }")) {
    content = content.replace("import { createContext, useContext, useState, useEffect, ReactNode }", importLine);
}

// 2. Add a ref to track the last known chat update times
const refAddition = `
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
  };
`;

if (!content.includes('prevChatsRef')) {
    content = content.replace("const [notification, setNotification] = useState<{ id: string; title: string; body: string } | null>(null);", "const [notification, setNotification] = useState<{ id: string; title: string; body: string } | null>(null);\n" + refAddition);
}

// 3. Update the chat snapshot handler
const chatQueryReplacement = `
        const chatQuery = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
        unsubChats = attachSafeSnapshot(chatQuery, (snapshot: any) => {
          const fetchedChats = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Chat));
          
          // Check for new unread messages
          fetchedChats.forEach((chat: Chat) => {
            const prevTime = prevChatsRef.current[chat.id];
            // If we have seen this chat before, and the time changed, and it's not read by us
            if (prevTime && prevTime !== chat.lastMessageTime && chat.lastMessage && !(chat.readBy || []).includes(userId)) {
              const otherName = (userRole === 'clinic_owner' ? chat.patientName : chat.clinicName) || 'User';
              
              // Only show OS notification if app is in background or we are not in that chat
              if (document.visibilityState === 'hidden') {
                showBackgroundNotification(otherName, chat.lastMessage, '/');
              } else {
                // We are in the app, maybe show in-app toast
                setNotification({
                  id: Date.now().toString(),
                  title: \`New message from \${otherName}\`,
                  body: chat.lastMessage
                });
              }
            }
            prevChatsRef.current[chat.id] = chat.lastMessageTime;
          });

          setChats(fetchedChats);
        }, "Chats");
`;

content = content.replace(
    /const chatQuery = query\(collection\(db, 'chats'\).*setChats\(fetchedChats\);\s*\}, "Chats"\);/s,
    chatQueryReplacement
);

fs.writeFileSync('src/context/AppContext.tsx', content);
