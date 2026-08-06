import { useState, useEffect } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, X, Save, Power, PowerOff,
  Users, FolderKanban, Search, ChevronDown, ChevronRight,
  Settings, Layers, RefreshCw
} from 'lucide-react';
import { tenantApi, teamApi, userApi } from '../api';
import { useAuth } from '../hooks/useAuth';

export default function TenantsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('teams'); // 'organization' or 'teams'
  const [tenants, setTenants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [modalType, setModalType] = useState('team'); // 'organization' or 'team'
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Expanded teams for viewing members
  const [expandedTeams, setExpandedTeams] = useState({});
  
  // Form state for organization
  const [orgFormData, setOrgFormData] = useState({
    code: '',
    name: '',
    description: '',
    active: true
  });

  // Form state for team
  const [teamFormData, setTeamFormData] = useState({
    code: '',
    name: '',
    description: '',
    teamType: '',
    department: '',
    channel: '',
    leadId: '',
    sortOrder: 0,
    active: true
  });

  // Options
  const teamTypes = ['QA', 'DEV', 'UAT', 'SUPPORT', 'OPERATIONS', 'GENERAL'];
  const departments = ['Operations', 'Sales', 'IT', 'Compliance', 'Product Team', 'Risk Team', 'General'];
  const channels = ['Branch', 'Digital', 'RM Channel', 'Call Center', 'Partner Channel'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, teamsRes, usersRes] = await Promise.all([
        tenantApi.list().catch(() => ({ data: { data: [] } })),
        teamApi.list().catch(() => ({ data: { data: [] } })),
        userApi.list().catch(() => ({ data: { data: [] } }))
      ]);
      setTenants(tenantsRes.data?.data || []);
      setTeams(teamsRes.data?.data || []);
      const userData = usersRes.data?.data;
      setUsers(Array.isArray(userData) ? userData : (userData?.content || []));
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Organization CRUD ─────────────────────────────────────────────────────
  const handleCreateOrg = () => {
    setModalType('organization');
    setModalMode('create');
    setOrgFormData({ code: '', name: '', description: '', active: true });
    setShowModal(true);
  };

  const handleEditOrg = (tenant) => {
    setModalType('organization');
    setModalMode('edit');
    setSelectedItem(tenant);
    setOrgFormData({
      code: tenant.code || '',
      name: tenant.name || '',
      description: tenant.description || '',
      active: tenant.active !== false
    });
    setShowModal(true);
  };

  const handleSaveOrg = async () => {
    try {
      if (modalMode === 'create') {
        await tenantApi.create(orgFormData);
      } else {
        await tenantApi.update(selectedItem.id, orgFormData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save organization');
    }
  };

  // ─── Team CRUD ─────────────────────────────────────────────────────────────
  const handleCreateTeam = () => {
    setModalType('team');
    setModalMode('create');
    setTeamFormData({
      code: '',
      name: '',
      description: '',
      teamType: 'QA',
      department: '',
      channel: '',
      leadId: '',
      sortOrder: 0,
      active: true
    });
    setShowModal(true);
  };

  const handleEditTeam = (team) => {
    setModalType('team');
    setModalMode('edit');
    setSelectedItem(team);
    setTeamFormData({
      code: team.code || '',
      name: team.name || '',
      description: team.description || '',
      teamType: team.teamType || '',
      department: team.department || '',
      channel: team.channel || '',
      leadId: team.leadId || '',
      sortOrder: team.sortOrder || 0,
      active: team.active !== false
    });
    setShowModal(true);
  };

  const handleSaveTeam = async () => {
    try {
      if (modalMode === 'create') {
        await teamApi.create(teamFormData);
      } else {
        await teamApi.update(selectedItem.id, teamFormData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save team');
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Delete team "${team.name}"? Members will not be deleted but will be unassigned.`)) {
      return;
    }
    try {
      await teamApi.delete(team.id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const toggleTeamExpand = (teamId) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const getTeamMembers = (teamId) => {
    return users.filter(u => u.teamId === teamId);
  };

  const filteredTeams = teams.filter(team =>
    (team.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Building2 size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p style={{ opacity: 0.7 }}>You need administrator privileges to manage organization and teams.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={32} className="spin" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Building2 size={28} /> Organization & Teams</h1>
          <p className="subtitle">Manage your organization structure and teams</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users size={16} /> Teams ({teams.length})
          </button>
          <button
            className={`btn ${activeTab === 'organization' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('organization')}
          >
            <Building2 size={16} /> Organization Settings
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.1)', marginBottom: '1rem' }}>
          <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <>
          {/* Actions Bar */}
          <div className="glass-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
              </div>
              <button className="btn btn-primary" onClick={handleCreateTeam}>
                <Plus size={16} /> New Team
              </button>
            </div>
          </div>

          {/* Teams List */}
          <div className="glass-card">
            {filteredTeams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
                <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No teams found. Create your first team to organize your users.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredTeams.map(team => {
                  const isExpanded = expandedTeams[team.id];
                  const members = getTeamMembers(team.id);
                  
                  return (
                    <div key={team.id} style={{ 
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1rem'
                    }}>
                      {/* Team Row */}
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleTeamExpand(team.id)}
                      >
                        <div style={{ width: '24px' }}>
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        
                        <div style={{ 
                          width: '50px', 
                          height: '50px', 
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <Users size={24} />
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {team.name}
                            <span style={{ 
                              marginLeft: '0.5rem',
                              padding: '0.15rem 0.5rem',
                              fontSize: '0.75rem',
                              background: 'var(--glass-bg)',
                              borderRadius: '4px',
                              opacity: 0.8,
                              fontFamily: 'monospace'
                            }}>
                              {team.code}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.85rem', opacity: 0.7, display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            {team.teamType && <span>📋 {team.teamType}</span>}
                            {team.department && <span>🏢 {team.department}</span>}
                            {team.channel && <span>📡 {team.channel}</span>}
                            {team.leadName && <span>👤 Lead: {team.leadName}</span>}
                          </div>
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: 'var(--glass-bg)',
                          borderRadius: '8px'
                        }}>
                          <Users size={16} />
                          <span style={{ fontWeight: 600 }}>{team.memberCount || members.length}</span>
                          <span style={{ opacity: 0.7 }}>members</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                          <button 
                            className="btn btn-secondary" 
                            title="Edit Team"
                            onClick={() => handleEditTeam(team)}
                            style={{ padding: '0.5rem' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            title="Delete Team"
                            onClick={() => handleDeleteTeam(team)}
                            style={{ padding: '0.5rem', color: 'var(--danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: team.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: team.active ? '#22c55e' : '#ef4444'
                        }}>
                          {team.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>

                      {/* Expanded: Team Members */}
                      {isExpanded && (
                        <div style={{ 
                          marginTop: '1rem', 
                          paddingTop: '1rem', 
                          borderTop: '1px solid var(--border-color)',
                          marginLeft: '2rem'
                        }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Team Members</h4>
                          
                          {members.length === 0 ? (
                            <p style={{ opacity: 0.6, fontStyle: 'italic', margin: 0 }}>
                              No members assigned to this team yet. Assign users from the Users page.
                            </p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                              {members.map(member => (
                                <div key={member.id} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  padding: '0.75rem',
                                  background: 'var(--glass-bg)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'var(--primary-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    color: 'var(--primary)'
                                  }}>
                                    {(member.fullName || member.username || '?')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 500 }}>{member.fullName || member.username}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{member.role}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Organization Settings Tab */}
      {activeTab === 'organization' && (
        <div className="glass-card">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} /> Organization Details
          </h3>
          
          {tenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Building2 size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>No organization configured.</p>
              <button className="btn btn-primary" onClick={handleCreateOrg}>
                <Plus size={16} /> Create Organization
              </button>
            </div>
          ) : (
            <div>
              {tenants.map(org => (
                <div key={org.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '150px 1fr', 
                  gap: '1rem 2rem',
                  alignItems: 'start'
                }}>
                  <div style={{ fontWeight: 500, opacity: 0.7 }}>Organization Code:</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{org.code}</div>
                  
                  <div style={{ fontWeight: 500, opacity: 0.7 }}>Name:</div>
                  <div style={{ fontWeight: 500 }}>{org.name}</div>
                  
                  <div style={{ fontWeight: 500, opacity: 0.7 }}>Description:</div>
                  <div>{org.description || '-'}</div>
                  
                  <div style={{ fontWeight: 500, opacity: 0.7 }}>Status:</div>
                  <div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      background: org.active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: org.active ? '#22c55e' : '#ef4444'
                    }}>
                      {org.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div style={{ fontWeight: 500, opacity: 0.7 }}>Created:</div>
                  <div>{org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '-'}</div>
                  
                  <div style={{ fontWeight: 500, opacity: 0.7 }}>Teams:</div>
                  <div style={{ fontWeight: 600 }}>{teams.length} team(s)</div>
                  
                  <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button className="btn btn-secondary" onClick={() => handleEditOrg(org)}>
                      <Edit2 size={16} /> Edit Organization
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: modalType === 'team' ? '600px' : '500px', padding: '1.5rem', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                {modalType === 'organization' 
                  ? (modalMode === 'create' ? 'Create Organization' : 'Edit Organization')
                  : (modalMode === 'create' ? 'Create Team' : 'Edit Team')
                }
              </h2>
              <button className="btn btn-icon" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {modalType === 'organization' ? (
                // Organization Form
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Organization Code *</label>
                    <input
                      type="text"
                      value={orgFormData.code}
                      onChange={e => setOrgFormData({...orgFormData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '')})}
                      placeholder="e.g., ACME, CORP1"
                      disabled={modalMode === 'edit'}
                      style={{ fontFamily: 'monospace', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    />
                    <small style={{ color: 'var(--text-secondary)' }}>Unique identifier (letters, numbers, underscore, dash only)</small>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Organization Name *</label>
                    <input
                      type="text"
                      value={orgFormData.name}
                      onChange={e => setOrgFormData({...orgFormData, name: e.target.value})}
                      placeholder="e.g., Acme Corporation"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Description</label>
                    <textarea
                      value={orgFormData.description}
                      onChange={e => setOrgFormData({...orgFormData, description: e.target.value})}
                      rows={3}
                      placeholder="Brief description of the organization"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                </div>
              ) : (
                // Team Form
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Team Code *</label>
                    <input
                      type="text"
                      value={teamFormData.code}
                      onChange={e => setTeamFormData({...teamFormData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '')})}
                      placeholder="e.g., QA_TEAM1"
                      disabled={modalMode === 'edit'}
                      style={{ fontFamily: 'monospace', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Team Name *</label>
                    <input
                      type="text"
                      value={teamFormData.name}
                      onChange={e => setTeamFormData({...teamFormData, name: e.target.value})}
                      placeholder="e.g., Quality Assurance Team"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Description</label>
                    <textarea
                      value={teamFormData.description}
                      onChange={e => setTeamFormData({...teamFormData, description: e.target.value})}
                      rows={2}
                      placeholder="Brief description of the team"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Team Type</label>
                    <select
                      value={teamFormData.teamType}
                      onChange={e => setTeamFormData({...teamFormData, teamType: e.target.value})}
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">Select Type...</option>
                      {teamTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Department</label>
                    <select
                      value={teamFormData.department}
                      onChange={e => setTeamFormData({...teamFormData, department: e.target.value})}
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">Select Department...</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Channel</label>
                    <select
                      value={teamFormData.channel}
                      onChange={e => setTeamFormData({...teamFormData, channel: e.target.value})}
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">Select Channel...</option>
                      {channels.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Team Lead</label>
                    <select
                      value={teamFormData.leadId}
                      onChange={e => setTeamFormData({...teamFormData, leadId: e.target.value})}
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">Select Lead...</option>
                      {users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN').map(u => (
                        <option key={u.id} value={u.id}>{u.fullName || u.username} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>Sort Order</label>
                    <input
                      type="number"
                      value={teamFormData.sortOrder}
                      onChange={e => setTeamFormData({...teamFormData, sortOrder: parseInt(e.target.value) || 0})}
                      min="0"
                      style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="team-active"
                      checked={teamFormData.active}
                      onChange={e => setTeamFormData({...teamFormData, active: e.target.checked})}
                      style={{ width: 'auto' }}
                    />
                    <label htmlFor="team-active" style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>Active</label>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={modalType === 'organization' ? handleSaveOrg : handleSaveTeam}
                style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}
              >
                <Save size={16} /> {modalMode === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
