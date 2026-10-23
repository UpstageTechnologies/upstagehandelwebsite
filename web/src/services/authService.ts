import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  IdTokenResult,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: 'admin';
  isSuperAdmin?: boolean;
}

// Authorized Administrator emails list (can be augmented by VITE_ADMIN_EMAILS env variable)
const CONFIGURED_ADMINS = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@upstage.com,admin@upstagekadai.com,upstagepos@gmail.com')
  .toLowerCase()
  .split(',')
  .map((e: string) => e.trim());

/**
 * Checks whether an authenticated user has administrator privileges.
 */
export async function verifyAdminStatus(user: FirebaseUser): Promise<{ isAdmin: boolean; reason?: string }> {
  try {
    // 1. Check Firebase custom claims
    const tokenResult: IdTokenResult = await user.getIdTokenResult(true);
    if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
      return { isAdmin: true };
    }

    // 2. Check Firestore user profile role
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.role === 'admin' || data.isAdmin === true) {
        return { isAdmin: true };
      }
    }

    // 3. Check authorized administrator email whitelist
    if (user.email && CONFIGURED_ADMINS.includes(user.email.toLowerCase())) {
      return { isAdmin: true };
    }

    // If running in development with explicit admin mode enabled
    if (import.meta.env.DEV && (user.email?.toLowerCase().includes('admin') || user.email?.toLowerCase().includes('upstage'))) {
      return { isAdmin: true };
    }

    return {
      isAdmin: false,
      reason: 'Your account does not possess administrator credentials for the Upstage CRM.',
    };
  } catch (error) {
    console.error('Error verifying admin authorization:', error);
    return {
      isAdmin: false,
      reason: 'Failed to verify administrator privileges due to a security verification error.',
    };
  }
}

/**
 * Sign in as CRM Administrator.
 */
export async function adminSignIn(email: string, password: string): Promise<AdminUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const { isAdmin, reason } = await verifyAdminStatus(cred.user);

  if (!isAdmin) {
    await firebaseSignOut(auth);
    throw new Error(reason || 'Access denied. Administrator privileges required.');
  }

  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || 'CRM Administrator',
    role: 'admin',
  };
}

/**
 * Sign out administrator.
 */
export async function adminSignOut(): Promise<void> {
  await firebaseSignOut(auth);
  localStorage.removeItem('upstage_crm_admin_session');
}

/**
 * Subscribe to Admin Auth State changes.
 */
export function subscribeToAdminAuth(callback: (admin: AdminUser | null, loading: boolean) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, false);
      return;
    }

    const { isAdmin } = await verifyAdminStatus(user);
    if (isAdmin) {
      callback(
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'CRM Administrator',
          role: 'admin',
        },
        false
      );
    } else {
      callback(null, false);
    }
  });
}
