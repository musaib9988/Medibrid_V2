import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

if (!content.includes('Notification.requestPermission()')) {
  content = content.replace(
    /useEffect\(\(\) => \{\s*const checkAuth = async \(\) => \{/,
    "useEffect(() => {\n    if (typeof Notification !== 'undefined' && Notification.permission === 'default') { Notification.requestPermission(); }\n    const checkAuth = async () => {"
  );
  fs.writeFileSync('src/context/AppContext.tsx', content);
}
