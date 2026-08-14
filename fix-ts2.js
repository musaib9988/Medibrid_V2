import fs from 'fs';
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Return updates from requestPermissionsAndSave
content = content.replace(
  "    } catch (e) {\n      console.warn(\"Failed to update user profile with permissions:\", e);\n    }\n  }\n};",
  "    } catch (e) {\n      console.warn(\"Failed to update user profile with permissions:\", e);\n    }\n  }\n  return updates;\n};"
);

// 2. Fix vibrate on NotificationOptions by casting to any in other occurrences
content = content.replace(/new Notification\(title, \{(.*?)\}\)/g, "new Notification(title, {$1} as any)");

fs.writeFileSync('src/context/AppContext.tsx', content);
