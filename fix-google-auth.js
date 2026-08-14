import fs from 'fs';
let code = fs.readFileSync('src/components/AuthLoginModal.tsx', 'utf8');

code = code.replace(
  `    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }`,
  `    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Sign in was cancelled.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    }`
);

fs.writeFileSync('src/components/AuthLoginModal.tsx', code);
