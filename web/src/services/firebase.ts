import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Production Firebase Configuration for Upstage POS (scaner-billing)
// Overridable via standard VITE_ environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCWpL_KZPGeYUZ5pLiDzx-X6Vi0Q5J8xRI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scaner-billing.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scaner-billing",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scaner-billing.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "207862672282",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:207862672282:web:1d5d5529b31148ac1ae823",
};

// Initialize Firebase App safely (singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Service Exports
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
