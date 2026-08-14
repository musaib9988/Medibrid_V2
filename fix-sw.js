import fs from 'fs';
let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes('serviceWorker')) {
  code = code.replace(
    "import './index.css';",
    `import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}`
  );
  fs.writeFileSync('src/main.tsx', code);
}
