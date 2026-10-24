import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';

/**
 * Dedicated Firebase Project Configuration for CRM Login Authentication ONLY.
 * Project: login-form-9111e
 *
 * NOTE: This project is strictly isolated from the CRM business database (scaner-billing).
 * It handles administrator authentication and session management.
 */
export const authFirebaseConfig = {
  apiKey: "AIzaSyAti6Ii3hG3BocKflo0FjyHK7AcaQtodHI",
  authDomain: "login-form-9111e.firebaseapp.com",
  projectId: "login-form-9111e",
  storageBucket: "login-form-9111e.firebasestorage.app",
  messagingSenderId: "803303155404",
  appId: "1:803303155404:web:c7e33c0116001772b04469",
};

const AUTH_APP_NAME = 'login-form-9111e-auth';

// Initialize or retrieve dedicated named Firebase App safely (singleton)
export const authApp: FirebaseApp =
  getApps().find((a) => a.name === AUTH_APP_NAME) ||
  initializeApp(authFirebaseConfig, AUTH_APP_NAME);

// Dedicated Firebase Authentication instance
export const auth: Auth = getAuth(authApp);

// Configure persistent login session using browserLocalPersistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Unable to explicitly set auth browserLocalPersistence:', err);
});

export default auth;
