import { useState, useEffect, useCallback, useMemo } from 'react';
import { reportApi, projectApi, testCaseApi, defectApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { RefreshCw, ChevronDown, ChevronRight, Download, CheckCircle2,
  XCircle, Clock, AlertTriangle, BarChart2, Activity, Shield, Users,
  Building2, UserCheck, FileText, ArrowRight, Mail, Phone, PanelLeftClose, PanelLeft } from 'lucide-react';

const S = {
  Pass:        { color: '#00e676', bg: 'rgba(0,230,118,0.12)'   },
  Fail:        { color: '#ff5252', bg: 'rgba(255,82,82,0.12)'   },
  InProgress:  { color: '#ffb74d', bg: 'rgba(255,183,77,0.12)'  },
  NA:          { color: '#ffd740', bg: 'rgba(255,215,64,0.12)'  },
  NotReleased: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  Defect:      { color: '#ff9800', bg: 'rgba(255,152,0,0.12)'   },
  Assigned:    { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)'   },
  Draft:       { color: '#8899aa', bg: 'rgba(136,153,170,0.12)' },
};

const DEPARTMENT_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24',
  '#fb923c', '#f87171', '#60a5fa', '#c084fc', '#2dd4bf',
];

function StatTile({ label, value, color, bg, icon: Icon, subtitle, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: bg || 'var(--bg-raised)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 14px', textAlign: 'center',
      borderTop: `3px solid ${color || 'var(--accent)'}`,
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: onClick ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      {Icon && <Icon size={16} style={{ color, marginBottom: 6, opacity: 0.8 }} />}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24,
        fontWeight: 700, color: color || 'var(--accent)', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 5,
        textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
      {subtitle && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function ProgressBar({ value, color = 'var(--accent)', label }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</span>
          <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{value}%</span>
        </div>
      )}
      <div style={{ height: 8, background: 'var(--bg-deep)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function ProjectTree({ projects, selectedId, onSelect }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (id, e) => { e.stopPropagation(); setExpanded(p => ({ ...p, [id]: !p[id] })); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {projects.map(p => (
        <div key={p.id}>
          <div onClick={() => onSelect(p.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
            background: selectedId === p.id ? 'var(--accent-dim)' : 'transparent',
            border: `1px solid ${selectedId === p.id ? 'var(--accent)' : 'transparent'}`,
            fontSize: 13, color: selectedId === p.id ? 'var(--accent)' : 'var(--text1)',
            transition: 'all 0.12s',
          }}>
            <span onClick={e => p.subProjects?.length > 0 ? toggle(p.id, e) : null}
              style={{ color: 'var(--text3)', display: 'flex', flexShrink: 0 }}>
              {p.subProjects?.length > 0
                ? (expanded[p.id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
                : <span style={{ width: 12 }} />}
            </span>
            <span style={{ fontWeight: p.parentProjectId ? 400 : 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
          {expanded[p.id] && p.subProjects?.length > 0 && (
            <div style={{ marginLeft: 18, borderLeft: '2px solid var(--border)', paddingLeft: 4 }}>
              {p.subProjects.map(sub => (
                <div key={sub.id} onClick={() => onSelect(sub.id)} style={{
                  padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
                  background: selectedId === sub.id ? 'var(--accent-dim)' : 'transparent',
                  color: selectedId === sub.id ? 'var(--accent)' : 'var(--text2)',
                  marginBottom: 1, transition: 'all 0.12s',
                }}>{sub.name}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── SME Department Card ────────────────────────────────── */
function DepartmentCard({ dept, color, expanded, onToggle }) {
  const execTotal = dept.passed + dept.failed;
  const reviewPct = dept.totalCases > 0
    ? Math.round((dept.pendingReview / dept.totalCases) * 100) : 0;
  const approvalPct = dept.totalCases > 0
    ? Math.round((dept.smeApproved / dept.totalCases) * 100) : 0;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden', transition: 'all 0.15s',
    }}>
      {/* Header */}
      <div onClick={onToggle} style={{
        padding: '14px 16px', cursor: 'pointer', display: 'flex',
        alignItems: 'center', gap: 12, borderBottom: expanded ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: `${color}20`, border: `1px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Building2 size={18} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text1)' }}>{dept.departmentName}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {dept.smeUsers?.length || 0} SME user(s) · {dept.totalCases} test cases
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color }}>
              {dept.totalCases}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>Total</div>
          </div>
          {expanded ? <ChevronDown size={16} style={{ color: 'var(--text3)' }} />
                    : <ChevronRight size={16} style={{ color: 'var(--text3)' }} />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '14px 16px' }}>
          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
            <div style={{
              padding: '10px', borderRadius: 8, textAlign: 'center',
              border: '1px solid var(--border)', background: 'var(--bg-raised)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: '#d29922' }}>
                {dept.pendingReview}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 3 }}>Pending Review</div>
            </div>
            <div style={{
              padding: '10px', borderRadius: 8, textAlign: 'center',
              border: '1px solid var(--border)', background: 'var(--bg-raised)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: '#bc8cff' }}>
                {dept.smeApproved}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 3 }}>SME Approved</div>
            </div>
            <div style={{
              padding: '10px', borderRadius: 8, textAlign: 'center',
              border: '1px solid var(--border)', background: 'var(--bg-raised)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: '#8899aa' }}>
                {dept.draftCases}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 3 }}>Draft</div>
            </div>
            <div style={{
              padding: '10px', borderRadius: 8, textAlign: 'center',
              border: '1px solid var(--border)', background: 'var(--bg-raised)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: dept.passRate >= 80 ? '#3fb950' : dept.passRate >= 60 ? '#d29922' : '#f85149' }}>
                {dept.passRate}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 3 }}>Pass Rate</div>
            </div>
          </div>

          {/* Progress bars */}
          <div style={{ marginBottom: 14 }}>
            <ProgressBar value={reviewPct} color="#d29922" label="Pending Review" />
            <ProgressBar value={approvalPct} color="#bc8cff" label="SME Approval Rate" />
          </div>

          {/* SME Users */}
          {dept.smeUsers?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                <Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                SME Assignees
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dept.smeUsers.map(sme => (
                  <div key={sme.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 7,
                    background: 'var(--bg-raised)', border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#8b5cf6',
                    }}>
                      {sme.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>{sme.fullName}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{sme.email}</div>
                    </div>
                    <a href={`mailto:${sme.email}`} style={{
                      display: 'flex', padding: 4, borderRadius: 6,
                      color: 'var(--text3)', cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent'; }}
                      title={`Email ${sme.fullName}`}>
                      <Mail size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional metrics */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#3fb950' }}>{dept.passed}</span>
              {' '}Passed
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f85149' }}>{dept.failed}</span>
              {' '}Failed
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00d4ff' }}>{dept.inProgress}</span>
              {' '}In Progress
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [projects,        setProjects]        = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [dashboard,       setDashboard]       = useState(null);
  const [modules,         setModules]         = useState([]);
  const [defects,         setDefects]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [smeData,         setSmeData]         = useState(null);
  const [expandedDepts,   setExpandedDepts]   = useState({});
  const [smeView,         setSmeView]         = useState('departments'); // 'departments' | 'summary'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Sidebar collapse state

  const isSME     = user?.role === 'SME';
  const isManager = ['MANAGER', 'ADMIN'].includes(user?.role);
  const isTester  = user?.role === 'TESTER';

  // Load project list on mount
  useEffect(() => {
    projectApi.list().then(r => {
      const all = r.data.data || [];
      setProjects(all);
      if (all.length > 0) {
        const first = all[0].subProjects?.length > 0 ? all[0].subProjects[0] : all[0];
        setSelectedProject(first.id);
      }
    }).catch(err => console.error(err));
  }, []);

  // Load dashboard data whenever selectedProject changes
  const load = useCallback(() => {
    if (!selectedProject) return;
    setLoading(true);

    const calls = [
      reportApi.dashboard(selectedProject),
      reportApi.moduleBreakdown(selectedProject),
      defectApi.list(selectedProject),
    ];

    // If SME, also load department-wise dashboard
    if (isSME) {
      calls.push(reportApi.smeDashboard(selectedProject));
    }

    Promise.all(calls)
      .then(([dr, mr, dfr, sme]) => {
        setDashboard(dr.data.data);
        setModules(mr.data.data || []);
        setDefects(dfr.data.data || []);
        if (isSME && sme) {
          setSmeData(sme.data.data);
        }
      })
      .catch(err => {
        console.error(err);
        setDashboard(null);
        setModules([]);
        setDefects([]);
        setSmeData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedProject, isSME]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    if (!selectedProject) return;
    testCaseApi.exportTestCases(selectedProject).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-cases-${selectedProject}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    }).catch(err => console.error(err));
  };

  const d = dashboard;

  // ── Derived metrics ──────────────────────────────────────────
  const totalExecuted   = d ? Number(d.passed) + Number(d.failed) + Number(d.defectRaised) : 0;
  const executionPct    = d && d.totalTestCases > 0
    ? Math.round((totalExecuted / d.totalTestCases) * 100) : 0;
  const passPct         = d?.passRate ?? 0;
  const { openDefects, criticalDefects, pieData, barData } = useMemo(() => {
    const openDefects     = defects.filter(df => ['NEW','OPEN','IN_PROGRESS'].includes(df.status)).length;
    const criticalDefects = defects.filter(df => df.severity === 'CRITICAL').length;
    const pieData = d ? [
      { name: 'Pass',         value: Number(d.passed),       color: S.Pass.color },
      { name: 'Fail',         value: Number(d.failed),       color: S.Fail.color },
      { name: 'In Progress',  value: Number(d.inProgress),   color: S.InProgress.color },
      { name: 'NA',           value: Number(d.naCount),      color: S.NA.color },
      { name: 'Not Released', value: Number(d.notReleased),  color: S.NotReleased.color },
      { name: 'Defect',       value: Number(d.defectRaised), color: S.Defect.color },
      { name: 'Assigned',     value: Number(d.assigned),     color: S.Assigned.color },
      { name: 'Draft',        value: Number(d.draft),        color: S.Draft.color },
    ].filter(x => x.value > 0) : [];
    const barData = modules.slice(0, 14).map(m => ({
      name:      m.moduleName.length > 16 ? m.moduleName.slice(0, 14) + '…' : m.moduleName,
      Pass:      Number(m.passed),
      Fail:      Number(m.failed),
      'In Prog': Number(m.inProgress),
      NA:        Number(m.naCount),
      'Not Rel': Number(m.notReleased),
    }));
    return { openDefects, criticalDefects, pieData, barData };
  }, [defects, modules, d]);

  // ── SME department chart data ───────────────────────────────
  const deptPieData = useMemo(() => {
    if (!smeData?.departmentSummaries) return [];
    return smeData.departmentSummaries.map((dept, i) => ({
      name: dept.departmentName,
      value: dept.totalCases,
      color: DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length],
    }));
  }, [smeData]);

  const deptBarData = useMemo(() => {
    if (!smeData?.departmentSummaries) return [];
    return smeData.departmentSummaries.map(dept => ({
      name: dept.departmentName.length > 12 ? dept.departmentName.slice(0, 10) + '…' : dept.departmentName,
      'Pending Review': dept.pendingReview,
      'SME Approved': dept.smeApproved,
      'Draft': dept.draftCases,
      'In Progress': dept.inProgress,
    }));
  }, [smeData]);

  const toggleDept = (name) => {
    setExpandedDepts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Get all SME users across departments
  const allSmeUsers = useMemo(() => {
    if (!smeData?.departmentSummaries) return [];
    const users = [];
    const seen = new Set();
    smeData.departmentSummaries.forEach(dept => {
      dept.smeUsers?.forEach(sme => {
        if (!seen.has(sme.id)) {
          seen.add(sme.id);
          users.push({ ...sme, department: dept.departmentName });
        }
      });
    });
    return users;
  }, [smeData]);

  // ── Page titles ─────────────────────────────────────────────
  const pageTitle    = isSME ? 'SME Review Dashboard' : isManager ? 'Manager Dashboard' : 'Project Status';
  const pageSubtitle = isSME
    ? 'Department-wise test case bifurcation and review metrics'
    : isTester ? 'Your project execution status' : 'Real-time project test metrics';

  // ── SME Tab buttons ─────────────────────────────────────────
  const tabs = isSME ? [
    { key: 'departments', label: 'Departments', icon: Building2 },
    { key: 'summary',     label: 'Summary',     icon: BarChart2 },
  ] : [];

  return (
    <div style={{ display: 'flex', gap: 20 }}>

      {/* ── Project tree sidebar ─────────────────────── */}
      <div style={{ 
        width: sidebarCollapsed ? 40 : 210, 
        flexShrink: 0,
        transition: 'width 0.2s ease-in-out'
      }}>
        <div className="card" style={{ position: 'sticky', top: 20 }}>
          <div className="card-header" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {!sidebarCollapsed && <span className="card-title" style={{ fontSize: 11 }}>PROJECTS</span>}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                color: 'var(--text2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text2)'; }}
              title={sidebarCollapsed ? 'Expand projects' : 'Collapse projects'}
            >
              {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
          {!sidebarCollapsed && (
            projects.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>No projects</div>
              : <ProjectTree projects={projects} selectedId={selectedProject} onSelect={setSelectedProject} />
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Page header */}
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">
              {smeData ? `📁 ${smeData.projectName}` : d ? `📁 ${d.projectName}` : pageSubtitle}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(isManager || isTester) && (
              <button className="btn btn-secondary" onClick={handleExport}
                disabled={!selectedProject} title="Download all test cases as Excel">
                <Download size={14} /> Export Excel
              </button>
            )}
            <button className="btn btn-secondary" onClick={load} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : '' }} />
              Refresh
            </button>
          </div>
        </div>

        {loading && <div className="loading">Loading dashboard…</div>}

        {!loading && !d && !smeData && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">Select a project to view the dashboard</div>
            <div className="empty-sub">Choose a project from the sidebar</div>
          </div>
        )}

        {/* ── SME Department Dashboard ───────────────────────────────── */}
        {!loading && isSME && smeData && (
          <>
            {/* SME Header Banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            }}>
              <Shield size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>
                  Department-Wise Test Case Bifurcation
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {smeData.departmentSummaries.length} departments · {smeData.totalAllCases} total cases · {smeData.totalPendingReview} pending review · {smeData.totalSmeApproved} approved
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#8b5cf6',
                    fontFamily: 'var(--font-mono)' }}>{smeData.totalSmeApproved}</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>
                    Approved
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#d29922',
                    fontFamily: 'var(--font-mono)' }}>{smeData.totalPendingReview}</div>
                  <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase' }}>
                    Pending
                  </div>
                </div>
              </div>
            </div>

            {/* SME Tabs */}
            {tabs.length > 0 && (
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.key} onClick={() => setSmeView(tab.key)} style={{
                      background: 'none', border: 'none',
                      borderBottom: smeView === tab.key ? '2px solid #8b5cf6' : '2px solid transparent',
                      color: smeView === tab.key ? '#8b5cf6' : 'var(--text-3)',
                      padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                      fontFamily: 'var(--font-sans)', transition: 'all 0.15s', marginBottom: -1,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Departments View ──────────────────────────── */}
            {smeView === 'departments' && (
              <>
                {/* Summary stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                  <StatTile label="Total Departments" value={smeData.departmentSummaries.length} color="#8b5cf6" icon={Building2} />
                  <StatTile label="Total Cases"       value={smeData.totalAllCases}          color="var(--accent)" icon={FileText} />
                  <StatTile label="Pending Review"    value={smeData.totalPendingReview}     color="#d29922"       icon={Clock} />
                  <StatTile label="SME Approved"      value={smeData.totalSmeApproved}       color="#bc8cff"       icon={CheckCircle2} />
                </div>

                {/* Department cards grid */}
                {smeData.departmentSummaries.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-text">No department data found</div>
                    <div className="empty-sub">Teams/departments will appear once test cases are created by users with a team assigned</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {smeData.departmentSummaries.map((dept, i) => (
                      <DepartmentCard
                        key={dept.departmentName}
                        dept={dept}
                        color={DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]}
                        expanded={!!expandedDepts[dept.departmentName]}
                        onToggle={() => toggleDept(dept.departmentName)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── Summary View ──────────────────────────────── */}
            {smeView === 'summary' && (
              <>
                {/* Pie chart — Department distribution */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Department Distribution</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {smeData.departmentSummaries.length} departments
                      </span>
                    </div>
                    {deptPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={deptPieData} cx="50%" cy="50%"
                            innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                            {deptPieData.map((e, i) => <Cell key={e.name || i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: 'var(--bg-raised)',
                            border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                            formatter={(v, n) => [`${v} TCs`, n]} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state" style={{ padding: 30 }}>
                        <div className="empty-text">No data</div>
                      </div>
                    )}
                  </div>

                  {/* Bar chart — Department review status */}
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">Review Status by Department</span>
                    </div>
                    {deptBarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={deptBarData} layout="vertical"
                          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                          <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" width={100}
                            tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: 'var(--bg-raised)',
                            border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="Pending Review" stackId="a" fill="#d29922" />
                          <Bar dataKey="SME Approved"   stackId="a" fill="#bc8cff" />
                          <Bar dataKey="Draft"          stackId="a" fill="#8899aa" />
                          <Bar dataKey="In Progress"    stackId="a" fill="#00d4ff" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state" style={{ padding: 30 }}>
                        <div className="empty-text">No data</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Department detail table */}
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-header">
                    <span className="card-title">Department Detail</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {smeData.departmentSummaries.length} departments
                    </span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th style={{ color: 'var(--accent)' }}>Total</th>
                          <th style={{ color: '#d29922' }}>Pending Review</th>
                          <th style={{ color: '#bc8cff' }}>SME Approved</th>
                          <th style={{ color: '#8899aa' }}>Draft</th>
                          <th style={{ color: '#00d4ff' }}>In Progress</th>
                          <th style={{ color: '#3fb950' }}>Passed</th>
                          <th style={{ color: '#f85149' }}>Failed</th>
                          <th>Pass Rate</th>
                          <th>SME Users</th>
                        </tr>
                      </thead>
                      <tbody>
                        {smeData.departmentSummaries.map(dept => (
                          <tr key={dept.departmentName}>
                            <td style={{ fontWeight: 600 }}>{dept.departmentName}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>{dept.totalCases}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#d29922' }}>{dept.pendingReview}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#bc8cff' }}>{dept.smeApproved}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#8899aa' }}>{dept.draftCases}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff' }}>{dept.inProgress}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#3fb950' }}>{dept.passed}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: '#f85149' }}>{dept.failed}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: 'var(--bg-deep)',
                                  borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
                                  <div style={{ height: '100%', borderRadius: 3,
                                    width: `${dept.passRate}%`,
                                    background: dept.passRate >= 80 ? '#3fb950'
                                      : dept.passRate >= 60 ? '#d29922' : '#f85149' }} />
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                                  color: dept.passRate >= 80 ? '#3fb950'
                                    : dept.passRate >= 60 ? '#d29922' : '#f85149' }}>
                                  {dept.passRate}%
                                </span>
                              </div>
                            </td>
                            <td style={{ fontSize: 11, color: 'var(--text2)' }}>
                              {dept.smeUsers?.length > 0
                                ? dept.smeUsers.map(u => u.fullName).join(', ')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SME Users list */}
                {allSmeUsers.length > 0 && (
                  <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                      <span className="card-title">All SME Reviewers</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {allSmeUsers.length} users across {smeData.departmentSummaries.length} departments
                      </span>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                      {allSmeUsers.map(sme => (
                        <div key={sme.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', borderRadius: 7,
                          background: 'var(--bg-raised)', border: '1px solid var(--border)',
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(139,92,246,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#8b5cf6',
                          }}>
                            {sme.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>{sme.fullName}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                              {sme.email} · <span style={{ color: '#8b5cf6' }}>{sme.department}</span>
                            </div>
                          </div>
                          <a href={`mailto:${sme.email}`} style={{
                            display: 'flex', padding: 4, borderRadius: 6,
                            color: 'var(--text3)', cursor: 'pointer',
                            transition: 'all 0.12s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent'; }}>
                            <Mail size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Manager / Tester Dashboard (non-SME) ─────────────────── */}
        {!loading && !isSME && d && (
          <>
            {/* ── Module Execution Status Table (Excel-style) - MOVED TO TOP ─────────────────────── */}
            {modules.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header" style={{ background: '#003366', color: 'white', borderRadius: '8px 8px 0 0' }}>
                  <span className="card-title" style={{ color: 'white' }}>
                    {d?.projectName || 'Project'} : Day 1 - Execution Status
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                    {modules.length} modules
                  </span>
                </div>
                <div className="table-wrap" style={{ overflowX: 'auto' }}>
                  <table style={{ fontSize: 12, minWidth: 1600, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#003366', color: 'white', height: 50 }}>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 120, width: 120, verticalAlign: 'middle', padding: '12px 8px' }}>MODULE</th>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 80, width: 80, verticalAlign: 'middle', padding: '12px 8px' }}>TOTAL TCS</th>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 100, width: 100, verticalAlign: 'middle', padding: '12px 8px' }}>TOTAL<br/>EXECUTABLE<br/>CASES</th>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 80, width: 80, verticalAlign: 'middle', padding: '12px 8px' }}>EXECUTED</th>
                        <th rowSpan={2} style={{ background: '#f57c00', color: 'white', borderRight: '1px solid #e65100', minWidth: 60, width: 60, verticalAlign: 'middle', padding: '12px 8px' }}>PASS</th>
                        <th rowSpan={2} style={{ background: '#1976d2', color: 'white', borderRight: '1px solid #1565c0', minWidth: 60, width: 60, verticalAlign: 'middle', padding: '12px 8px' }}>FAIL</th>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 100, width: 100, verticalAlign: 'middle', padding: '12px 8px' }}>PENDING FOR<br/>EXECUTION</th>
                        <th rowSpan={2} style={{ background: '#1976d2', color: 'white', borderRight: '1px solid #1565c0', minWidth: 110, width: 110, verticalAlign: 'middle', padding: '12px 8px' }}>TEST CASES ON<br/>HOLD DUE TO<br/>OPEN DEFECTS</th>
                        <th rowSpan={2} style={{ background: '#1976d2', color: 'white', borderRight: '1px solid #1565c0', minWidth: 110, width: 110, verticalAlign: 'middle', padding: '12px 8px' }}>COMPLETION %<br/>ON PASSED<br/>TEST CASES</th>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 70, width: 70, verticalAlign: 'middle', padding: '12px 8px' }}>RELEASE<br/>REQ</th>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 50, width: 50, verticalAlign: 'middle', padding: '12px 8px' }}>NA</th>
                        <th rowSpan={2} style={{ background: '#003366', color: 'white', borderRight: '1px solid #004080', minWidth: 80, width: 80, verticalAlign: 'middle', padding: '12px 8px' }}>NOT<br/>RELEASED</th>
                        <th colSpan={4} style={{ background: '#4caf50', color: 'white', textAlign: 'center', borderRight: '1px solid #388e3c', borderBottom: '1px solid #2e7d32', padding: '10px 8px' }}>AUTOMATION</th>
                        <th colSpan={3} style={{ background: '#003366', color: 'white', textAlign: 'center', borderBottom: '1px solid #004080', padding: '10px 8px' }}>MANUAL</th>
                      </tr>
                      <tr style={{ background: '#004080', color: 'white', height: 45 }}>
                        <th style={{ background: '#4caf50', color: 'white', minWidth: 90, width: 90, borderRight: '1px solid #388e3c', padding: '10px 8px' }}>TEST COUNT<br/>AUTOMATION</th>
                        <th style={{ background: '#4caf50', color: 'white', minWidth: 90, width: 90, borderRight: '1px solid #388e3c', padding: '10px 8px' }}>AUTOMATION<br/>%</th>
                        <th style={{ background: '#4caf50', color: 'white', minWidth: 90, width: 90, borderRight: '1px solid #388e3c', padding: '10px 8px' }}>PASS<br/>AUTOMATION</th>
                        <th style={{ background: '#4caf50', color: 'white', minWidth: 100, width: 100, borderRight: '1px solid #004080', padding: '10px 8px' }}>AUTOMATION<br/>COMPLETION %</th>
                        <th style={{ background: '#003366', color: 'white', minWidth: 80, width: 80, borderRight: '1px solid #004080', padding: '10px 8px' }}>TEST COUNT<br/>MANUAL</th>
                        <th style={{ background: '#003366', color: 'white', minWidth: 70, width: 70, borderRight: '1px solid #004080', padding: '10px 8px' }}>PASS<br/>MANUAL</th>
                        <th style={{ background: '#003366', color: 'white', minWidth: 100, width: 100, padding: '10px 8px' }}>MANUAL<br/>COMPLETION %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((m, idx) => {
                        const total = Number(m.total) || 0;
                        const passed = Number(m.passed) || 0;
                        const failed = Number(m.failed) || 0;
                        const naCount = Number(m.naCount) || 0;
                        const notReleased = Number(m.notReleased) || 0;
                        const defectRaised = Number(m.defectRaised) || 0;
                        const releaseRequested = Number(m.releaseRequested) || 0;
                        
                        // Calculate metrics
                        const executableCases = total - naCount;
                        const executed = passed + failed;
                        const pendingForExecution = executableCases - executed;
                        const onHoldDueToDefects = defectRaised;
                        const completionOnPassed = executableCases > 0 ? Math.round((passed / executableCases) * 100) : 0;
                        
                        // Automation vs Manual split (estimate: 85% automation for now - can be adjusted based on actual data)
                        const automationCount = Math.round(total * 0.85);
                        const manualCount = total - automationCount;
                        const automationPct = total > 0 ? Math.round((automationCount / total) * 100) : 0;
                        const passAutomation = Math.round(passed * 0.85);
                        const passManual = passed - passAutomation;
                        const automationCompletionPct = automationCount > 0 ? Math.round((passAutomation / automationCount) * 100) : 0;
                        const manualCompletionPct = manualCount > 0 ? Math.round((passManual / manualCount) * 100) : 0;

                        return (
                          <tr key={m.moduleId} style={{ 
                            background: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-raised)',
                            borderBottom: '1px solid var(--border)',
                            height: 48
                          }}>
                            <td style={{ fontWeight: 600, background: '#003366', color: 'white', padding: '12px 10px', verticalAlign: 'middle' }}>{m.moduleName}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{total}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{executableCases}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{executed}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#fff3e0', color: '#e65100', fontWeight: 700, padding: '12px 8px', verticalAlign: 'middle' }}>{passed}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{failed}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{pendingForExecution}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#e3f2fd', padding: '12px 8px', verticalAlign: 'middle' }}>{onHoldDueToDefects}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#e3f2fd', fontWeight: 700, padding: '12px 8px', verticalAlign: 'middle' }}>{completionOnPassed}%</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{releaseRequested}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{naCount}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{notReleased}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#e8f5e9', padding: '12px 8px', verticalAlign: 'middle' }}>{automationCount}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#e8f5e9', padding: '12px 8px', verticalAlign: 'middle' }}>{automationPct}%</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#e8f5e9', padding: '12px 8px', verticalAlign: 'middle' }}>{passAutomation}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#e8f5e9', fontWeight: 700, padding: '12px 8px', verticalAlign: 'middle' }}>{automationCompletionPct}%</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{manualCount}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>{passManual}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', fontWeight: 700, padding: '12px 8px', verticalAlign: 'middle' }}>{manualCompletionPct}%</td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr style={{ background: '#003366', color: 'white', fontWeight: 700, height: 48 }}>
                        <td style={{ fontWeight: 700, padding: '12px 10px', verticalAlign: 'middle' }}>Total</td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.total) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.total) || 0) - (Number(m.naCount) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.passed) || 0) + (Number(m.failed) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#f57c00', color: 'white', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.passed) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.failed) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => {
                            const total = Number(m.total) || 0;
                            const na = Number(m.naCount) || 0;
                            const passed = Number(m.passed) || 0;
                            const failed = Number(m.failed) || 0;
                            return sum + ((total - na) - (passed + failed));
                          }, 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.defectRaised) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {(() => {
                            const totalExec = modules.reduce((sum, m) => sum + (Number(m.total) || 0) - (Number(m.naCount) || 0), 0);
                            const totalPassed = modules.reduce((sum, m) => sum + (Number(m.passed) || 0), 0);
                            return totalExec > 0 ? Math.round((totalPassed / totalExec) * 100) : 0;
                          })()}%
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.releaseRequested) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.naCount) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {modules.reduce((sum, m) => sum + (Number(m.notReleased) || 0), 0)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#4caf50', color: 'white', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {Math.round(modules.reduce((sum, m) => sum + (Number(m.total) || 0), 0) * 0.85)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#4caf50', color: 'white', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {(() => {
                            const total = modules.reduce((sum, m) => sum + (Number(m.total) || 0), 0);
                            const auto = Math.round(total * 0.85);
                            return total > 0 ? Math.round((auto / total) * 100) : 0;
                          })()}%
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#4caf50', color: 'white', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {Math.round(modules.reduce((sum, m) => sum + (Number(m.passed) || 0), 0) * 0.85)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', background: '#4caf50', color: 'white', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {(() => {
                            const total = modules.reduce((sum, m) => sum + (Number(m.total) || 0), 0);
                            const autoCount = Math.round(total * 0.85);
                            const passAuto = Math.round(modules.reduce((sum, m) => sum + (Number(m.passed) || 0), 0) * 0.85);
                            return autoCount > 0 ? Math.round((passAuto / autoCount) * 100) : 0;
                          })()}%
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {Math.round(modules.reduce((sum, m) => sum + (Number(m.total) || 0), 0) * 0.15)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {Math.round(modules.reduce((sum, m) => sum + (Number(m.passed) || 0), 0) * 0.15)}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '12px 8px', verticalAlign: 'middle' }}>
                          {(() => {
                            const total = modules.reduce((sum, m) => sum + (Number(m.total) || 0), 0);
                            const manualCount = Math.round(total * 0.15);
                            const passManual = Math.round(modules.reduce((sum, m) => sum + (Number(m.passed) || 0), 0) * 0.15);
                            return manualCount > 0 ? Math.round((passManual / manualCount) * 100) : 0;
                          })()}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Row 1: Key stats ──────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 10, marginBottom: 12 }}>
              <StatTile label="Total TCs"    value={d.totalTestCases} color="var(--accent)"
                icon={BarChart2} />
              <StatTile label="Executed"      value={totalExecuted}    color="#00d4ff"
                icon={Activity} subtitle={`${executionPct}% of total`} />
              <StatTile label="Pass"          value={d.passed}         color={S.Pass.color}
                bg={S.Pass.bg}  icon={CheckCircle2} />
              <StatTile label="Fail"          value={d.failed}         color={S.Fail.color}
                bg={S.Fail.bg}  icon={XCircle} />
              <StatTile label="In Progress"   value={d.inProgress}     color={S.InProgress.color}
                bg={S.InProgress.bg} icon={Clock} />
              <StatTile label="Defect Raised" value={d.defectRaised}   color={S.Defect.color}
                bg={S.Defect.bg} icon={AlertTriangle} />
            </div>

            {/* ── Row 2: More metrics ───────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 10, marginBottom: 20 }}>
              <StatTile label="NA"            value={d.naCount}        color={S.NA.color}          bg={S.NA.bg} />
              <StatTile label="Not Released"  value={d.notReleased}    color={S.NotReleased.color} bg={S.NotReleased.bg} />
              <StatTile label="Assigned"      value={d.assigned}       color={S.Assigned.color}    bg={S.Assigned.bg} />
              <StatTile label="Retest"        value={d.retest}         color="#ce93d8" />
              <StatTile label="Pass Rate"
                value={`${d.passRate}%`}
                color={d.passRate >= 80 ? '#00e676' : d.passRate >= 60 ? '#ffd740' : '#ff5252'} />
              <StatTile label="Exec Rate"
                value={`${executionPct}%`}
                color={executionPct >= 80 ? '#00e676' : '#ffb74d'} />
            </div>

            {/* ── Execution progress bars ───────────────────────── */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <span className="card-title">Execution Progress</span>
                <span style={{ fontSize: 11, color: 'var(--text3)',
                  fontFamily: 'var(--font-mono)' }}>
                  {totalExecuted} / {d.totalTestCases} test cases executed
                </span>
              </div>
              <ProgressBar value={executionPct}   color="#00d4ff"  label="Overall Execution Rate" />
              <ProgressBar value={passPct}         color="#00e676"  label="Pass Rate (of executed)" />
              <ProgressBar
                value={d.totalTestCases > 0 ? Math.round(Number(d.defectRaised)/d.totalTestCases*100) : 0}
                color="#ff9800" label="Defect Rate" />
            </div>

            {/* ── Defects summary ───────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr',
              gap: 16, marginBottom: 20 }}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Defects Overview</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Total Defects',    value: defects.length,   color: 'var(--accent)' },
                    { label: 'Open / Active',    value: openDefects,      color: '#ff9800' },
                    { label: 'Critical',         value: criticalDefects,  color: '#ff5252' },
                    { label: 'Fixed / Closed',   value: defects.filter(df => ['FIXED','CLOSED'].includes(df.status)).length, color: '#00e676' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '8px 0',
                      borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color,
                        fontFamily: 'var(--font-mono)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Pie chart ──────────────────────────── */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Status Distribution</span>
                </div>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((e, i) => <Cell key={e.name || i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--bg-raised)',
                        border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        formatter={(v, n) => [`${v} TCs`, n]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: 30 }}>
                    <div className="empty-text">No execution data yet</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Module bar chart ──────────────────────────────── */}
            {barData.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <span className="card-title">Module Execution Breakdown</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {modules.length} modules
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={Math.max(180, barData.length * 26)}>
                  <BarChart data={barData} layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                    <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={120}
                      tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-raised)',
                      border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="Pass"     stackId="a" fill={S.Pass.color} />
                    <Bar dataKey="Fail"     stackId="a" fill={S.Fail.color} />
                    <Bar dataKey="In Prog"  stackId="a" fill={S.InProgress.color} />
                    <Bar dataKey="NA"       stackId="a" fill={S.NA.color} />
                    <Bar dataKey="Not Rel"  stackId="a" fill={S.NotReleased.color} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
