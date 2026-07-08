import { useState, useEffect, useCallback } from 'react';
import { releaseApi, userApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import {
  LogOut, CheckCircle2, XCircle, Clock, RefreshCw,
  User, AlertCircle, ChevronDown, ChevronUp, X
} from 'lucide-react';

const REASON_LABELS = {
  SKILL_MISMATCH:          'Skill Mismatch',
  WORKLOAD_OVERLOAD:       'Workload Overload',
  UNAVAILABLE_ENVIRONMENT:'Environment Unavailable',
  RESOURCE_CONFLICT:       'Resource Conflict',
  KNOWLEDGE_GAP:           'Knowledge Gap',
  ON_LEAVE:                'On Leave',
  TECHNICAL_BLOCKER:       'Technical Blocker',
  REASSIGNMENT_REQUEST:    'Reassignment Request',
  OTHER:                   'Other',
};

const STATUS_STYLE = {
  PENDING:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Pending'  },
  APPROVED: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Approved' },
  REJECTED: { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',  label: 'Rejected' },
};

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ActionModal({ release, onClose, onDone }) {
  const [action,       setAction]       = useState('APPROVED');
  const [note,         setNote]         = useState('');
  const [testers,      setTesters]      = useState([]);
  const [reassignTo,   setReassignTo]   = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    userApi.listTesters().then(r => {
      const list = r.data?.data || r.data || [];
      setTesters(list.filter(u => u.active !== false));
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      await releaseApi.action(release.id, {
        action,
        managerNote: note || undefined,
        reassignToUserId: (action === 'APPROVED' && reassignTo) ? reassignTo : undefined,
      });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to action request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--bg-card)', borderRadius:12, padding:28,
                    width:500, maxWidth:'95vw', border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>Action Release Request</h3>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>
              {release.testCaseCode} — {release.testCaseTitle}
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
              Requested by <b>{release.requestedBy}</b> — {REASON_LABELS[release.reason] || release.reason}
              {release.reasonDetail && ` · "${release.reasonDetail}"`}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', flexShrink:0 }}>
            <X size={18}/>
          </button>
        </div>

        {/* Approve / Reject toggle */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          {['APPROVED','REJECTED'].map(a => (
            <button key={a} onClick={() => setAction(a)}
              style={{
                flex:1, padding:'10px 0', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13,
                border:`1px solid ${action === a ? (a === 'APPROVED' ? '#10b981' : '#f43f5e') : 'var(--border)'}`,
                background: action === a
                  ? (a === 'APPROVED' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)')
                  : 'var(--bg-raised)',
                color: action === a ? (a === 'APPROVED' ? '#10b981' : '#f43f5e') : 'var(--text2)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
              {a === 'APPROVED' ? <CheckCircle2 size={15}/> : <XCircle size={15}/>}
              {a === 'APPROVED' ? 'Approve' : 'Reject'}
            </button>
          ))}
        </div>

        {/* Optional immediate reassignment (only on approve) */}
        {action === 'APPROVED' && (
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, color:'var(--text2)', marginBottom:6 }}>
              Reassign Immediately (optional)
            </label>
            <select value={reassignTo} onChange={e => setReassignTo(e.target.value)}
              style={{ width:'100%', padding:'8px 12px', borderRadius:8,
                       border:'1px solid var(--border)', background:'var(--bg-raised)',
                       color:'var(--text1)', fontSize:13 }}>
              <option value="">— Leave unassigned (RELEASED) —</option>
              {testers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName || t.email}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:13, color:'var(--text2)', marginBottom:6 }}>
            Manager Note {action === 'REJECTED' && <span style={{ color:'#f43f5e' }}>*</span>}
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder={action === 'REJECTED'
              ? 'Explain why the request is rejected…'
              : 'Optional note for the tester…'}
            style={{ width:'100%', padding:'8px 12px', borderRadius:8, resize:'vertical', boxSizing:'border-box',
                     border:'1px solid var(--border)', background:'var(--bg-raised)',
                     color:'var(--text1)', fontSize:13 }}/>
        </div>

        {error && (
          <div style={{ marginBottom:12, padding:'8px 12px', borderRadius:6, fontSize:13,
                        background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'1px solid #f43f5e40' }}>
            {error}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}
            disabled={submitting || (action === 'REJECTED' && !note.trim())}
            style={{
              background: action === 'APPROVED' ? '#10b981' : '#f43f5e',
              borderColor: action === 'APPROVED' ? '#10b981' : '#f43f5e',
              display:'flex', alignItems:'center', gap:6,
            }}>
            {action === 'APPROVED' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
            {submitting ? 'Processing…' : (action === 'APPROVED' ? 'Approve Release' : 'Reject Request')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReleaseInboxPage() {
  const { user } = useAuth();
  const [releases,   setReleases]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [tab,        setTab]        = useState('PENDING');
  const [actionItem, setActionItem] = useState(null);
  const [msg,        setMsg]        = useState(null);
  const [expanded,   setExpanded]   = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await releaseApi.pending();
      setReleases(res.data?.data || res.data || []);
    } catch {
      setMsg({ type: 'error', text: 'Failed to load release requests' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = releases.filter(r =>
    tab === 'ALL' ? true : r.status === tab
  );

  const counts = {
    PENDING:  releases.filter(r => r.status === 'PENDING').length,
    APPROVED: releases.filter(r => r.status === 'APPROVED').length,
    REJECTED: releases.filter(r => r.status === 'REJECTED').length,
    ALL:      releases.length,
  };

  const handleActionDone = () => {
    setActionItem(null);
    setMsg({ type: 'success', text: '✅ Release request actioned successfully' });
    setTimeout(() => setMsg(null), 4000);
    load();
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    flexWrap:'wrap', gap:12, marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <LogOut size={22} color="var(--accent)"/>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>Release Requests</h1>
          {counts.PENDING > 0 && (
            <span style={{ background:'#f43f5e', color:'#fff', borderRadius:20,
                           padding:'2px 10px', fontSize:12, fontWeight:700 }}>
              {counts.PENDING} pending
            </span>
          )}
        </div>
        <button className="btn btn-secondary" onClick={load} title="Refresh">
          <RefreshCw size={14}/>
        </button>
      </div>

      {msg && (
        <div style={{ marginBottom:16, padding:'10px 16px', borderRadius:8, fontSize:13,
                      background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                      color: msg.type === 'success' ? '#10b981' : '#f43f5e',
                      border:`1px solid ${msg.type === 'success' ? '#10b98140' : '#f43f5e40'}`,
                      display:'flex', justifyContent:'space-between' }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit' }}>×</button>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {['PENDING','APPROVED','REJECTED','ALL'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding:'8px 18px', border:'none', background:'none', cursor:'pointer',
              fontSize:13, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--accent)' : 'var(--text2)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom:-1, transition:'all 0.15s',
            }}>
            {t} {counts[t] > 0 && <span style={{ fontSize:11, marginLeft:4,
              background: t === 'PENDING' ? '#f59e0b' : 'var(--bg-raised)',
              color: t === 'PENDING' ? '#fff' : 'var(--text3)',
              padding:'1px 6px', borderRadius:20 }}>{counts[t]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>
          <LogOut size={40} style={{ opacity:0.2, marginBottom:10 }}/>
          <div>No {tab.toLowerCase()} release requests.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(r => {
            const ss = STATUS_STYLE[r.status] || STATUS_STYLE.PENDING;
            const isOpen = expanded[r.id];
            return (
              <div key={r.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)',
                                       borderRadius:10, overflow:'hidden' }}>
                <div style={{ padding:'14px 16px', display:'flex', alignItems:'center',
                              justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                  {/* Left — test case info */}
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:13, color:'var(--accent)' }}>
                        {r.testCaseCode}
                      </span>
                      <span style={{ fontSize:13, color:'var(--text1)' }}>{r.testCaseTitle}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)', display:'flex', gap:12, flexWrap:'wrap' }}>
                      <span><User size={11}/> {r.requestedBy}</span>
                      <span>📋 {REASON_LABELS[r.reason] || r.reason}</span>
                      <span>🕐 {formatDate(r.requestedAt)}</span>
                    </div>
                    {r.reasonDetail && (
                      <div style={{ fontSize:12, color:'var(--text2)', marginTop:4, fontStyle:'italic' }}>
                        "{r.reasonDetail}"
                      </div>
                    )}
                  </div>

                  {/* Right — status + actions */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                                   background: ss.bg, color: ss.color, border:`1px solid ${ss.color}40` }}>
                      {ss.label}
                    </span>
                    {r.status === 'PENDING' && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => setActionItem(r)}
                        style={{ fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                        <AlertCircle size={13}/> Action
                      </button>
                    )}
                    <button onClick={() => toggleExpand(r.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}>
                      {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </button>
                  </div>
                </div>

                {/* Expanded — manager note */}
                {isOpen && (r.managerNote || r.actionedBy) && (
                  <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)',
                                background:'var(--bg-raised)', fontSize:13 }}>
                    {r.actionedBy && (
                      <div style={{ color:'var(--text3)', marginBottom:4 }}>
                        Actioned by <b>{r.actionedBy}</b> on {formatDate(r.actionedAt)}
                      </div>
                    )}
                    {r.managerNote && (
                      <div style={{ color:'var(--text2)' }}>
                        Manager note: {r.managerNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {actionItem && (
        <ActionModal
          release={actionItem}
          onClose={() => setActionItem(null)}
          onDone={handleActionDone}
        />
      )}
    </div>
  );
}
