import { useState, useEffect, useCallback } from 'react';
import { callApi, projectApi, userApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import {
  Phone, Plus, X, Clock, CheckCircle2, XCircle, Calendar,
  Users, Link2, FileText, RefreshCw, ChevronDown, Play,
  AlertTriangle, BookOpen, Video, ExternalLink, Edit2, Trash2,
  BarChart2, ArrowRight
} from 'lucide-react';

/* ── Constants ──────────────────────────────────────────────── */
const CALL_TYPES = [
  { value: 'STANDUP',       label: '☀️ Daily Standup',      color: '#00d4ff' },
  { value: 'DEFECT_TRIAGE', label: '🐛 Defect Triage',       color: '#ff5252' },
  { value: 'UAT_REVIEW',    label: '🧪 UAT Review',          color: '#c084fc' },
  { value: 'TEST_PLANNING', label: '📋 Test Planning',        color: '#00e676' },
  { value: 'SME_REVIEW',    label: '🔍 SME Review',          color: '#ffd740' },
  { value: 'RETROSPECTIVE', label: '🔄 Retrospective',       color: '#ffb74d' },
  { value: 'DEMO',          label: '🎯 Product Demo',        color: '#f06292' },
  { value: 'OTHER',         label: '📌 Other',               color: '#8899aa' },
];

const CALL_STATUSES = [
  { value: 'SCHEDULED',    label: 'Scheduled',    color: '#00d4ff', icon: Clock },
  { value: 'IN_PROGRESS',  label: 'In Progress',  color: '#ffb74d', icon: Play },
  { value: 'COMPLETED',    label: 'Completed',    color: '#00e676', icon: CheckCircle2 },
  { value: 'CANCELLED',    label: 'Cancelled',    color: '#ff5252', icon: XCircle },
  { value: 'RESCHEDULED',  label: 'Rescheduled',  color: '#c084fc', icon: Calendar },
];

const PLATFORMS = ['Google Meet', 'Microsoft Teams', 'Zoom', 'Webex', 'Skype', 'Phone', 'In-Person', 'Other'];

const typeColor  = v => CALL_TYPES.find(t => t.value === v)?.color || '#8899aa';
const typeLabel  = v => CALL_TYPES.find(t => t.value === v)?.label || v;
const statColor  = v => CALL_STATUSES.find(s => s.value === v)?.color || '#8899aa';
const statLabel  = v => CALL_STATUSES.find(s => s.value === v)?.label || v;

/* ── Helpers ──────────────────────────────────────────────────── */
const fmtDateTime = iso => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '—';

const isUpcoming = c => c.status === 'SCHEDULED' && new Date(c.scheduledAt) > new Date();

/* ── Status Badge ─────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const meta = CALL_STATUSES.find(s => s.value === status) || {};
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
      background: `${meta.color || '#8899aa'}18`,
      color: meta.color || '#8899aa',
    }}>
      {meta.label || status}
    </span>
  );
}

/* ── Type Badge ───────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const label = typeLabel(type);
  const color = typeColor(type);
  return (
    <span style={{
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: `${color}18`, color,
    }}>{label}</span>
  );
}

/* ── Stat Tile ────────────────────────────────────────────────── */
function StatTile({ label, value, color, icon: Icon, sub }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 12px', textAlign: 'center',
      borderTop: `3px solid ${color || 'var(--accent)'}`,
    }}>
      {Icon && <Icon size={14} style={{ color, marginBottom: 5, opacity: 0.8 }} />}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22,
        fontWeight: 700, color, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ── Create/Edit Call Modal ───────────────────────────────────── */
