import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function TenantSelector() {
  const { user, tenant, tenants, switchTenant, loadTenants } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewAll, setViewAll] = useState(false);
  const dropdownRef = useRef(null);

  // Only show for ADMIN users
  if (user?.role !== 'ADMIN') {
    return null;
  }

  useEffect(() => {
    // Load tenants list when component mounts (for admins)
    if (user?.role === 'ADMIN' && tenants.length === 0) {
      loadTenants();
    }
  }, [user?.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewAll = () => {
    setViewAll(true);
    localStorage.removeItem('tenantId');
    localStorage.removeItem('tenant');
    setIsOpen(false);
    window.location.reload();
  };

  const handleSwitchTenant = async (tenantId) => {
    if (tenantId === tenant?.id && !viewAll) {
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      setViewAll(false);
      await switchTenant(tenantId);
      // Page will reload after switch
    } catch (err) {
      console.error('Failed to switch tenant:', err);
      setLoading(false);
    }
  };

  return (
    <div className="tenant-selector" ref={dropdownRef}>
      <button
        className="tenant-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        title="Switch Organization"
      >
        {viewAll || !tenant ? <Globe size={16} /> : <Building2 size={16} />}
        <span className="tenant-name">{viewAll || !tenant ? 'All Organizations' : tenant?.name}</span>
        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="tenant-dropdown glass-card">
          <div className="tenant-dropdown-header">
            <span>Organizations</span>
          </div>
          <div className="tenant-dropdown-list">
            {/* All Tenants option for ADMIN */}
            <button
              className={`tenant-dropdown-item ${viewAll || !tenant ? 'active' : ''}`}
              onClick={handleViewAll}
            >
              <div className="tenant-item-logo" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Globe size={18} style={{ color: '#3b82f6' }} />
              </div>
              <div className="tenant-item-info">
                <span className="tenant-item-name">All Organizations</span>
                <span className="tenant-item-code">Access all tenant data</span>
              </div>
              {(viewAll || !tenant) && (
                <Check size={16} className="tenant-item-check" />
              )}
            </button>

            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />

            {tenants.length === 0 ? (
              <div className="tenant-dropdown-empty">No tenants available</div>
            ) : (
              tenants.filter(t => t.active).map((t) => (
                <button
                  key={t.id}
                  className={`tenant-dropdown-item ${t.id === tenant?.id && !viewAll ? 'active' : ''}`}
                  onClick={() => handleSwitchTenant(t.id)}
                >
                  <div className="tenant-item-logo">
                    {t.logoUrl ? (
                      <img src={t.logoUrl} alt={t.name} />
                    ) : (
                      <Building2 size={18} />
                    )}
                  </div>
                  <div className="tenant-item-info">
                    <span className="tenant-item-name">{t.name}</span>
                    <span className="tenant-item-code">{t.code}</span>
                  </div>
                  {t.id === tenant?.id && !viewAll && (
                    <Check size={16} className="tenant-item-check" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .tenant-selector {
          position: relative;
        }

        .tenant-selector-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .tenant-selector-trigger:hover {
          background: var(--glass-hover);
        }

        .tenant-selector-trigger .tenant-name {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tenant-selector-trigger .chevron {
          transition: transform 0.2s ease;
        }

        .tenant-selector-trigger .chevron.open {
          transform: rotate(180deg);
        }

        .tenant-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          max-height: 400px;
          overflow: hidden;
          z-index: 1000;
          padding: 0;
        }

        .tenant-dropdown-header {
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.6;
          border-bottom: 1px solid var(--glass-border);
        }

        .tenant-dropdown-list {
          max-height: 320px;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .tenant-dropdown-empty {
          padding: 1rem;
          text-align: center;
          opacity: 0.5;
          font-size: 0.9rem;
        }

        .tenant-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s ease;
        }

        .tenant-dropdown-item:hover {
          background: var(--glass-hover);
        }

        .tenant-dropdown-item.active {
          background: rgba(59, 130, 246, 0.1);
        }

        .tenant-item-logo {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--glass-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .tenant-item-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tenant-item-logo svg {
          opacity: 0.5;
        }

        .tenant-item-info {
          flex: 1;
          min-width: 0;
        }

        .tenant-item-name {
          display: block;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tenant-item-code {
          display: block;
          font-size: 0.75rem;
          opacity: 0.6;
          font-family: monospace;
        }

        .tenant-item-check {
          color: #3b82f6;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
