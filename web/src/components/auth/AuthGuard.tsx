import React from 'react';
import { AdminUser } from '../../services/authService';

interface AuthGuardProps {
  admin: AdminUser | null;
  loading: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode;
}

/**
 * Reusable Authentication Guard for CRM protected routes.
 *
 * 1. Shows a clean loading screen while Firebase onAuthStateChanged verifies the session,
 *    preventing the CRM dashboard from flashing unauthenticated state.
 * 2. Redirects unauthenticated users to the Login view.
 * 3. Renders the protected CRM application only when Firebase confirms an authenticated session.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  admin,
  loading,
  children,
  fallback,
}) => {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          gap: 16,
        }}
        role="status"
        aria-live="polite"
      >
        <div
          className="skeleton"
          style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#312E81' }}
        />
        <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
          Verifying Administrator Session...
        </div>
      </div>
    );
  }

  if (!admin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
