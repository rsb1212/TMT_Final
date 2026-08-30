import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FolderKanban, ClipboardList, CheckCircle2, Clock, 
  AlertCircle, TrendingUp, Search, RefreshCw, User, Building2
} from 'lucide-react';
import { reportApi, userApi } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function SmeDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedSme, setSelectedSme] = useState(null);
  const [smeList, setSmeList] = useState([]);

  useEffect(() => {
    // If current user is SME, load their dashboard
    if (user?.role === 'SME') {
      setSelectedSme(user.id);
    } else {
      // For MANAGER/ADMIN, load list of SMEs
      loadSmeList();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSme) {
      loadDashboard(selectedSme);
    }
  }, [selectedSme]);

  const loadSmeList = async () => {
    try {
      const { data } = await userApi.list({ role: 'SME' });
      setSmeList(data.data?.content || data.data || []);
      // Select first SME if available
      if ((data.data?.content || data.data || []).length > 0) {
        setSelectedSme((data.data?.content || data.data)[0].id);
      }
    } catch (err) {
      console.error('Failed to load SME list:', err);
    }
  };

  const loadDashboard = async (smeId) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await reportApi.smeModuleDashboard(smeId);
      setDashboardData(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 50) return '#f59e0b';
    return '#ef4444';
  };

  if (loading && !dashboardData) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={32} className="spin" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <p>Loading SME Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', background: 'rgba(239, 68, 68, 0.1)' }}>
          <AlertCircle size={32} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => selectedSme && loadDashboard(selectedSme)} style={{ marginTop: '1rem' }}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><LayoutDashboard size={28} style={{ marginRight: '0.5rem' }} /> SME Module Dashboard</h1>
          <p className="subtitle">Module-wise test case statistics and review progress</p>
        </div>
        <button className="btn btn-secondary" onClick={() => selectedSme && loadDashboard(selectedSme)}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* SME Selector (for MANAGER/ADMIN) */}
      {user?.role !== 'SME' && smeList.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <User size={20} />
            <label style={{ fontWeight: 500 }}>Select SME:</label>
            <select
              value={selectedSme || ''}
              onChange={(e) => setSelectedSme(e.target.value)}
              style={{ flex: 1, maxWidth: '300px' }}
            >
              {smeList.map(sme => (
                <option key={sme.id} value={sme.id}>
                  {sme.fullName || sme.username} ({sme.team || 'No Team'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* SME Info Card */}
      {dashboardData && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'var(--glass-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={28} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{dashboardData.smeName || 'SME User'}</h2>
                <p style={{ margin: 0, opacity: 0.7 }}>
                  {dashboardData.totalAssignedModules} Assigned Module{dashboardData.totalAssignedModules !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Overall Completion */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: getCompletionColor(dashboardData.overallCompletionPercentage) }}>
                {dashboardData.overallCompletionPercentage}%
              </div>
              <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>Overall Completion</div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {dashboardData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard 
            icon={<ClipboardList size={24} />}
            label="Total Test Cases"
            value={dashboardData.totalTestCases}
            color="#3b82f6"
          />
          <StatCard 
            icon={<Clock size={24} />}
            label="Pending Review"
            value={dashboardData.totalPendingReview}
            color="#f59e0b"
          />
          <StatCard 
            icon={<AlertCircle size={24} />}
            label="Pending Sign-off"
            value={dashboardData.totalPendingSignOff}
            color="#ef4444"
          />
          <StatCard 
            icon={<CheckCircle2 size={24} />}
            label="Reviewed"
            value={dashboardData.totalReviewed}
            color="#22c55e"
          />
          <StatCard 
            icon={<TrendingUp size={24} />}
            label="Signed Off"
            value={dashboardData.totalSignedOff}
            color="#8b5cf6"
          />
        </div>
      )}

      {/* Module-wise Breakdown */}
      <h3 style={{ marginBottom: '1rem' }}>
        <FolderKanban size={20} style={{ marginRight: '0.5rem' }} />
        Module-wise Statistics
      </h3>

      {dashboardData?.moduleStats?.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Building2 size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3>No Modules Assigned</h3>
          <p style={{ opacity: 0.7 }}>This SME has no modules assigned yet.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {dashboardData?.moduleStats?.map((module, idx) => (
          <div key={module.moduleId} className="animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
            <ModuleCard module={module} />
          </div>
        ))}
      </div>

      {/* Test Cases Pending Sign-off List */}
      {dashboardData?.pendingSignOffCases?.length > 0 && (
        <div style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
            <AlertCircle size={20} style={{ marginRight: '0.5rem', color: '#ef4444' }} />
            Test Cases Pending Sign-off ({dashboardData.pendingSignOffCases.length})
          </h3>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap" style={{ margin: 0, border: 'none' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Module</th>
                    <th>Priority</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.pendingSignOffCases.map((tc, idx) => (
                    <tr key={tc.id} className="interactive-row animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{tc.code}</td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tc.title}>{tc.title}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{tc.module?.name || '—'}</td>
                      <td style={{ fontSize: 12 }}>{tc.priority}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(tc.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub Components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding: '24px' }}>
      <div className="card-header" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '12px', 
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ module }) {
  const getCompletionColor = (pct) => {
    if (pct >= 80) return '#22c55e';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="glass-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>{module.moduleName}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {module.channel && (
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: '#3b82f6',
                fontSize: '0.75rem'
              }}>
                {module.channel}
              </span>
            )}
            {module.department && (
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                background: 'rgba(139, 92, 246, 0.1)', 
                color: '#8b5cf6',
                fontSize: '0.75rem'
              }}>
                {module.department}
              </span>
            )}
          </div>
        </div>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          color: getCompletionColor(module.completionPercentage) 
        }}>
          {module.completionPercentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ 
        height: '8px', 
        background: 'var(--glass-bg)', 
        borderRadius: '4px', 
        overflow: 'hidden',
        marginBottom: '1rem'
      }}>
        <div style={{ 
          height: '100%', 
          width: `${module.completionPercentage}%`,
          background: getCompletionColor(module.completionPercentage),
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{module.totalTestCases}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Total</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f59e0b' }}>{module.pendingReview}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Pending Review</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ef4444' }}>{module.pendingSignOff}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Pending Sign-off</div>
        </div>
        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#22c55e' }}>{module.signedOff}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Signed Off</div>
        </div>
      </div>
    </div>
  );
}
