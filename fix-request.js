import fs from 'fs';
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
  '    try {\n      await setDoc(doc(db, \'users\', uid), updates, { merge: true });',
  `    try {
      if (uid) {
        await setDoc(doc(db, 'users', uid), updates, { merge: true });
      }`
);

code = code.replace(
  '      if (setUserProfileCallback) {\n        setUserProfileCallback((prev: any) => prev ? { ...prev, ...updates } : null);\n      }\n    } catch (e) {',
  `      if (setUserProfileCallback) {
        setUserProfileCallback((prev: any) => prev ? { ...prev, ...updates } : null);
      }
    } catch (e) {`
);

code = code.replace(
  'return;\n}',
  'return updates;\n}'
);

fs.writeFileSync('src/context/AppContext.tsx', code);
