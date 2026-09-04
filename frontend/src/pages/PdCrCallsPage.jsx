import { useState, useEffect, useCallback } from 'react';
import { pdcrCallApi, projectApi } from '../api';
import {
  PhoneForwarded, Plus, X, RefreshCw, Trash2, Edit2, BarChart2,
  AlertTriangle, Clock, CheckCircle2,
} from 'lucide-react';

/* ── Constants ──────────────────────────────────────────────── */
const CALL_TYPES = [
  { value: 'PD',    label: 'PD',    color: '#00d4ff' },
  { value: 'CR',    label: 'CR',    color: '#00e676' },
  { value: 'NR_CR', label: 'NR-CR', color: '#ffb74d' },
  { value: 'OTHER', label: 'Other', color: '#8899aa' },
];

const STATUSES = [
  { value: 'OPEN',         label: 'Open',         color: '#00d4ff' },
  { value: 'IN_PROGRESS',  label: 'In Progress',  color: '#ffb74d' },
  { value: 'UAT',          label: 'UAT',          color: '#c084fc' },
  { value: 'SHOW_STOPPER', label: 'Show Stopper', color: '#ff5252' },
  { value: 'SIGNED_OFF',   label: 'Signed Off',   color: '#00e676' },
  { value: 'CLOSED',       label: 'Closed',       color: '#8899aa' },
];

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const BUCKET_COLORS = {
  '0-10 Days':     '#00e676',
  '11-21 Days':    '#00d4ff',
  '22-50 Days':    '#ffd740',
  '51-150 Days':   '#ffb74d',
  'Over 151 Days': '#ff5252',
};

const typeColor = v => CALL_TYPES.find(t => t.value === v)?.color || '#8899aa';
const typeLabel = v => CALL_TYPES.find(t => t.value === v)?.label || v;
const statColor = v => STATUSES.find(s => s.value === v)?.color || '#8899aa';
const statLabel = v => STATUSES.find(s => s.value === v)?.label || v;

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN',
  { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Small UI atoms ─────────────────────────────────────────── */
function Badge({ label, color }) {
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: `${color}18`, color, whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

function StatTile({ label, value, color, icon: Icon }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 12px', textAlign: 'center',
      borderTop: `3px solid ${color || 'var(--accent)'}`,
    }}>
      {Icon && <Icon size={14} style={{ color, marginBottom: 5, opacity: 0.8 }} />}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700,
        color, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase',
        letterSpacing: '0.6px', marginTop: 4 }}>{label}</div>
    </div>
  );
}

