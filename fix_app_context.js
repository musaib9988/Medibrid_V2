import fs from 'fs';
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(/isFirestoreQuotaExhausted = false;/g, 'isFirestoreQuotaExhausted = true;');

code = code.replace(
  `  if (isFirestoreQuotaExhausted) {
    return () => {};
  }`,
  `  if (isFirestoreQuotaExhausted) {
    onNext({ exists: () => false, data: () => null });
    return () => {};
  }`
);

code = code.replace(
  `        } catch (error) {
          console.error("Error fetching user profile:", error);`,
  `          // Fallback if role doesn't load
          setTimeout(() => {
             setRole(prev => {
                if (prev === null) return isAdminEmail ? 'admin' : 'user';
                return prev;
             });
          }, 3000);
        } catch (error) {
          console.error("Error fetching user profile:", error);`
);

fs.writeFileSync('src/context/AppContext.tsx', code);
