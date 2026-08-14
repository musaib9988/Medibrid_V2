import fs from 'fs';

let code = fs.readFileSync('src/main.tsx', 'utf8');

const importStatement = `import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';\n`;

const pushInit = `
if (Capacitor.isNativePlatform()) {
  PushNotifications.requestPermissions().then(result => {
    if (result.receive === 'granted') {
      PushNotifications.register();
    }
  });

  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received: ', notification);
  });
}
`;

code = importStatement + code;
code = code.replace(
  "createRoot(document.getElementById('root')!).render(",
  pushInit + "\ncreateRoot(document.getElementById('root')!).render("
);

fs.writeFileSync('src/main.tsx', code);
