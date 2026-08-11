import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, isSupported } from "firebase/messaging";
const firebaseConfig = {
  apiKey: "AIzaSyBJ2PSl0iCwyFgpW5WLkgmJffOikRZfCLI",
  authDomain: "musaib0.firebaseapp.com",
  projectId: "musaib0",
  storageBucket: "musaib0.firebasestorage.app",
  messagingSenderId: "813318556366",
  appId: "1:813318556366:web:ad9e458eeb2ca93c2f9e9f",
  measurementId: "G-JQ766VRZGH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const initMessaging = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

// Initialize analytics only in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
