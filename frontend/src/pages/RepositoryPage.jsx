import { useState, useEffect, useCallback, useRef } from 'react';
import { repositoryApi, projectApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import {
  FolderOpen, Upload, Download, Trash2, Archive,
  FileText, FileSpreadsheet, File, Image, X,
  RefreshCw, Search, Plus, ChevronDown, Eye
} from 'lucide-react';

const CATEGORIES = [
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

export default function RepositoryPage() {
  const { user } = useAuth();
  const [projects,     setProjects]     = useState([]);
  const [selectedProj, setSelectedProj] = useState('');
  const [docs,         setDocs]         = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [msg,          setMsg]          = useState(null);
  const [showUpload,   setShowUpload]   = useState(false);

  // Upload form state
  const [uploadFile,   setUploadFile]   = useState(null);
  const [uploadCat,    setUploadCat]    = useState('');
  const [uploadDesc,   setUploadDesc]   = useState('');
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef();

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
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
      const res = await repositoryApi.list(selectedProj, catFilter || undefined);
      setDocs(res.data?.data || res.data || []);
    } catch {
      showMsg('error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [selectedProj, catFilter]);

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

  // Stats per category
  const catStats = CATEGORIES.map(c => ({
    ...c,
    count: docs.filter(d => d.category === c.value).length,
  }));

  const canDelete  = ['MANAGER', 'ADMIN'].includes(user?.role);
  const canArchive = ['TESTER', 'MANAGER', 'ADMIN', 'SME'].includes(user?.role);
  const canUpload  = ['TESTER', 'MANAGER', 'ADMIN', 'SME'].includes(user?.role);

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderOpen size={22} color="var(--accent)" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Central Repository</h1>
          <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--bg-raised)', padding: '2px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
            {docs.length} document{docs.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={selectedProj} onChange={e => setSelectedProj(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text1)', fontSize: 13 }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={load} title="Refresh">
            <RefreshCw size={14} />
          </button>
          {canUpload && (
            <button className="btn btn-primary" onClick={() => setShowUpload(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> Upload Document
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

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 28, width: 480, maxWidth: '95vw', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Upload to Repository</h3>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Category */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Category *</label>
              <select value={uploadCat} onChange={e => setUploadCat(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text1)', fontSize: 13 }}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Description</label>
              <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                rows={2} placeholder="Optional description…"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text1)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            {/* File */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>File *</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)', borderRadius: 8, padding: 20,
                  textAlign: 'center', cursor: 'pointer', color: 'var(--text3)', fontSize: 13,
                  background: uploadFile ? 'rgba(16,185,129,0.06)' : 'var(--bg-raised)',
                  transition: 'all 0.2s',
                }}>
                {uploadFile
                  ? <span style={{ color: '#10b981' }}>✓ {uploadFile.name} ({formatBytes(uploadFile.size)})</span>
                  : <><Upload size={20} style={{ marginBottom: 4 }} /><br />Click to select file</>}
              </div>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                onChange={e => setUploadFile(e.target.files[0] || null)} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadCat}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {uploading ? 'Uploading…' : <><Upload size={14} /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div
          onClick={() => setCatFilter('')}
          style={{
            background: catFilter === '' ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
            border: `1px solid ${catFilter === '' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>ALL</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{docs.length}</div>
        </div>
        {catStats.filter(c => c.count > 0 || catFilter === c.value).map(c => (
          <div key={c.value}
            onClick={() => setCatFilter(catFilter === c.value ? '' : c.value)}
            style={{
              background: catFilter === c.value ? `${CAT_COLOR[c.value]}18` : 'var(--bg-card)',
              border: `1px solid ${catFilter === c.value ? CAT_COLOR[c.value] : 'var(--border)'}`,
              borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {c.label.split(' ')[0]}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: CAT_COLOR[c.value] }}>{c.count}</div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents…"
            style={{ width: '100%', paddingLeft: 32, padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text1)', fontSize: 13, boxSizing: 'border-box' }} />
        </div>
        {search && (
          <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}><X size={13} /></button>
        )}
      </div>

      {/* Documents table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>
          <FolderOpen size={40} style={{ marginBottom: 10, opacity: 0.3 }} />
          <div>No documents found.</div>
          {canUpload && <div style={{ marginTop: 8, fontSize: 13 }}>Click <b>Upload Document</b> to add the first one.</div>}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Document</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Category</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Size</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Version</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Uploaded By</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--text2)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr key={doc.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'transparent' : 'var(--bg-raised)',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: CAT_COLOR[doc.category] || 'var(--text2)' }}>
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
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
                      background: `${CAT_COLOR[doc.category]}18`,
                      color: CAT_COLOR[doc.category] || 'var(--text2)',
                      border: `1px solid ${CAT_COLOR[doc.category]}40`,
                    }}>
                      {CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{formatBytes(doc.fileSize)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text3)' }}>v{doc.version}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{doc.uploadedBy}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 12 }}>{formatDate(doc.uploadedAt)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-sm" title="Download"
                        onClick={() => handleDownload(doc)}>
                        <Download size={13} />
                      </button>
                      {canArchive && (
                        <button className="btn btn-secondary btn-sm" title="Archive"
                          onClick={() => handleArchive(doc)}
                          style={{ color: '#f59e0b' }}>
                          <Archive size={13} />
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn btn-danger btn-sm" title="Delete"
                          onClick={() => handleDelete(doc)}>
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
  );
}
