import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert import
code = code.replace(
  "import { NotificationToast } from './components/NotificationToast';",
  "import { NotificationToast } from './components/NotificationToast';\nimport { InstallPWA } from './components/InstallPWA';"
);

// Insert <InstallPWA />
code = code.replace(
  "      {(!role || role === 'user') && <MediBot />}\n    </div>",
  "      {(!role || role === 'user') && <MediBot />}\n      <InstallPWA />\n    </div>"
);

fs.writeFileSync('src/App.tsx', code);
