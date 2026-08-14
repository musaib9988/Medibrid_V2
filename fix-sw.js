import fs from 'fs';

// 1. Update SW
let sw = fs.readFileSync('public/firebase-messaging-sw.js', 'utf8');
sw = sw.replace(
  '    body: payload?.notification?.body,',
  `    body: payload?.notification?.body,
    icon: '/icon.svg',
    badge: '/icon.svg', // Small monochrome icon for the status bar
    vibrate: [200, 100, 200]`
);
fs.writeFileSync('public/firebase-messaging-sw.js', sw);

// 2. Update server.ts
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(
  '              notification: { title, body, sound: "default" },',
  '              notification: { title, body, sound: "default", icon: "/icon.svg" },'
);
fs.writeFileSync('server.ts', server);

// 3. Update AppContext.tsx
let appCtx = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
appCtx = appCtx.replace(
  /icon: '\/favicon.ico'/g,
  "icon: '/icon.svg', badge: '/icon.svg', vibrate: [200, 100, 200]"
);
fs.writeFileSync('src/context/AppContext.tsx', appCtx);
