import { createContext, useContext, useState, useEffect } from 'react';
import { authApi, tenantApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const storedTenant = localStorage.getItem('tenant');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (err) { console.error(err); }
    }
    if (storedTenant) {
      try { setTenant(JSON.parse(storedTenant)); } catch (err) { console.error(err); }
    }
    setLoading(false);
  }, []);

  // Load available tenants for admin users
  const loadTenants = async () => {
    try {
      const { data } = await tenantApi.list();
      if (data.success) {
        setTenants(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const login = async (email, password) => {
    // Safety guard: ensure we always send plain strings to the backend.
    const safeEmail = typeof email === 'object'
      ? (email?.email ?? '')
      : String(email ?? '');
    const safePassword = typeof password === 'object'
      ? (password?.password ?? '')
      : String(password ?? '');

    const { data } = await authApi.login({ email: safeEmail, password: safePassword });
    const { token, user: userData, tenant: tenantData } = data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Store tenant info if provided
    if (tenantData) {
      localStorage.setItem('tenant', JSON.stringify(tenantData));
      localStorage.setItem('tenantId', tenantData.id);
      setTenant(tenantData);
    } else if (userData.tenantId) {
      // If only tenantId is in user data
      localStorage.setItem('tenantId', userData.tenantId);
    }
    
    setUser(userData);
    
    // Load tenants list for admin users
    if (userData.role === 'ADMIN') {
      loadTenants();
    }
    
    return userData;
  };

  /**
   * Complete an IDEM / RH-SSO login. Called on the /login page when the backend
   * redirects back with ?sso=success&token=...&user=<base64-json>.
   */
  const ssoLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.tenantId) {
      localStorage.setItem('tenantId', userData.tenantId);
    }
    setUser(userData);
    if (userData.role === 'ADMIN') {
      loadTenants();
    }
    return userData;
  };

  /**
   * IDEM credential login — validates the User ID (domain email) + password
   * against the database via POST /auth/idem/authenticate and persists the
   * role-aware session. Returns the authenticated user (with `role`) so the
   * caller can route accordingly.
   */
  const idemLogin = async (userId, password) => {
    const safeUserId = typeof userId === 'object'
      ? (userId?.email ?? '')
      : String(userId ?? '');
    const safePassword = typeof password === 'object'
      ? (password?.password ?? '')
      : String(password ?? '');

    const { data } = await authApi.idemLogin({ email: safeUserId, password: safePassword });
    const { token, user: userData, tenant: tenantData } = data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    if (tenantData) {
      localStorage.setItem('tenant', JSON.stringify(tenantData));
      localStorage.setItem('tenantId', tenantData.id);
      setTenant(tenantData);
    } else if (userData.tenantId) {
      localStorage.setItem('tenantId', userData.tenantId);
    }

    setUser(userData);

    if (userData.role === 'ADMIN') {
      loadTenants();
    }

    return userData;
  };

  const switchTenant = async (tenantId) => {    try {
      const { data } = await tenantApi.get(tenantId);
      if (data.success) {
        const tenantData = data.data;
        localStorage.setItem('tenant', JSON.stringify(tenantData));
        localStorage.setItem('tenantId', tenantData.id);
        setTenant(tenantData);
        // Reload the page to refresh data for new tenant
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch tenant:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('tenantId');
    setUser(null);
    setTenant(null);
    setTenants([]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      tenant, 
      tenants, 
      login, 
      logout, 
      switchTenant, 
      loadTenants,
      ssoLogin,
      idemLogin,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
