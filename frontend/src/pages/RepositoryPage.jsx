import { useState, useEffect, useCallback, useRef } from 'react';
import { repositoryApi, projectApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import {
  FolderOpen, Upload, Download, Trash2, Archive,
  FileText, FileSpreadsheet, File, Image, X,
  RefreshCw, Search, Plus, ChevronDown, ChevronRight,
  Database, Server, GitBranch, Shield, Folder, Package
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// MODULE TREE STRUCTURE (matches Central_Repository_AI_Module_Design.txt)
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_MODULES = [
  {
    id: 'agilic',
    name: 'AGILIC',
    icon: 'database',
    color: '#3b82f6',
    categories: [
      // Product (renamed from Endowment Products)
      {
        id: 'agilic-product',
        name: 'Product',
        icon: 'package',
        children: [
          { id: 'agilic-product-add', name: 'Add New', icon: 'plus', isAddNew: true }
        ]
      },
      // Product Modification (renamed from Annuity)
      {
        id: 'agilic-product-modification',
        name: 'Product Modification',
        icon: 'folder',
        children: [
          { id: 'agilic-product-modification-add', name: 'Add New', icon: 'plus', isAddNew: true }
        ]
      },
      // PD Calls
      {
        id: 'agilic-pd-calls',
        name: 'PD Calls',
        icon: 'folder',
        children: [
          { id: 'agilic-pd-calls-add', name: 'Add New', icon: 'plus', isAddNew: true },
          { id: 'agilic-pd-calls-number', name: 'Call Number', icon: 'file' },
        ]
      },
      // CR Calls
      {
        id: 'agilic-cr-calls',
        name: 'CR Calls',
        icon: 'folder',
        children: [
          { id: 'agilic-cr-calls-add', name: 'Add New', icon: 'plus', isAddNew: true },
          { id: 'agilic-cr-calls-number', name: 'Call Number', icon: 'file' },
        ]
      },
    ]
  },
  {
    id: 'opus',
    name: 'OPUS',
    icon: 'server',
    color: '#8b5cf6',
    categories: [
      // Product
      {
        id: 'opus-product',
        name: 'Product',
        icon: 'package',
        children: [
          { id: 'opus-product-add', name: 'Add New', icon: 'plus', isAddNew: true }
        ]
      },
      // Product Modification
      {
        id: 'opus-product-modification',
        name: 'Product Modification',
        icon: 'package',
        children: [
          { id: 'opus-product-modification-add', name: 'Add New', icon: 'plus', isAddNew: true }
        ]
      },
      // BAU/NRCR
      {
        id: 'opus-bau-nrcr',
        name: 'BAU/NRCR',
        icon: 'folder',
        children: [
          { id: 'opus-bau-nrcr-add', name: 'Add New', icon: 'plus', isAddNew: true }
        ]
      },
    ]
  },
  {
    id: 'data-migration',
    name: 'Data Migration',
    icon: 'git-branch',
    color: '#10b981',
    categories: [
      { id: 'dm-product', name: 'Product', icon: 'package', children: [] },
      {
        id: 'dm-project', name: 'Project', icon: 'folder',
        children: [
          { id: 'dm-project-nb', name: 'NB', icon: 'file' },
          { id: 'dm-project-ps', name: 'PS', icon: 'file' },
          { id: 'dm-project-claims', name: 'Claims', icon: 'file' },
        ]
      },
      { id: 'dm-scripts', name: 'Migration Scripts', icon: 'file', children: [] },
      { id: 'dm-reports', name: 'Migration Reports', icon: 'file', children: [] },
    ]
  },
  {
    id: 'group-policy',
    name: 'Group Policy',
    icon: 'shield',
    color: '#f59e0b',
    categories: [
      { id: 'gp-product', name: 'Product', icon: 'package', children: [] },
      {
        id: 'gp-project', name: 'Project', icon: 'folder',
        children: [
          { id: 'gp-project-nb', name: 'NB', icon: 'file' },
          { id: 'gp-project-ps', name: 'PS', icon: 'file' },
          { id: 'gp-project-claims', name: 'Claims', icon: 'file' },
        ]
      },
      { id: 'gp-policy-docs', name: 'Policy Documents', icon: 'file', children: [] },
      { id: 'gp-compliance', name: 'Compliance', icon: 'file', children: [] },
    ]
  },
];

// Legacy categories for backward compatibility
const LEGACY_CATEGORIES = [
  { value: 'BUSINESS_REQUIREMENTS', label: 'Business Requirements' },
  { value: 'FUNCTIONAL_REQUIREMENTS', label: 'Functional Requirements' },
  { value: 'TEST_CASES', label: 'Test Cases' },
  { value: 'TEST_DATA', label: 'Test Data' },
  { value: 'USER_GUIDES', label: 'User Guides' },
  { value: 'RELEASE_NOTES', label: 'Release Notes' },
  { value: 'EVIDENCE_FILES', label: 'Evidence Files' },
  { value: 'PROJECT_TEMPLATES', label: 'Project Templates' },
];

const CAT_COLOR = {
  BUSINESS_REQUIREMENTS:  '#3b82f6',
  FUNCTIONAL_REQUIREMENTS:'#8b5cf6',
  TEST_CASES:             '#10b981',
  TEST_DATA:              '#f59e0b',
  USER_GUIDES:            '#06b6d4',
  RELEASE_NOTES:          '#f43f5e',
  EVIDENCE_FILES:         '#84cc16',
  PROJECT_TEMPLATES:      '#ec4899',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getIcon(iconName, size = 16, color) {
  const props = { size, color };
  switch (iconName) {
    case 'database': return <Database {...props} />;
    case 'server': return <Server {...props} />;
    case 'git-branch': return <GitBranch {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'folder': return <Folder {...props} />;
    case 'package': return <Package {...props} />;
    case 'file': return <FileText {...props} />;
    case 'plus': return <Plus {...props} />;
    default: return <FolderOpen {...props} />;
  }
}

function fileIcon(mime) {
  if (!mime) return <File size={16} />;
  if (mime.startsWith('image/')) return <Image size={16} />;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
    return <FileSpreadsheet size={16} />;
  if (mime.includes('pdf') || mime.includes('text') || mime.includes('word'))
    return <FileText size={16} />;
  return <File size={16} />;
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// TREE NODE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function TreeNode({ node, level = 0, selectedPath, onSelect, moduleColor, expandedNodes, toggleExpand }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedPath === node.id;
  const isAddNew = node.isAddNew;
  const paddingLeft = 12 + level * 16;

  // Special styling for "Add New" items
  if (isAddNew) {
    return (
      <div
        onClick={() => onSelect(node.id, node.name, true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          paddingLeft,
          cursor: 'pointer',
          color: moduleColor,
          fontSize: 12,
          fontStyle: 'italic',
          transition: 'all 0.15s',
          opacity: 0.8,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `${moduleColor}10`;
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.opacity = '0.8';
        }}
      >
        <span style={{ width: 14 }} />
        <Plus size={12} color={moduleColor} />
        <span>{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => {
          if (hasChildren) toggleExpand(node.id);
          onSelect(node.id, node.name, false);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          paddingLeft,
          cursor: 'pointer',
          background: isSelected ? `${moduleColor}15` : 'transparent',
          borderLeft: isSelected ? `3px solid ${moduleColor}` : '3px solid transparent',
          transition: 'all 0.15s',
          fontSize: 13,
          color: isSelected ? moduleColor : 'var(--text1)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = isSelected ? `${moduleColor}15` : 'var(--bg-raised)'}
        onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? `${moduleColor}15` : 'transparent'}
      >
        {hasChildren ? (
          isExpanded ? <ChevronDown size={14} color="var(--text3)" /> : <ChevronRight size={14} color="var(--text3)" />
        ) : (
          <span style={{ width: 14 }} />
        )}
        {getIcon(node.icon, 14, isSelected ? moduleColor : 'var(--text2)')}
        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              moduleColor={moduleColor}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function ModulePanel({ module, selectedPath, onSelect, expandedNodes, toggleExpand, isExpanded, onToggleModule, isAdmin }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      {/* Module Header */}
      <div
        onClick={() => onToggleModule(module.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          cursor: 'pointer',
          background: isExpanded ? `${module.color}10` : 'transparent',
          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
          transition: 'all 0.15s',
        }}
      >
        {isExpanded ? <ChevronDown size={16} color={module.color} /> : <ChevronRight size={16} color="var(--text3)" />}
        {getIcon(module.icon, 18, module.color)}
        <span style={{ fontWeight: 600, color: isExpanded ? module.color : 'var(--text1)', flex: 1 }}>
          {module.name}
        </span>
        <span style={{
          fontSize: 10,
          padding: '2px 8px',
          borderRadius: 10,
          background: `${module.color}20`,
          color: module.color,
          fontWeight: 600,
        }}>
          {module.categories.length}
        </span>
      </div>

      {/* Categories Tree */}
      {isExpanded && (
        <div style={{ padding: '4px 0' }}>
          {module.categories.map(cat => (
            <TreeNode
              key={cat.id}
              node={cat}
              level={0}
              selectedPath={selectedPath}
              onSelect={onSelect}
              moduleColor={module.color}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
          {/* Add New Category Button */}
          {isAdmin && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                paddingLeft: 12,
                cursor: 'pointer',
                color: 'var(--text3)',
                fontSize: 12,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-raised)';
                e.currentTarget.style.color = module.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text3)';
              }}
            >
              <Plus size={14} />
              <span>Add Category</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN REPOSITORY PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RepositoryPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProj, setSelectedProj] = useState('');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  // Tree navigation state
  const [modules] = useState(DEFAULT_MODULES);
  const [expandedModules, setExpandedModules] = useState(new Set(['agilic']));
  const [expandedNodes, setExpandedNodes] = useState(new Set(['agilic-product-main', 'agilic-nb-uw']));
  const [selectedPath, setSelectedPath] = useState('agilic-product-name');
  const [selectedName, setSelectedName] = useState('Product Name');
  const [legacyCategory, setLegacyCategory] = useState('');

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCat, setUploadCat] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleSelectPath = (pathId, name, isAddNew = false) => {
    if (isAddNew) {
      // Handle "Add New" click - could open a modal to add new item
      showMsg('info', `Add new item in "${name}" - Coming soon!`);
      return;
    }
    setSelectedPath(pathId);
    setSelectedName(name);
    // Map to legacy category for API compatibility
    const legacyMap = {
      'product': 'BUSINESS_REQUIREMENTS',
      'product name': 'BUSINESS_REQUIREMENTS',
      'nb & uw': 'TEST_CASES',
      'crt': 'TEST_CASES',
      'commission': 'FUNCTIONAL_REQUIREMENTS',
      'claims': 'EVIDENCE_FILES',
      'taxation': 'USER_GUIDES',
      'policy servicing': 'RELEASE_NOTES',
      'module 1': 'TEST_CASES',
      'module 2': 'TEST_DATA',
      'call number': 'PROJECT_TEMPLATES',
    };
    const key = name.toLowerCase();
    setLegacyCategory(legacyMap[key] || '');
  };

  // Load projects
  useEffect(() => {
    projectApi.list().then(r => {
      const list = r.data?.data || r.data || [];
      setProjects(list);
      if (list.length > 0) setSelectedProj(list[0].id);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!selectedProj) return;
    setLoading(true);
    try {
      const res = await repositoryApi.list(selectedProj, legacyCategory || undefined);
      setDocs(res.data?.data || res.data || []);
    } catch {
      showMsg('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [selectedProj, legacyCategory]);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (doc) => {
    try {
      const res = await repositoryApi.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || doc.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showMsg('error', 'Download failed');
    }
  };

  const handleArchive = async (doc) => {
    if (!window.confirm(`Archive "${doc.originalName}"? It will be hidden from the repository.`)) return;
    try {
      await repositoryApi.archive(doc.id);
      showMsg('success', 'Document archived');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Archive failed');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Permanently delete "${doc.originalName}"? This cannot be undone.`)) return;
    try {
      await repositoryApi.delete(doc.id);
      showMsg('success', 'Document deleted');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Delete failed');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadCat) {
      showMsg('error', 'Please select a file and category');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('category', uploadCat);
      if (uploadDesc) fd.append('description', uploadDesc);
      await repositoryApi.upload(selectedProj, fd);
      showMsg('success', `"${uploadFile.name}" uploaded successfully`);
      setShowUpload(false);
      setUploadFile(null);
      setUploadCat('');
      setUploadDesc('');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const filtered = docs.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.originalName?.toLowerCase().includes(q) ||
           d.description?.toLowerCase().includes(q) ||
           d.uploadedBy?.toLowerCase().includes(q);
  });

  // Permission checks - MANAGER/ADMIN only can delete/archive
  const canDelete = ['MANAGER', 'ADMIN'].includes(user?.role);
  const canArchive = ['MANAGER', 'ADMIN'].includes(user?.role);
  const canUpload = ['TESTER', 'MANAGER', 'ADMIN', 'SME'].includes(user?.role);
  const isAdmin = user?.role === 'ADMIN';

  // Get current module color
  const currentModule = modules.find(m => selectedPath.startsWith(m.id)) || modules[0];

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: 'calc(100vh - 120px)' }}>
      {/* ════════════════════════════════════════════════════════════════════════
          LEFT SIDEBAR - MODULE TREE NAVIGATION
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        width: 280,
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 16,
        height: 'fit-content',
        position: 'sticky',
        top: 80,
      }}>
        {/* Sidebar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOpen size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Repository</span>
          </div>
          {isAdmin && (
            <button
              className="btn btn-secondary btn-sm"
              title="Add Module"
              style={{ padding: '4px 8px' }}
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        {/* Project Selector */}
        <div style={{ marginBottom: 16 }}>
          <select
            value={selectedProj}
            onChange={e => setSelectedProj(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-raised)',
              color: 'var(--text1)',
              fontSize: 13,
            }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Modules Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {modules.map(module => (
            <ModulePanel
              key={module.id}
              module={module}
              selectedPath={selectedPath}
              onSelect={handleSelectPath}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              isExpanded={expandedModules.has(module.id)}
              onToggleModule={toggleModule}
              isAdmin={isAdmin}
            />
          ))}

          {/* Add New Module Button */}
          {isAdmin && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                color: 'var(--text3)',
                fontSize: 13,
                border: '2px dashed var(--border)',
                borderRadius: 10,
                transition: 'all 0.15s',
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text3)';
              }}
            >
              <Plus size={16} />
              <span style={{ fontWeight: 500 }}>Add New Module</span>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {getIcon(currentModule.icon, 22, currentModule.color)}
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text1)' }}>
                {currentModule.name}
              </h1>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                <span style={{ color: currentModule.color, fontWeight: 500 }}>{selectedName}</span>
                <span> • {filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={load} title="Refresh">
              <RefreshCw size={14} />
            </button>
            {canUpload && (
              <button
                className="btn btn-primary"
                onClick={() => setShowUpload(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={14} /> Upload
              </button>
            )}
          </div>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{
            marginBottom: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13,
            background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
            color: msg.type === 'success' ? '#10b981' : '#f43f5e',
            border: `1px solid ${msg.type === 'success' ? '#10b98140' : '#f43f5e40'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {msg.text}
            <button onClick={() => setMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
          </div>
        )}

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents…"
              style={{
                width: '100%',
                paddingLeft: 32,
                padding: '8px 12px 8px 32px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-raised)',
                color: 'var(--text1)',
                fontSize: 13,
                boxSizing: 'border-box',
              }}
            />
          </div>
          {search && (
            <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}><X size={13} /></button>
          )}
        </div>

        {/* Documents Grid/Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div>Loading documents…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 60,
            color: 'var(--text3)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            <FolderOpen size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No documents in {selectedName}</div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>Upload your first document to get started.</div>
            {canUpload && (
              <button
                className="btn btn-primary"
                onClick={() => setShowUpload(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={14} /> Upload Document
              </button>
            )}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Document</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Category</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Size</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Version</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Uploaded</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg-raised)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: CAT_COLOR[doc.category] || currentModule.color }}>
                          {fileIcon(doc.mimeType)}
                        </span>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text1)' }}>{doc.originalName}</div>
                          {doc.description && (
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{doc.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600,
                        background: `${CAT_COLOR[doc.category] || currentModule.color}15`,
                        color: CAT_COLOR[doc.category] || currentModule.color,
                      }}>
                        {LEGACY_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>{formatBytes(doc.fileSize)}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--text3)' }}>v{doc.version}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ color: 'var(--text2)', fontSize: 12 }}>{doc.uploadedBy}</div>
                      <div style={{ color: 'var(--text3)', fontSize: 11 }}>{formatDate(doc.uploadedAt)}</div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" title="Download" onClick={() => handleDownload(doc)}>
                          <Download size={13} />
                        </button>
                        {canArchive && (
                          <button className="btn btn-secondary btn-sm" title="Archive" onClick={() => handleArchive(doc)} style={{ color: '#f59e0b' }}>
                            <Archive size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn btn-danger btn-sm" title="Delete" onClick={() => handleDelete(doc)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          UPLOAD MODAL
          ════════════════════════════════════════════════════════════════════════ */}
      {showUpload && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: 28,
            width: 500,
            maxWidth: '95vw',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Upload size={20} color={currentModule.color} />
                <h3 style={{ margin: 0, fontSize: 18 }}>Upload to {selectedName}</h3>
              </div>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Category *</label>
              <select
                value={uploadCat}
                onChange={e => setUploadCat(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-raised)',
                  color: 'var(--text1)', fontSize: 14,
                }}
              >
                <option value="">Select category…</option>
                {LEGACY_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Description</label>
              <textarea
                value={uploadDesc}
                onChange={e => setUploadDesc(e.target.value)}
                rows={3}
                placeholder="Optional description…"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-raised)',
                  color: 'var(--text1)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* File */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>File *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${uploadFile ? currentModule.color : 'var(--border)'}`,
                  borderRadius: 10,
                  padding: 24,
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: uploadFile ? currentModule.color : 'var(--text3)',
                  fontSize: 14,
                  background: uploadFile ? `${currentModule.color}08` : 'var(--bg-raised)',
                  transition: 'all 0.2s',
                }}
              >
                {uploadFile ? (
                  <div>
                    <FileText size={28} style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: 500 }}>{uploadFile.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{formatBytes(uploadFile.size)}</div>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
                    <div>Click to select file</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Supports: PDF, Excel, Word, Images, ZIP</div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files[0] || null)} />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadCat}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: currentModule.color }}
              >
                {uploading ? 'Uploading…' : <><Upload size={14} /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
