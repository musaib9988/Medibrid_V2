import fs from 'fs';
let code = fs.readFileSync('src/components/AuthLoginModal.tsx', 'utf8');

code = code.replace(
  "if (err.code === 'auth/network-request-failed') {",
  `if (err.code === 'auth/network-request-failed') {
        const inIframe = window.self !== window.top;
        if (inIframe) {
          setError('⚠️ Browser Privacy Block: Please click the "Open in new tab" icon (top right arrow ↗️) to use this app. Your browser blocks login inside this preview frame.');
          return;
        }`
);

fs.writeFileSync('src/components/AuthLoginModal.tsx', code);