/** Horizontal bar breakdown from a { key: count } map. */
function BreakdownBars({ title, data, colorFor }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: 12 }}>{title}</div>
      {entries.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13 }}>No data</div>}
      {entries.map(([k, v]) => {
        const c = colorFor ? colorFor(k) : 'var(--accent)';
        return (
          <div key={k} style={{ marginBottom: 9 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: 'var(--text2)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: c }}>{v}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--border)' }}>
              <div style={{ width: `${(v / max) * 100}%`, height: '100%',
                borderRadius: 4, background: c }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Create / Edit Modal ────────────────────────────────────── */
const EMPTY = {
  childCallId: '', parentCallId: '', category: '', callType: '',
  testingEnvironment: '', inScope: '', automationScope: '', issueDescription: '',
  priority: '', uatSpoc: '', responsibleSpoc: '', responsibleTeam: '',
  applicationOwner: '', dateAssignedToOwner: '', uatReleaseDate: '',
  uatCompletionTentative: '', uatCompletionActual: '', uatSignoffTentative: '',
  uatSignoffActual: '', currentJiraStatus: '', status: 'OPEN',
  latestUpdate: '', openDefects: '', projectId: '',
};

function CallModal({ initial, projects, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    ...EMPTY,
    ...Object.fromEntries(Object.keys(EMPTY).map(k => [k, initial?.[k] ?? EMPTY[k]])),
    projectId: initial?.projectId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.childCallId.trim()) { setError('Child Call ID is required'); return; }
    setSaving(true);
    try {
      // strip empty strings so backend receives nulls
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? null : v]));
      if (isEdit) await pdcrCallApi.update(initial.id, payload);
      else        await pdcrCallApi.create(payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save call');
    } finally { setSaving(false); }
  };

  const Field = ({ label, k, type = 'text', full, textarea }) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4,
      gridColumn: full ? '1 / -1' : 'auto' }}>
      <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
        letterSpacing: '0.5px' }}>{label}</span>
      {textarea
        ? <textarea value={form[k] || ''} onChange={e => set(k, e.target.value)}
            rows={2} style={inp} />
        : <input type={type} value={form[k] || ''} onChange={e => set(k, e.target.value)}
            style={inp} />}
    </label>
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>{isEdit ? 'Edit PD/CR Call' : 'New PD/CR Call'}</h3>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>
        {error && <div style={errBox}>{error}</div>}
        <form onSubmit={submit}>
          <div style={grid}>
            <Field label="Child Call ID *" k="childCallId" />
            <Field label="Parent Call ID"  k="parentCallId" />
            <Field label="Category (NR-CR / CR / PD)" k="category" />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={lbl}>Call Type</span>
              <select value={form.callType || ''} onChange={e => set('callType', e.target.value)} style={inp}>
                <option value="">— derive from category —</option>
                {CALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={lbl}>Project</span>
              <select value={form.projectId || ''} onChange={e => set('projectId', e.target.value)} style={inp}>
                <option value="">— none —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={lbl}>Priority</span>
              <select value={form.priority || ''} onChange={e => set('priority', e.target.value)} style={inp}>
                <option value="">— none —</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <Field label="Testing Environment" k="testingEnvironment" />
            <Field label="In Scope" k="inScope" />
            <Field label="Automation Scope" k="automationScope" />
            <Field label="Issue Description" k="issueDescription" full textarea />
            <Field label="UAT SPOC" k="uatSpoc" />
            <Field label="Responsible SPOC" k="responsibleSpoc" />
            <Field label="Responsible Team" k="responsibleTeam" />
            <Field label="Application Owner" k="applicationOwner" />
            <Field label="Date Assigned to Owner" k="dateAssignedToOwner" type="date" />
            <Field label="UAT Release Date" k="uatReleaseDate" type="date" />
            <Field label="UAT Completion (Tentative)" k="uatCompletionTentative" type="date" />
            <Field label="UAT Completion (Actual)" k="uatCompletionActual" type="date" />
            <Field label="UAT Sign-off (Tentative)" k="uatSignoffTentative" type="date" />
            <Field label="UAT Sign-off (Actual)" k="uatSignoffActual" type="date" />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={lbl}>Status</span>
              <select value={form.status || 'OPEN'} onChange={e => set('status', e.target.value)} style={inp}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <Field label="Current Jira Status" k="currentJiraStatus" />
            <Field label="Open Defects" k="openDefects" />
            <Field label="Latest Update (UAT)" k="latestUpdate" full textarea />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
            <button type="submit" disabled={saving} style={btnPrimary}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function PdCrCallsPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [dash, setDash] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ callType: '', status: '', owner: '', q: '' });
  const [modal, setModal] = useState(null); // null | {} | row

  useEffect(() => {
    projectApi.listFlat?.().then(r => setProjects(r.data?.data || []))
      .catch(() => projectApi.list().then(r => setProjects(r.data?.data || [])).catch(() => {}));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 0, size: 200 };
      if (projectId) params.projectId = projectId;
      if (filters.callType) params.callType = filters.callType;
      if (filters.status)   params.status   = filters.status;
      if (filters.owner)    params.owner    = filters.owner;
      if (filters.q)        params.q        = filters.q;
      const [dRes, lRes] = await Promise.all([
        pdcrCallApi.dashboard(projectId || undefined),
        pdcrCallApi.list(params),
      ]);
      setDash(dRes.data?.data || null);
      setRows(lRes.data?.data?.content || []);
    } catch {
      setDash(null); setRows([]);
    } finally { setLoading(false); }
  }, [projectId, filters]);

  useEffect(() => { load(); }, [load]);

  const remove = async (row) => {
    if (!window.confirm(`Delete call ${row.childCallId}?`)) return;
    await pdcrCallApi.delete(row.id);
    load();
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PhoneForwarded size={22} style={{ color: 'var(--accent)' }} />
          <h2 style={{ margin: 0 }}>PD / CR Calls</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inp}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={load} style={btnGhost}><RefreshCw size={15} /></button>
          <button onClick={() => setModal({})} style={btnPrimary}>
            <Plus size={15} /> New Call
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
        gap: 10, marginBottom: 14 }}>
        <StatTile label="Total"      value={dash?.total}  color="#00d4ff" icon={BarChart2} />
        <StatTile label="Open"       value={dash?.open}   color="#ffb74d" icon={Clock} />
        <StatTile label="Closed"     value={dash?.closed} color="#00e676" icon={CheckCircle2} />
        <StatTile label="Show Stoppers"
          value={dash?.byStatus?.SHOW_STOPPER || 0} color="#ff5252" icon={AlertTriangle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
        gap: 12, marginBottom: 14 }}>
        <BreakdownBars title="By Call Type"  data={dash?.byCallType} colorFor={typeColor} />
        <BreakdownBars title="By Status"     data={dash?.byStatus}   colorFor={statColor} />
        <BreakdownBars title="Ageing Bucket" data={dash?.byAgeingBucket}
          colorFor={k => BUCKET_COLORS[k] || 'var(--accent)'} />
        <BreakdownBars title="By Application Owner" data={dash?.byApplicationOwner} />
      </div>

      {/* Top ageing */}
      {dash?.topAgeing?.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: 10 }}>
            Top 10 Oldest Open Calls
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dash.topAgeing.map(t => (
              <div key={t.childCallId} style={{ display: 'flex', alignItems: 'center',
                gap: 10, fontSize: 13 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                  minWidth: 100 }}>{t.childCallId}</span>
                <span style={{ color: 'var(--text3)', flex: 1 }}>{t.applicationOwner || '—'}</span>
                <Badge label={statLabel(t.status)} color={statColor(t.status)} />
                <Badge label={`${t.ageingDays}d`}
                  color={BUCKET_COLORS[t.ageingBucket] || 'var(--accent)'} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input placeholder="Search call / issue / SPOC…" value={filters.q}
          onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} style={{ ...inp, flex: 1, minWidth: 180 }} />
        <select value={filters.callType} onChange={e => setFilters(f => ({ ...f, callType: e.target.value }))} style={inp}>
          <option value="">All Types</option>
          {CALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={inp}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input placeholder="Owner" value={filters.owner}
          onChange={e => setFilters(f => ({ ...f, owner: e.target.value }))} style={{ ...inp, width: 120 }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text3)', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {['Call ID', 'Type', 'Issue', 'Priority', 'UAT SPOC', 'Owner',
                'Status', 'Ageing', ''].map(h =>
                <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{ padding: 20, textAlign: 'center',
              color: 'var(--text3)' }}>Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={9} style={{ padding: 20,
              textAlign: 'center', color: 'var(--text3)' }}>No PD/CR calls found</td></tr>}
            {rows.map(r => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={td}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{r.childCallId}</div>
                  {r.parentCallId && <div style={{ fontSize: 10, color: 'var(--text3)' }}>↳ {r.parentCallId}</div>}
                </td>
                <td style={td}><Badge label={typeLabel(r.callType)} color={typeColor(r.callType)} /></td>
                <td style={{ ...td, maxWidth: 280 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' }} title={r.issueDescription}>{r.issueDescription || '—'}</div>
                </td>
                <td style={td}>{r.priority || '—'}</td>
                <td style={td}>{r.uatSpoc || '—'}</td>
                <td style={td}>{r.applicationOwner || '—'}</td>
                <td style={td}><Badge label={statLabel(r.status)} color={statColor(r.status)} /></td>
                <td style={td}>
                  <Badge label={`${r.callsAgeingDays ?? 0}d`}
                    color={BUCKET_COLORS[r.callsAgeingBucket] || 'var(--accent)'} />
                </td>
                <td style={{ ...td, whiteSpace: 'nowrap' }}>
                  <button onClick={() => setModal(r)} style={iconBtn}><Edit2 size={14} /></button>
                  <button onClick={() => remove(r)} style={iconBtn}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <CallModal
          initial={modal.id ? modal : null}
          projects={projects}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

/* ── inline styles ──────────────────────────────────────────── */
const inp = {
  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '7px 10px', color: 'var(--text)', fontSize: 13,
};
const lbl = { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' };
const th = { padding: '10px 12px' };
const td = { padding: '10px 12px', color: 'var(--text2)' };
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 24, overflow: 'auto',
};
const modal = {
  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
  padding: 22, width: 'min(760px, 100%)',
};
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent)',
  color: '#001018', border: 'none', borderRadius: 8, padding: '8px 14px',
  fontWeight: 700, cursor: 'pointer',
};
const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent',
  color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '8px 12px', cursor: 'pointer',
};
const iconBtn = {
  background: 'transparent', border: 'none', color: 'var(--text3)',
  cursor: 'pointer', padding: 5, borderRadius: 6,
};
const errBox = {
  background: '#ff525218', color: '#ff5252', borderRadius: 8,
  padding: '8px 12px', marginBottom: 12, fontSize: 13,
};
