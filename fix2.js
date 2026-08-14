import fs from 'fs';
let code = fs.readFileSync('src/components/AuthLoginModal.tsx', 'utf8');

code = code.replace(
  `           setError(err.message || 'An error occurred during authentication.');
        }`,
  `           setError(err.message || 'An error occurred during authentication.');
        }
        if (!isLogin && err.code === 'auth/email-already-in-use') {
           setError('An account with this email already exists. Switching to Sign In.');
           setIsLogin(true);
        }`
);

fs.writeFileSync('src/components/AuthLoginModal.tsx', code);
