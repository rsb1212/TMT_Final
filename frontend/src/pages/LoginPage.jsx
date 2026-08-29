import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Eye, EyeOff, Shield, Sun, Moon, KeyRound } from 'lucide-react';
import './LoginPage.css'
import BatLogo from '../data/bajaj.png';

export default function LoginPage() {
  const { login }              = useAuth();
  const { isDark, toggle }     = useTheme();
  const navigate               = useNavigate();
  const [form,    setForm]     = useState({ email: '', password: '' });
  const [showPwd, setShowPwd]  = useState(false);
  const [error,   setError]    = useState('');
  const [loading, setLoading]  = useState(false);
  const [idemLoading, setIdemLoading] = useState(false);

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

  const handleIdemLogin = () => {
    setIdemLoading(true);
    setError('');
    // Redirect to IDEM SSO endpoint
    window.location.href = '/api/v1/auth/idem/login';
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
          <h1 className="login-title">Test Genii AI</h1>
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