function CallModal({ initial, projectId, projects, users, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState({
    title:            initial?.title            || '',
    callType:         initial?.callType         || 'STANDUP',
    projectId:        initial?.project?.id      || projectId || '',
    agenda:           initial?.agenda           || '',
    scheduledAt:      initial?.scheduledAt
      ? new Date(initial.scheduledAt).toISOString().slice(0,16) : '',
    meetingUrl:       initial?.meetingUrl       || '',
    platform:         initial?.platform         || 'Google Meet',
    durationMinutes:  initial?.durationMinutes  || 30,
    isRecurring:      initial?.isRecurring      || false,
    recurrencePattern:initial?.recurrencePattern|| 'WEEKLY',
    participantIds:   initial?.participants?.map(p => p.id) || [],
    testCaseIds:      initial?.testCases?.map(t => t.id)    || [],
    defectIds:        [],
  });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.scheduledAt)  { setError('Scheduled time is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: Number(form.durationMinutes) || null,
        projectId: form.projectId || undefined,
        participantIds: form.participantIds.length ? form.participantIds : undefined,
      };
      if (isEdit) {
        await callApi.update(initial.id, payload);
      } else {
        await callApi.create(payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const toggleParticipant = (id) => {
    setForm(f => ({
      ...f,
      participantIds: f.participantIds.includes(id)
        ? f.participantIds.filter(x => x !== id)
        : [...f.participantIds, id],
    }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 620, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={18} style={{ color: 'var(--accent)' }} />
            <span className="modal-title">{isEdit ? 'Edit Call' : 'Schedule New Call'}</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          {/* Title */}
          <div className="form-group">
            <label>Title / Agenda *</label>
            <input autoFocus required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Sprint-44 Daily Standup / GWG-NB Defect Triage" />
          </div>

          {/* Type + Project row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Call Type *</label>
              <select value={form.callType}
                onChange={e => setForm(f => ({ ...f, callType: e.target.value }))}>
                {CALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Project *</label>
              <select value={form.projectId}
                onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} required>
                <option value="">Select…</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.parentProjectId ? `  ↳ ${p.name}` : p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduled + Duration row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Scheduled At *</label>
              <input type="datetime-local" required value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" min="5" max="480" value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
          </div>

          {/* Platform + Meeting URL */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
            <div className="form-group">
              <label>Platform</label>
              <select value={form.platform}
                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Meeting URL</label>
              <input placeholder="https://meet.google.com/…" value={form.meetingUrl}
                onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} />
            </div>
          </div>

          {/* Agenda */}
          <div className="form-group">
            <label>Agenda / Description</label>
            <textarea rows={3} value={form.agenda}
              placeholder="Topics to discuss, test cases to review, open defects…"
              onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} />
          </div>

          {/* Participants */}
          <div className="form-group">
            <label>Participants ({form.participantIds.length} selected)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 140, overflowY: 'auto',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 10 }}>
              {users.map(u => {
                const selected = form.participantIds.includes(u.id);
                return (
                  <button key={u.id} type="button"
                    onClick={() => toggleParticipant(u.id)}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      background: selected ? 'var(--accent-dim)' : 'transparent',
                      color: selected ? 'var(--accent)' : 'var(--text2)',
                      transition: 'all 0.12s',
                    }}>
                    {u.fullName || u.username}
                    <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>
                      [{u.role}]
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recurring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <input type="checkbox" id="recurring" checked={form.isRecurring}
              onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} />
            <label htmlFor="recurring" style={{ marginBottom: 0, cursor: 'pointer',
              textTransform: 'none', fontSize: 13, letterSpacing: 0, color: 'var(--text2)' }}>
              Recurring call
            </label>
            {form.isRecurring && (
              <select value={form.recurrencePattern} style={{ width: 140 }}
                onChange={e => setForm(f => ({ ...f, recurrencePattern: e.target.value }))}>
                {['DAILY','WEEKLY','BIWEEKLY','MONTHLY'].map(r =>
                  <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit
                ? <><Edit2 size={14} /> Update Call</>
                : <><Phone size={14} /> Schedule Call</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Complete Call Modal (MoM) ────────────────────────────────── */
function CompleteModal({ call, onSave, onClose }) {
  const [form, setForm] = useState({
    startedAt:      call.startedAt ? new Date(call.startedAt).toISOString().slice(0,16)
                    : new Date(call.scheduledAt).toISOString().slice(0,16),
    endedAt:        '',
    durationMinutes:call.durationMinutes || 30,
    minutes:        call.minutes        || '',
    actionItems:    call.actionItems    || '',
    decisions:      call.decisions      || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await callApi.complete(call.id, {
        ...form,
        startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : null,
        endedAt:   form.endedAt   ? new Date(form.endedAt).toISOString()   : null,
        durationMinutes: Number(form.durationMinutes) || null,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete call');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 580 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: '#00e676' }} />
            <span className="modal-title">Complete Call & Save MoM</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14,
          fontFamily: 'var(--font-mono)' }}>
          {call.code} — {call.title}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Started At</label>
              <input type="datetime-local" value={form.startedAt}
                onChange={e => setForm(f => ({ ...f, startedAt: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Ended At</label>
              <input type="datetime-local" value={form.endedAt}
                onChange={e => setForm(f => ({ ...f, endedAt: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Duration (min)</label>
              <input type="number" min="1" value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label>Minutes of Meeting (MoM)</label>
            <textarea rows={4} value={form.minutes}
              placeholder="What was discussed? Key points covered…"
              onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Action Items</label>
            <textarea rows={3} value={form.actionItems}
              placeholder="Who does what by when? (e.g. • Pallavi: retest TC-042 by Friday)"
              onChange={e => setForm(f => ({ ...f, actionItems: e.target.value }))} />
          </div>

          <div className="form-group">
            <label>Decisions Made</label>
            <textarea rows={2} value={form.decisions}
              placeholder="Key decisions agreed upon in this meeting…"
              onChange={e => setForm(f => ({ ...f, decisions: e.target.value }))} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : <><CheckCircle2 size={14} /> Complete & Save Notes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Call Detail Modal ────────────────────────────────────────── */
function CallDetailModal({ call, onClose, onEdit, onComplete, onDelete, canManage }) {
  const statusMeta = CALL_STATUSES.find(s => s.value === call.status) || {};

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 680 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--accent)', marginBottom: 2 }}>{call.code}</div>
            <span className="modal-title">{call.title}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canManage && call.status !== 'COMPLETED' && call.status !== 'CANCELLED' && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={onEdit}>
                  <Edit2 size={12} /> Edit
                </button>
                <button className="btn btn-primary btn-sm" onClick={onComplete}
                  style={{ background: 'rgba(0,230,118,0.15)', color: '#00e676',
                    border: '1px solid rgba(0,230,118,0.3)' }}>
                  <CheckCircle2 size={12} /> Complete
                </button>
              </>
            )}
            <button className="modal-close" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Status + type row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatusBadge status={call.status} />
          <TypeBadge   type={call.callType} />
          {call.platform && (
            <span style={{ fontSize: 12, color: 'var(--text3)',
              display: 'flex', alignItems: 'center', gap: 4 }}>
              <Video size={12} /> {call.platform}
            </span>
          )}
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {[
            { label: 'Project',     value: call.project?.name },
            { label: 'Organiser',   value: call.organiser?.fullName || call.organiser?.username },
            { label: 'Scheduled',   value: fmtDateTime(call.scheduledAt) },
            { label: 'Duration',    value: call.durationMinutes ? `${call.durationMinutes} min` : '—' },
            { label: 'Started',     value: fmtDateTime(call.startedAt) },
            { label: 'Ended',       value: fmtDateTime(call.endedAt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--text1)', fontWeight: 500 }}>
                {value || '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Meeting URL */}
        {call.meetingUrl && (
          <div style={{ marginBottom: 14 }}>
            <a href={call.meetingUrl} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: 'rgba(0,212,255,0.10)', color: 'var(--cyan)',
                textDecoration: 'none', fontSize: 13, fontWeight: 600,
                border: '1px solid rgba(0,212,255,0.2)' }}>
              <Video size={14} /> Join {call.platform || 'Meeting'}
              <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Agenda */}
        {call.agenda && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Agenda</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', background: 'var(--bg-raised)',
              borderRadius: 8, padding: 12, whiteSpace: 'pre-wrap' }}>{call.agenda}</div>
          </div>
        )}

        {/* Participants */}
        {call.participants?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Participants ({call.participants.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {call.participants.map(p => (
                <span key={p.id} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20,
                  background: 'var(--bg-raised)', color: 'var(--text2)',
                  border: '1px solid var(--border)' }}>
                  {p.fullName || p.username}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Linked test cases */}
        {call.testCases?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Test Cases ({call.testCases.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {call.testCases.map(tc => (
                <span key={tc.id} style={{ fontSize: 12, fontFamily: 'var(--font-mono)',
                  padding: '3px 10px', borderRadius: 20,
                  background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {tc.code}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* MoM section — only shown after completion */}
        {call.status === 'COMPLETED' && (call.minutes || call.actionItems || call.decisions) && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} style={{ color: '#00e676' }} />
              Minutes of Meeting
              {call.notesRecordedBy && (
                <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>
                  recorded by {call.notesRecordedBy.fullName || call.notesRecordedBy.username}
                </span>
              )}
            </div>

            {call.minutes && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', marginBottom: 5 }}>Discussion Notes</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg-raised)',
                  borderRadius: 8, padding: 12, whiteSpace: 'pre-wrap' }}>{call.minutes}</div>
              </div>
            )}

            {call.actionItems && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', marginBottom: 5 }}>Action Items</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', background: 'rgba(255,183,77,0.06)',
                  border: '1px solid rgba(255,183,77,0.2)',
                  borderRadius: 8, padding: 12, whiteSpace: 'pre-wrap' }}>{call.actionItems}</div>
              </div>
            )}

            {call.decisions && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', marginBottom: 5 }}>Decisions</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', background: 'rgba(0,230,118,0.06)',
                  border: '1px solid rgba(0,230,118,0.2)',
                  borderRadius: 8, padding: 12, whiteSpace: 'pre-wrap' }}>{call.decisions}</div>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="modal-actions">
          {canManage && call.status !== 'COMPLETED' && (
            <button className="btn btn-danger btn-sm" onClick={() => { onClose(); onDelete(call); }}>
              <Trash2 size={12} /> Delete
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════ */
export default function CallsPage() {
  const { user } = useAuth();
  const [projects,        setProjects]        = useState([]);
  const [users,           setUsers]           = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [calls,           setCalls]           = useState([]);
  const [summary,         setSummary]         = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [activeTab,       setActiveTab]       = useState('list');
  const [modal,           setModal]           = useState(null);
  const [detailCall,      setDetailCall]      = useState(null);
  const [filterType,      setFilterType]      = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [alert,           setAlert]           = useState(null);
  const [page,            setPage]            = useState(0);

  const canManage = ['MANAGER','ADMIN','SME'].includes(user?.role);

  /* ── Load projects + users once ─────────────────────────── */
  useEffect(() => {
    projectApi.list().then(r => {
      const all = r.data.data || [];
      const flat = [];
      all.forEach(p => { flat.push(p); (p.subProjects||[]).forEach(s => flat.push(s)); });
      setProjects(flat);
      if (flat.length > 0) setSelectedProject(flat[0].id);
    }).catch(err => console.error(err));

    // Load all users (managers can see all; fallback to testers list)
    userApi.list(true)
      .then(r => setUsers(r.data.data || []))
      .catch(() =>
        userApi.listTesters()
          .then(r => setUsers(r.data.data || []))
          .catch(err => console.error(err))
      );
  }, []);

  /* ── Load calls when project / filters change ────────────── */
  const loadCalls = useCallback(() => {
    if (!selectedProject) return;
    setLoading(true);
    const params = { page, size: 20 };
    if (filterType)   params.callType = filterType;
    if (filterStatus) params.status   = filterStatus;

    Promise.all([
      callApi.list(selectedProject, params),
      callApi.summary(selectedProject),
    ]).then(([lr, sr]) => {
      setCalls(lr.data.data?.content || lr.data.data || []);
      setSummary(sr.data.data);
    }).catch(err => {
      console.error(err);
      setAlert({ type: 'error', msg: 'Failed to load calls' });
    }).finally(() => setLoading(false));
  }, [selectedProject, filterType, filterStatus, page]);

  useEffect(() => { loadCalls(); }, [loadCalls]);

  const showMsg = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleDelete = async (call) => {
    if (!window.confirm(`Delete "${call.title}"?`)) return;
    try {
      await callApi.delete(call.id);
      showMsg('success', 'Call deleted');
      loadCalls();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusChange = async (callId, newStatus) => {
    try {
      await callApi.updateStatus(callId, { status: newStatus });
      loadCalls();
    } catch (err) {
      showMsg('error', 'Status update failed');
    }
  };

  /* ── Tabs ────────────────────────────────────────────────── */
  const tabs = [
    { id: 'list',     label: 'All Calls',   icon: Phone },
    { id: 'upcoming', label: 'Upcoming',    icon: Calendar },
    { id: 'summary',  label: 'Summary',     icon: BarChart2 },
  ];

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">QA Calls & Meetings</h1>
          <p className="page-subtitle">
            {summary
              ? `${summary.totalCalls} total · ${summary.scheduled} upcoming · ${summary.completed} completed`
              : 'Schedule, track and document QA calls'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={selectedProject} style={{ width: 200 }}
            onChange={e => setSelectedProject(e.target.value)}>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.parentProjectId ? `  ↳ ${p.name}` : p.name}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={loadCalls} title="Refresh">
            <RefreshCw size={14} />
          </button>
          {canManage && (
            <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
              <Plus size={15} /> Schedule Call
            </button>
          )}
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: 14 }}>
          {alert.msg}
          <button onClick={() => setAlert(null)} style={{ float: 'right',
            background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 22 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === tab.id
              ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === tab.id ? 'var(--accent)' : 'var(--text3)',
            padding: '9px 18px', fontSize: 13, fontWeight: 600,
            fontFamily: 'var(--font-sans)', marginBottom: -1,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: ALL CALLS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ width: 180 }}>
              <option value="">All Types</option>
              {CALL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ width: 160 }}>
              <option value="">All Statuses</option>
              {CALL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {(filterType || filterStatus) && (
              <button className="btn btn-secondary btn-sm"
                onClick={() => { setFilterType(''); setFilterStatus(''); }}>
                <X size={11} /> Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">Loading calls…</div>
          ) : calls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📞</div>
              <div className="empty-text">No calls scheduled yet</div>
              {canManage && (
                <div className="empty-sub">Click "Schedule Call" to add the first QA meeting</div>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Call ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Scheduled At</th>
                    <th>Duration</th>
                    <th>Platform</th>
                    <th>Organiser</th>
                    <th>Participants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(call => (
                    <tr key={call.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: 'var(--accent)', fontWeight: 700 }}>
                          {call.code}
                        </span>
                        {call.isRecurring && (
                          <div style={{ fontSize: 9, color: 'var(--text3)' }}>
                            🔄 {call.recurrencePattern}
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <button onClick={() => setDetailCall(call)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            padding: 0, textAlign: 'left' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: 200 }} title={call.title}>
                            {call.title}
                          </div>
                          {call.meetingUrl && (
                            <div style={{ fontSize: 10, color: 'var(--cyan)',
                              display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                              <Link2 size={9} /> Meeting link
                            </div>
                          )}
                        </button>
                      </td>
                      <td><TypeBadge type={call.callType} /></td>
                      <td><StatusBadge status={call.status} /></td>
                      <td style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                        <div>{fmtDate(call.scheduledAt)}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                          {call.scheduledAt ? new Date(call.scheduledAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit'
                          }) : ''}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                        {call.durationMinutes ? `${call.durationMinutes}m` : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {call.platform || '—'}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>
                          {call.organiser?.fullName || call.organiser?.username}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {call.participants?.slice(0, 3).map(p => (
                            <span key={p.id} style={{ fontSize: 10, padding: '1px 6px',
                              borderRadius: 20, background: 'var(--bg-raised)',
                              color: 'var(--text3)' }}>
                              {(p.fullName || p.username)?.split(' ')[0]}
                            </span>
                          ))}
                          {(call.participants?.length || 0) > 3 && (
                            <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                              +{call.participants.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-secondary btn-sm"
                            title="View details"
                            onClick={() => setDetailCall(call)}>
                            <BookOpen size={11} />
                          </button>
                          {canManage && call.status !== 'COMPLETED' && call.status !== 'CANCELLED' && (
                            <>
                              <button className="btn btn-secondary btn-sm"
                                title="Edit"
                                onClick={() => setModal({ mode: 'edit', call })}>
                                <Edit2 size={11} />
                              </button>
                              {call.status !== 'COMPLETED' && (
                                <button
                                  title="Complete & save MoM"
                                  onClick={() => setModal({ mode: 'complete', call })}
                                  style={{ display: 'inline-flex', alignItems: 'center',
                                    gap: 4, padding: '4px 8px', borderRadius: 6,
                                    fontSize: 11, border: 'none', cursor: 'pointer',
                                    background: 'rgba(0,230,118,0.12)', color: '#00e676' }}>
                                  <CheckCircle2 size={11} />
                                </button>
                              )}
                            </>
                          )}
                          {call.meetingUrl && isUpcoming(call) && (
                            <a href={call.meetingUrl} target="_blank" rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center',
                                gap: 3, padding: '4px 8px', borderRadius: 6,
                                background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)',
                                fontSize: 11, textDecoration: 'none', border: 'none',
                                fontWeight: 600 }}>
                              <Video size={11} /> Join
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: UPCOMING
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {summary?.upcomingCalls?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗓️</div>
              <div className="empty-text">No upcoming calls scheduled</div>
            </div>
          ) : (
            summary?.upcomingCalls?.map(call => (
              <div key={call.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 16,
                borderLeft: `4px solid ${typeColor(call.callType)}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: 'var(--accent)' }}>{call.code}</span>
                      <TypeBadge type={call.callType} />
                      <StatusBadge status={call.status} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)',
                      marginBottom: 4 }}>{call.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex',
                      alignItems: 'center', gap: 12 }}>
                      <span><Calendar size={11} style={{ marginRight: 3 }} />
                        {fmtDateTime(call.scheduledAt)}</span>
                      {call.durationMinutes && (
                        <span><Clock size={11} style={{ marginRight: 3 }} />
                          {call.durationMinutes} min</span>
                      )}
                      {call.platform && (
                        <span><Video size={11} style={{ marginRight: 3 }} />
                          {call.platform}</span>
                      )}
                    </div>
                    {call.agenda && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6,
                        fontStyle: 'italic' }}>{call.agenda.slice(0, 120)}{call.agenda.length > 120 ? '…' : ''}</div>
                    )}
                    {call.participants?.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <Users size={12} style={{ color: 'var(--text3)', marginTop: 2 }} />
                        {call.participants.map(p => (
                          <span key={p.id} style={{ fontSize: 11, padding: '1px 8px',
                            borderRadius: 20, background: 'var(--bg-raised)',
                            color: 'var(--text2)' }}>
                            {p.fullName || p.username}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column',
                    gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    {call.meetingUrl && (
                      <a href={call.meetingUrl} target="_blank" rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '7px 14px', borderRadius: 8,
                          background: 'rgba(0,212,255,0.10)', color: 'var(--cyan)',
                          textDecoration: 'none', fontSize: 13, fontWeight: 700,
                          border: '1px solid rgba(0,212,255,0.2)' }}>
                        <Video size={13} /> Join
                      </a>
                    )}
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setDetailCall(call)}>
                      Details <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: SUMMARY DASHBOARD
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'summary' && summary && (
        <>
          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 10, marginBottom: 16 }}>
            <StatTile label="Total Calls"    value={summary.totalCalls}  color="var(--accent)" icon={Phone} />
            <StatTile label="Scheduled"      value={summary.scheduled}   color="#00d4ff"        icon={Calendar} />
            <StatTile label="Completed"      value={summary.completed}   color="#00e676"        icon={CheckCircle2} />
            <StatTile label="Cancelled"      value={summary.cancelled}   color="#ff5252"        icon={XCircle} />
            <StatTile label="In Progress"    value={summary.inProgress}  color="#ffb74d"        icon={Play} />
            <StatTile label="Total Minutes"  value={summary.totalMinutesSpent}
              color="#c084fc" icon={Clock}
              sub={summary.totalMinutesSpent > 60
                ? `${Math.floor(summary.totalMinutesSpent / 60)}h ${summary.totalMinutesSpent % 60}m`
                : ''} />
          </div>

          {/* By type */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Calls by Type</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {[
                { label: 'Standups',      value: summary.standups,      type: 'STANDUP' },
                { label: 'Defect Triage', value: summary.defectTriages, type: 'DEFECT_TRIAGE' },
                { label: 'UAT Reviews',   value: summary.uatReviews,    type: 'UAT_REVIEW' },
                { label: 'Test Planning', value: summary.testPlannings, type: 'TEST_PLANNING' },
                { label: 'SME Reviews',   value: summary.smeReviews,    type: 'SME_REVIEW' },
              ].map(({ label, value, type }) => (
                <div key={type} style={{ textAlign: 'center', padding: '12px 8px',
                  background: 'var(--bg-raised)', borderRadius: 10,
                  border: `1px solid ${typeColor(type)}30` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: typeColor(type),
                    fontFamily: 'var(--font-mono)' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)',
                    textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent with MoM */}
          {summary.recentCalls?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent Calls with MoM</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {summary.recentCalls.map(call => (
                  <div key={call.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', background: 'var(--bg-raised)',
                      borderRadius: 8, cursor: 'pointer',
                      border: '1px solid var(--border)' }}
                    onClick={() => setDetailCall(call)}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                      color: 'var(--accent)', minWidth: 80 }}>{call.code}</span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text1)',
                      fontWeight: 500 }}>{call.title}</span>
                    <TypeBadge type={call.callType} />
                    <span style={{ fontSize: 11, color: 'var(--text3)',
                      whiteSpace: 'nowrap' }}>{fmtDate(call.endedAt)}</span>
                    <ArrowRight size={13} style={{ color: 'var(--text3)' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      {modal?.mode === 'create' && (
        <CallModal
          projectId={selectedProject}
          projects={projects}
          users={users}
          onSave={() => { setModal(null); showMsg('success', 'Call scheduled!'); loadCalls(); }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'edit' && (
        <CallModal
          initial={modal.call}
          projectId={selectedProject}
          projects={projects}
          users={users}
          onSave={() => { setModal(null); showMsg('success', 'Call updated!'); loadCalls(); }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.mode === 'complete' && (
        <CompleteModal
          call={modal.call}
          onSave={() => { setModal(null); showMsg('success', 'MoM saved!'); loadCalls(); }}
          onClose={() => setModal(null)}
        />
      )}

      {detailCall && (
        <CallDetailModal
          call={detailCall}
          canManage={canManage}
          onClose={() => setDetailCall(null)}
          onEdit={() => { setModal({ mode: 'edit', call: detailCall }); setDetailCall(null); }}
          onComplete={() => { setModal({ mode: 'complete', call: detailCall }); setDetailCall(null); }}
          onDelete={(c) => { setDetailCall(null); handleDelete(c); }}
        />
      )}
    </div>
  );
}
