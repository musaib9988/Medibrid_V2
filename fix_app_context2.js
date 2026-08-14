import fs from 'fs';
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Fix the variable declaration that got wrongly sed'd
code = code.replace(/let isFirestoreQuotaExhausted = true;/g, 'let isFirestoreQuotaExhausted = false;');

// Fix the location fetching
code = code.replace(
  `const requestPermissionsAndSave = async (uid: string, setUserProfileCallback?: (update: any) => void) => {`,
  `const requestPermissionsAndSave = async (uid: string, setUserProfileCallback?: (update: any) => void, force = false) => {`
);

code = code.replace(
  `if (!hasFetchedLocation && !locationFetchedStorage && 'geolocation' in navigator) {`,
  `if ((force || (!hasFetchedLocation && !locationFetchedStorage)) && 'geolocation' in navigator) {`
);

code = code.replace(
  `const requestPermissions = async () => {
    if (!firebaseUser) return;
    await requestPermissionsAndSave(firebaseUser.uid, setUserProfile);
  };`,
  `const requestPermissions = async () => {
    if (!firebaseUser) return;
    await requestPermissionsAndSave(firebaseUser.uid, setUserProfile, true);
  };`
);

fs.writeFileSync('src/context/AppContext.tsx', code);
