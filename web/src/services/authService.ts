import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  IdTokenResult,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from './authFirebase';
import { db } from './firebase';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: 'admin';
  isSuperAdmin?: boolean;
}

// Authorized Administrator emails list (can be augmented by VITE_ADMIN_EMAILS env variable)
const CONFIGURED_ADMINS = (
  import.meta.env.VITE_ADMIN_EMAILS ||
  'admin@upstage.com,admin@upstagekadai.com,upstagepos@gmail.com'
)
  .toLowerCase()
  .split(',')
  .map((e: string) => e.trim());

/**
 * Maps Firebase Authentication error codes to user-friendly messages.
 */
export function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your administrator credentials.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This administrator account has been disabled. Please contact system support.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Access to this account has been temporarily disabled. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection.';
    case 'auth/operation-not-allowed':
      return "Email/Password sign-in is not enabled in Firebase project 'login-form-9111e'. An administrator must enable Email/Password provider in the Firebase Authentication Console.";
    default:
      return 'Authentication failed. Please verify your credentials and try again.';
  }
}

/**
 * Checks whether an authenticated user in project login-form-9111e has administrator privileges.
 */
export async function verifyAdminStatus(
  user: FirebaseUser
): Promise<{ isAdmin: boolean; isSuperAdmin?: boolean; reason?: string }> {
  try {
    // 1. Check Firebase custom claims
    const tokenResult: IdTokenResult = await user.getIdTokenResult(true);
    if (tokenResult.claims.admin === false || tokenResult.claims.disabled === true) {
      return {
        isAdmin: false,
        reason: 'This account does not have administrator access permissions.',
      };
    }
    if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
      return {
        isAdmin: true,
        isSuperAdmin: tokenResult.claims.superAdmin === true,
      };
    }

    // 2. Check if Firestore user document exists in CRM database
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.role === 'admin' || data.isAdmin === true) {
          return {
            isAdmin: true,
            isSuperAdmin: data.isSuperAdmin === true,
          };
        }
      }
    } catch {
      // Non-blocking: auth users in login-form-9111e might not have documents in scaner-billing
    }

    // 3. Check authorized administrator email whitelist
    if (user.email && CONFIGURED_ADMINS.includes(user.email.toLowerCase())) {
      return { isAdmin: true, isSuperAdmin: true };
    }

    // 4. Any provisioned account in dedicated login-form-9111e project without restrictions
    return { isAdmin: true };
  } catch (error) {
    console.error('Error verifying administrator authorization:', error);
    return {
      isAdmin: false,
      reason: 'Failed to verify administrator privileges due to a security verification error.',
    };
  }
}

/**
 * Sign in as CRM Administrator using dedicated login-form-9111e Firebase Authentication.
 */
export async function adminSignIn(email: string, password: string): Promise<AdminUser> {
  if (!email || !email.trim() || !password) {
    throw new Error('Please enter both email and password.');
  }

  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const { isAdmin, isSuperAdmin, reason } = await verifyAdminStatus(cred.user);

  if (!isAdmin) {
    await firebaseSignOut(auth);
    throw new Error(reason || 'Access denied. Administrator privileges required.');
  }

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || cred.user.email?.split('@')[0] || 'CRM Administrator',
    role: 'admin',
    isSuperAdmin,
  };
}

/**
 * Sign out administrator from dedicated login-form-9111e Firebase Authentication.
 */
export async function adminSignOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribe to Admin Auth State changes from dedicated login-form-9111e Firebase Authentication.
 */
export function subscribeToAdminAuth(
  callback: (admin: AdminUser | null, loading: boolean) => void
) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, false);
      return;
    }

    try {
      const { isAdmin, isSuperAdmin } = await verifyAdminStatus(user);
      if (isAdmin) {
        callback(
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'CRM Administrator',
            role: 'admin',
            isSuperAdmin,
          },
          false
        );
      } else {
        callback(null, false);
      }
    } catch (err) {
      console.error('Error in onAuthStateChanged observer:', err);
      callback(null, false);
    }
  });
}
