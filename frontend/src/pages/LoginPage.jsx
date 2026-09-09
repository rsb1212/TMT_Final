import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Eye, EyeOff, Shield, Sun, Moon, KeyRound } from 'lucide-react';
import './LoginPage.css'
import BatLogo from '../data/bajaj.png';

export default function LoginPage() {
  const { login, ssoLogin } = useAuth();
  const { isDark, toggle }     = useTheme();
  const navigate               = useNavigate();
  const [form,    setForm]     = useState({ email: '', password: '' });
  const [showPwd, setShowPwd]  = useState(false);
  const [error,   setError]    = useState('');
  const [loading, setLoading]  = useState(false);
  const [idemLoading, setIdemLoading] = useState(false);

  // ── Handle IDEM / RH-SSO redirect callback ──────────────────────────────────
  // After a successful SSO login the backend redirects here with
  // ?sso=success&token=<jwt>&user=<base64-json>. Parse it, persist the session
  // and continue into the app. On ?sso=error show a friendly message.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sso = params.get('sso');
    if (!sso) return;

    if (sso === 'success') {
      try {
        const token = params.get('token');
        const userB64 = params.get('user');
        // base64url → JSON
        const json = decodeURIComponent(
          atob(userB64.replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const userData = JSON.parse(json);
        ssoLogin(token, userData);
        // Clean the URL then enter the app.
        window.history.replaceState({}, document.title, '/login');
        navigate('/');
      } catch (err) {
        console.error('SSO callback parse failed', err);
        setError('Single sign-on failed. Please try again.');
        window.history.replaceState({}, document.title, '/login');
      }
    } else if (sso === 'error') {
      const reason = params.get('reason') || 'unknown';
      setError(`Single sign-on failed (${reason}). Please try again.`);
      window.history.replaceState({}, document.title, '/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      await login(String(email), String(password));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); doLogin(form.email, form.password); };

  // IDEM sign-in — ALWAYS redirect the browser to the IDEM / RH-SSO login page.
  // The backend endpoint (GET /api/v1/auth/idem/login) starts the OIDC flow and
  // redirects to Keycloak; after authentication it returns to /login with a
  // ?sso=success&token=...&user=... payload (handled by the useEffect above).
  const handleIdemLogin = () => {
    setIdemLoading(true);
    setError('');
    const base = import.meta.env.VITE_API_URL || '/api/v1';
    // Full-page navigation (NOT axios) so the browser follows the 302 to Keycloak.
    window.location.href = `${base}/auth/idem/login`;
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="grid-overlay" />
      </div>

      {/* Day / Night toggle — top-right corner */}
      <button className="login-theme-toggle" onClick={toggle}>
        {isDark
          ? <Sun  size={14} style={{ color: '#f59e0b' }} />
          : <Moon size={14} style={{ color: '#6b2d45' }} />}
        {isDark ? 'Light' : 'Dark'}
      </button>

      {/* Login card */}
      <div className="login-card">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-icon">
            <img src={BatLogo} alt="Brand Logo" width={36} height={36} />
          </div>
          <h1 className="login-title">Test Genii</h1>
          <p className="login-sub">Intelligent Test Knowledge & Management Platform</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              autoFocus
              autoComplete="email"
              placeholder="rahul@bajajlife.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label>Password</label>
            <input
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              style={{ paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={{
                position: 'absolute', right: 12, top: 34,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text3)', padding: 2, display: 'flex',
              }}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading || idemLoading}>
            {loading ? 'Signing in…' : <><Shield size={15} /> Sign In</>}
          </button>
        </form>

        {/* IDEM SSO Divider */}
        <div className="idem-divider">
          <span>OR</span>
        </div>

        {/* IDEM Authentication Button */}
        <button 
          className="idem-btn" 
          onClick={handleIdemLogin}
          disabled={loading || idemLoading}
        >
          {idemLoading ? 'Redirecting…' : <><KeyRound size={15} /> Sign in with IDEM</>}
        </button>

        <div className="login-footer">
          {/* Spring Boot 3.2 · React 18 · PostgreSQL 15 */}
          © 2026 Bajaj Life Insurance. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
