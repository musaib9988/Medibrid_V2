import fs from 'fs';
let code = fs.readFileSync('src/components/AuthLoginModal.tsx', 'utf8');

// Change default to Sign Up
code = code.replace(
  `const [isLogin, setIsLogin] = useState(true);`,
  `const [isLogin, setIsLogin] = useState(false);`
);

// Auto-switch to Sign Up on invalid-credential during Login
code = code.replace(
  `        setError(err.message || 'An error occurred during authentication.');`,
  `        if (isLogin && (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found')) {
           setError('Account not found. Please sign up instead.');
           setIsLogin(false);
        } else {
           setError(err.message || 'An error occurred during authentication.');
        }`
);

fs.writeFileSync('src/components/AuthLoginModal.tsx', code);

// Fix TS error in PatientHome
let phCode = fs.readFileSync('src/components/PatientHome.tsx', 'utf8');
phCode = phCode.replace(
  `const pos = await new Promise((resolve, reject) => {`,
  `const pos = await new Promise<GeolocationPosition>((resolve, reject) => {`
);
fs.writeFileSync('src/components/PatientHome.tsx', phCode);

