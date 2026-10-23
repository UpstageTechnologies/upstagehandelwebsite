import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { adminSignIn, AdminUser } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const admin = await adminSignIn(email, password);
      onLoginSuccess(admin);
    } catch (err: any) {
      console.error('Login failure:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid administrator email or password.');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Access for development testing
  const handleQuickDemoAccess = () => {
    const demoAdmin: AdminUser = {
      uid: 'upstage-admin-master',
      email: 'admin@upstage.com',
      displayName: 'Master Administrator',
      role: 'admin',
      isSuperAdmin: true,
    };
    onLoginSuccess(demoAdmin);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0F172A',
        backgroundImage: 'radial-gradient(circle at 50% 10%, #1E293B 0%, #0F172A 100%)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#FFFFFF',
              boxShadow: '0 8px 16px rgba(79, 70, 229, 0.35)',
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            UpstageHandel CRM
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Administrator Management Portal for Upstage POS
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 10,
              fontSize: 12.5,
              color: '#991B1B',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
              Administrator Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="email"
                placeholder="admin@upstage.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="filter-input"
                style={{ width: '100%', height: 42, paddingLeft: 38 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="filter-input"
                style={{ width: '100%', height: 42, paddingLeft: 38 }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', height: 44, marginTop: 8 }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Access Trigger for Testing */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, textAlign: 'center' }}>
          <button
            onClick={handleQuickDemoAccess}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: 12.5 }}
          >
            <Sparkles size={14} color="#6366F1" />
            Quick Demo Admin Access
          </button>
          <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, display: 'block' }}>
            Bypasses form for instant local evaluation of CRM dashboards
          </span>
        </div>
      </div>
    </div>
  );
};
