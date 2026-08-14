import fs from 'fs';
let code = fs.readFileSync('src/components/AuthLoginModal.tsx', 'utf8');
code = code.replace(
  "setError('Network Error: Please check your internet connection or disable ad-blockers/VPNs.');",
  "setError('Network Error: Try turning off Ad-blocker/VPN. If you are the admin, check if your Firebase API Key is restricted in Google Cloud Console (' + err.message + ')');"
);
fs.writeFileSync('src/components/AuthLoginModal.tsx', code);
