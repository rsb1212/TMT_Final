import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  LayoutDashboard, FolderKanban, ClipboardList, Bug, GitBranch, Phone,
  BarChart2, PlayCircle, Users, LogOut, ChevronRight, ChevronLeft,
  Layers, Calendar, CheckSquare, TrendingUp, BookOpen,
  FlaskConical, Activity, TestTube2, Sun, Moon, FolderOpen, Building2,
  PhoneForwarded
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import GlobalSearchBar  from './GlobalSearchBar';
import TenantSelector   from './TenantSelector';
import BatLogo from '../data/bajaj.png';
import './Layout.css';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/',           icon: LayoutDashboard,    label: 'Dashboard',      exact: true },
      { to: '/projects',   icon: FolderKanban,       label: 'Projects' },
      { to: '/test-cases', icon: ClipboardList,      label: 'Test Cases' },
      { to: '/execution',  icon: PlayCircle,         label: 'Execution', roles: ['TESTER','MANAGER','ADMIN'] },
      { to: '/defects',    icon: Bug,                label: 'Defects' },
      { to: '/calls',     icon: Phone,              label: 'QA Calls' },
      { to: '/pdcr-calls', icon: PhoneForwarded,    label: 'PD/CR Calls' },
      { to: '/repository',    icon: FolderOpen,     label: 'Repository',     roles: ['TESTER','MANAGER','ADMIN','SME'] },
      { to: '/release-inbox', icon: LogOut,        label: 'Release Inbox',  roles: ['MANAGER','ADMIN'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/users',            icon: Users,        label: 'Team Members',     roles: ['MANAGER','ADMIN'] },
      { to: '/workload',         icon: Activity,     label: 'Workload',         roles: ['MANAGER','ADMIN'] },
      { to: '/workflow',         icon: GitBranch,    label: 'Workflow / SME',   roles: ['MANAGER','SME','ADMIN'] },
      { to: '/uat-workflow',     icon: FlaskConical, label: 'UAT Workflow',     roles: ['MANAGER','SME','ADMIN'] },
      { to: '/sme-dashboard',    icon: TrendingUp,   label: 'SME Dashboard',    roles: ['MANAGER','SME','ADMIN'] },
      { to: '/assign-by-module', icon: Layers,       label: 'Assign by Module', roles: ['MANAGER','ADMIN'] },
      { to: '/daily-tracking',   icon: Calendar,     label: 'Daily Tracking',   roles: ['MANAGER','ADMIN'] },
      { to: '/productivity',     icon: BarChart2,    label: 'Productivity',     roles: ['MANAGER','ADMIN'] },
      { to: '/requirements',     icon: BookOpen,     label: 'Requirements',     roles: ['MANAGER','ADMIN'] },
    ],
  },
  {
    label: 'My Work',
    items: [
      { to: '/my-cases',    icon: CheckSquare, label: 'My Test Cases',   roles: ['TESTER'] },
      { to: '/productivity',icon: TrendingUp,  label: 'My Productivity', roles: ['TESTER'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/tenants', icon: Building2, label: 'Tenants', roles: ['ADMIN'] },
    ],
  },
];

const ROLE_STYLES = {
  ADMIN:   { bg: 'rgba(225,29,72,0.10)',   text: '#e11d48', dot: '#f43f5e' },
  MANAGER: { bg: 'rgba(2,132,199,0.12)',   text: '#0284c7', dot: '#0ea5e9' },
  SME:     { bg: 'rgba(124,58,237,0.10)',  text: '#7c3aed', dot: '#8b5cf6' },
  TESTER:  { bg: 'rgba(5,150,105,0.10)',   text: '#059669', dot: '#10b981' },
  VIEWER:  { bg: 'rgba(91,138,170,0.10)',  text: '#5b8aaa', dot: '#7fb8d8' },
};

const ROLE_STYLES_DARK = {
  ADMIN:   { bg: 'rgba(244,63,94,0.12)',   text: '#f87171', dot: '#f43f5e' },
  MANAGER: { bg: 'rgba(56,189,248,0.12)',  text: '#38bdf8', dot: '#0ea5e9' },
  SME:     { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', dot: '#8b5cf6' },
  TESTER:  { bg: 'rgba(16,185,129,0.12)',  text: '#6ee7b7', dot: '#10b981' },
  VIEWER:  { bg: 'rgba(127,184,216,0.10)', text: '#7fb8d8', dot: '#5b8aaa' },
};

const initials = name =>
  name ? name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

export default function Layout() {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const palette = isDark ? ROLE_STYLES_DARK : ROLE_STYLES;
  const rs = palette[user?.role] || palette.VIEWER;

  return (
    <div className="layout">

      {/* ── Sidebar ────────────────────────────── */}
      <aside 
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : 'expanded'}`}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
      >
        {/* Collapse Toggle Button */}
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img src={BatLogo} alt="Bat Logo" width={28} height={28} />
          </div>
          <div className="brand-text">
            <span className="brand-name">Test Genii</span>
            <span className="brand-tag">Intelligent Test Knowledge & Management Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(
              item => !item.roles || item.roles.includes(user?.role)
            );
            if (!visible.length) return null;
            return (
              <div key={section.label} className="nav-section">
                <div className="nav-section-label">{section.label}</div>
                {visible.map(({ to, icon: Icon, label, exact }) => (
                  <NavLink
                    key={to} to={to} end={exact}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    data-tooltip={label}
                    title={sidebarCollapsed ? label : ''}
                  >
                    <span className="nav-icon">
                      <Icon size={16} strokeWidth={1.9} />
                    </span>
                    <span className="nav-label">{label}</span>
                    <ChevronRight size={11} className="nav-arrow" />
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* ── Day / Night Toggle ─────────────────── */}
        <button className="theme-toggle-btn" onClick={toggle} title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            {isDark
              ? <Sun  size={14} style={{ color: '#f59e0b' }} />
              : <Moon size={14} style={{ color: '#6b2d45' }} />}
            <span style={{ fontSize: 12 }}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          </span>
          {/* Custom toggle track */}
          <span className={`theme-toggle-track${isDark ? ' active' : ''}`}>
            <span className="theme-toggle-thumb" />
          </span>
        </button>

        {/* User card */}
        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: rs.bg, color: rs.text }}>
            {initials(user?.fullName || user?.username)}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || user?.username}</span>
            <span className="user-role" style={{ background: rs.bg, color: rs.text }}>
              <span className="role-dot" style={{ background: rs.dot }} />
              {user?.role}
            </span>
          </div>
          <button
            className="logout-btn"
            onClick={() => { logout(); navigate('/login'); }}
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>

        {/* Developer credit */}
        <div className="sidebar-credit">
          Developed by <span>UAT-Team</span>
        </div>

      </aside>

      {/* ── Right panel ─────────────────────────── */}
      <div className="main-wrapper">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            <GlobalSearchBar />
          </div>
          <div className="topbar-actions">
            <TenantSelector />
            <NotificationBell />
            <div className="topbar-divider" />
            <div className="topbar-user-pill" style={{ background: rs.bg, color: rs.text }}>
              <span className="role-dot" style={{ background: rs.dot }} />
              {user?.fullName?.split(' ')[0] || user?.username}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
