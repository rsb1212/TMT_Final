import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { repositoryModuleApi, repositoryApi, projectApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import {
  FolderOpen, Upload, Download, Trash2, Archive,
  FileText, FileSpreadsheet, File, Image, X,
  RefreshCw, Search, Plus, ChevronDown, ChevronRight,
  Database, Server, GitBranch, Shield, Folder, Package,
  Edit3, Eye, Clock, Star, Share2, Printer, History,
  Info, Lightbulb, AlertTriangle, AlertOctagon, CheckSquare,
  Square, MessageSquare, Send, BookOpen, Layers, Sparkles,
  Paperclip, Hash, ArrowLeft, Check, Copy, FilePlus,
  Bold, Italic, Strikethrough, Code, Table, ListTodo,
  Quote, Minus, UserCheck, CornerDownRight, Bookmark
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT SPACES & TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_SPACES = [
  {
    id: 'agilic',
    name: 'AGILIC',
    description: 'Agilic Insurance Platform Core Knowledge Hub',
    icon: 'database',
    color: '#3b82f6',
    categories: [
      {
        id: 'agilic-product',
        name: 'Product Specifications',
        icon: 'package',
        children: [
          { id: 'agilic-term-plans', name: 'Term Insurance Plans', icon: 'file' },
          { id: 'agilic-endowment', name: 'Endowment Product Rules', icon: 'file' },
          { id: 'agilic-annuity', name: 'Annuity & Pension Schemes', icon: 'file' },
        ]
      },
      {
        id: 'agilic-modification',
        name: 'Product Modification',
        icon: 'folder',
        children: [
          { id: 'agilic-underwriting', name: 'NB & Underwriting Engine', icon: 'file' },
          { id: 'agilic-commission', name: 'Commission Calculation Logic', icon: 'file' },
          { id: 'agilic-claims', name: 'Claims Settlement Matrix', icon: 'file' },
        ]
      },
      {
        id: 'agilic-pd-calls',
        name: 'PD Calls & Clarifications',
        icon: 'folder',
        children: [
          { id: 'agilic-pd-specs', name: 'PD Architecture Decisions', icon: 'file' },
          { id: 'agilic-pd-call-104', name: 'Call #104 - Premium Grace Period', icon: 'file' },
        ]
      },
      {
        id: 'agilic-cr-calls',
        name: 'Change Requests (CR)',
        icon: 'folder',
        children: [
          { id: 'agilic-cr-taxation', name: 'CR #82 - GST Slab Revisions', icon: 'file' },
          { id: 'agilic-cr-surrender', name: 'CR #89 - Special Surrender Formula', icon: 'file' },
        ]
      }
    ]
  },
  {
    id: 'opus',
    name: 'OPUS',
    description: 'Opus Modern Policy Administration Platform',
    icon: 'server',
    color: '#8b5cf6',
    categories: [
      {
        id: 'opus-product',
        name: 'Core Architecture',
        icon: 'package',
        children: [
          { id: 'opus-arch-overview', name: 'Microservices Topology', icon: 'file' },
          { id: 'opus-event-bus', name: 'Kafka Event Bus Contracts', icon: 'file' },
        ]
      },
      {
        id: 'opus-bau-nrcr',
        name: 'BAU & NRCR Guides',
        icon: 'folder',
        children: [
          { id: 'opus-sop-triage', name: 'Production Triage Playbook', icon: 'file' },
          { id: 'opus-batch-jobs', name: 'Daily EOD Batch Operations', icon: 'file' },
        ]
      }
    ]
  },
  {
    id: 'data-migration',
    name: 'Data Migration',
    description: 'Legacy Data Migration Runbooks & Field Mappings',
    icon: 'git-branch',
    color: '#10b981',
    categories: [
      {
        id: 'dm-project',
        name: 'ETL Pipelines',
        icon: 'folder',
        children: [
          { id: 'dm-nb-etl', name: 'NB Customer Data Cleaning SOP', icon: 'file' },
          { id: 'dm-policy-etl', name: 'Policy Servicing Historical Sync', icon: 'file' },
          { id: 'dm-claims-etl', name: 'Claims Reconciliation Runbook', icon: 'file' },
        ]
      },
      { id: 'dm-scripts', name: 'Migration Scripts & DDL', icon: 'file', children: [] },
      { id: 'dm-reports', name: 'Audit & Reconciliation Sign-offs', icon: 'file', children: [] }
    ]
  },
  {
    id: 'group-policy',
    name: 'Group Policy',
    description: 'Corporate and Group Life Insurance Modules',
    icon: 'shield',
    color: '#f59e0b',
    categories: [
      {
        id: 'gp-project',
        name: 'Group Operations',
        icon: 'folder',
        children: [
          { id: 'gp-enrollment', name: 'Bulk Member Enrollment SOP', icon: 'file' },
          { id: 'gp-billing', name: 'Corporate Billing & Float Accounts', icon: 'file' },
          { id: 'gp-compliance', name: 'Statutory Compliance Audit Pack', icon: 'file' },
        ]
      }
    ]
  }
];

const CONFLUENCE_TEMPLATES = [
  {
    id: 'test-plan',
    title: 'Test Plan & Quality Strategy',
    icon: '🎯',
    tags: ['Quality', 'Strategy', 'Sprint'],
    summary: 'Comprehensive QA roadmap detailing scope, test matrices, environments, and sign-off criteria.',
    content: `# 🎯 Test Plan & Quality Strategy

> ℹ️ **Document Status:** Draft | **Author:** QA Lead | **Target Release:** v2.4.0

## 1. Executive Summary
This document establishes the end-to-end verification strategy, target coverage thresholds, and sign-off requirements for the upcoming release cycle.

## 2. Test Objectives & Scope
- [ ] Core business rule validation across product configurations
- [ ] End-to-end user journey smoke and regression coverage
- [ ] Tenant data isolation and strict RBAC authorization checks
- [ ] Third-party API resilience and integration contract testing

## 3. High-Level Test Matrix
| Module Under Test | Target Coverage | Priority | Test Owner |
| :--- | :--- | :--- | :--- |
| Policy Issuance & Quote Engine | 98% | Critical | Lead Automation |
| Underwriting Rules Engine | 92% | High | Domain SME |
| Payment Gateway & Reconciliation | 100% | Critical | Backend Specialist |
| Customer Self-Service Portal | 85% | Medium | UI/UX QA |

## 4. Entry & Exit Criteria
> 💡 **Entry Criteria:** Clean build deployed on QA environment with all unit test suites passing in CI runner.  
> ⚠️ **Exit Criteria:** Zero open P1/P2 defects; >= 95% pass rate across automated regression packs; signed-off SME review.

## 5. Risks & Mitigation Strategies
> 🚨 **Critical Dependency:** Database migration scripts must be validated against sanitized production-like data prior to staging regression.`
  },
  {
    id: 'sop-article',
    title: 'QA Standard Operating Procedure (SOP)',
    icon: '📚',
    tags: ['SOP', 'Playbook', 'Guidelines'],
    summary: 'Step-by-step standard procedure for regression runs, environment setup, and triage.',
    content: `# 📚 Standard Operating Procedure (SOP): Test Execution Lifecycle

> ℹ️ **Category:** Standard Operating Procedures | **Review Frequency:** Bi-Annual

## 1. Purpose & Objective
This SOP defines the standardized protocol that every QA engineer must follow when provisioning environments, executing test runs, logging defects, and obtaining sign-offs.

## 2. Mandatory Verification Checklist
- [ ] **Step 1:** Verify staging environment build version against target Git release tag.
- [ ] **Step 2:** Execute automated sanity test suite to confirm core service availability.
- [ ] **Step 3:** Seed dynamic test dataset using authorized staging fixtures.
- [ ] **Step 4:** Execute module test scenarios and record execution evidence.
- [ ] **Step 5:** Link all identified defects to corresponding requirement IDs and sprint items.

## 3. Escalation & Triage Matrix
| Severity | Definition | Response SLA | Primary Contact |
| :--- | :--- | :--- | :--- |
| **P1 - Blocker** | System down, core workflow completely blocked | < 30 mins | Dev On-Call & QA Lead |
| **P2 - Critical** | Major functionality broken with no workaround | < 2 hours | Module Technical Lead |
| **P3 - Normal** | Minor glitch with functional workaround available | 1 business day | Feature Dev Team |

## 4. Best Practices & Notes
> 💡 **Tip:** Always attach complete network payloads and console screenshots to defect tickets to accelerate triage turnaround.`
  },
  {
    id: 'release-notes',
    title: 'Release Notes & Changelog',
    icon: '🚀',
    tags: ['Release', 'Changelog', 'Deploy'],
    summary: 'Customer and internal facing release summary of features, fixes, and schema updates.',
    content: `# 🚀 Release Notes: Release v2.4.0

> ℹ️ **Deployment Date:** Current Sprint | **Release Manager:** DevOps & QA Steering

## 🌟 What's New & Key Highlights
- **Confluence-style Knowledge Hub:** Seamless living documentation, rich formatting, and team collaboration inside Test Genii.
- **Interactive Checklists & Callouts:** Real-time clickable checklist states for streamlined sign-offs.
- **Automated Table of Contents:** Dynamic section jump navigation for long-form specifications.

## 🛠️ Enhancements & Optimization
- [x] Streamlined multi-tenant document attachments and archival workflows.
- [x] Optimized tree navigation response time on high-volume test repositories.
- [x] Added instant keyword search across living pages and metadata tags.

## 🐛 Bug Fixes & Stability
- Fixed breadcrumb navigation overflow on narrow tablet displays.
- Addressed race condition during high-concurrency document uploads.

## ⚠️ Important Migration Guidelines
> ⚠️ **Notice:** Ensure existing user sessions are refreshed to reload permission scopes for page version restoration.`
  },
  {
    id: 'rca-postmortem',
    title: 'Root Cause Analysis (RCA) & Post-Mortem',
    icon: '🔍',
    tags: ['Post-Mortem', 'Incident', 'RCA'],
    summary: 'Structured incident analysis covering timeline, root cause, impact, and action items.',
    content: `# 🔍 Root Cause Analysis (RCA): Incident Report

> 🚨 **Incident Severity:** SEV-1 | **Outage Window:** 22 Minutes | **Status:** Resolved

## 1. Incident Summary
On staging cluster 02, automated smoke test runners reported persistent timeout errors when communicating with the policy underwriting calculation service.

## 2. Chronological Timeline
| Time (UTC) | Event Description | Handled By |
| :--- | :--- | :--- |
| 14:10 | Automated Datadog alert triggered on latency threshold (> 3500ms) | Monitoring |
| 14:15 | War room initiated; logs confirmed memory leak in PDF generation thread | QA / SRE |
| 14:26 | Hotfix patch applied to worker pool; memory utilization stabilized | DevOps |
| 14:32 | Smoke verification run completed green; cluster declared healthy | QA Team |

## 3. Root Cause Investigation
> ℹ️ **Underlying Cause:** Unclosed file stream in document rendering utility caused worker thread exhaustion under burst concurrent uploads.

## 4. Corrective & Preventive Action Items
- [ ] Refactor stream handling to use 'try-with-resources' pattern across document processors
- [ ] Add explicit heap memory limit alerts at 75% threshold
- [ ] Introduce burst load testing into nightly pipeline regression suites`
  },
  {
    id: 'architecture-spec',
    title: 'System Architecture & Technical Spec',
    icon: '🏗️',
    tags: ['Architecture', 'Tech-Spec', 'Design'],
    summary: 'Technical architecture specification outlining layers, interfaces, and persistence.',
    content: `# 🏗️ Technical Specification: Architecture & Data Flow

> ℹ️ **Module:** Central Repository & Confluence Hub | **Architecture Tier:** Enterprise Fullstack

## 1. System Overview
The Confluence Knowledge Platform delivers unified living documentation, revision history retention, and collaborative commenting tightly bound with test artifacts.

## 2. Architectural Layers
- **Presentation Layer:** Clay-Glass UI components, interactive markdown parser, dynamic TOC generator.
- **REST Services Tier:** Spring Boot controllers with security context injection and multi-tenant isolation.
- **Storage Subsystem:** Hierarchical filesystem snapshot store for versioning coupled with metadata indexing.

## 3. Component Contract Table
| Layer | Interface | Protocol | SLA / Performance |
| :--- | :--- | :--- | :--- |
| UI Navigation | React Virtualized Tree | DOM / State | < 16ms render frame |
| Page Fetch | /api/v1/repository-modules/nodes/:nodeId/page | HTTP/JSON | < 120ms p95 |
| Document Storage | /uploads/repository/ | Stream I/O | Multi-part buffered |

## 4. Security & Audit Guidelines
> 💡 **Security Guarantee:** Node-level authorization prevents unauthorized page edits; every version snapshot archives the editing user identifier and timestamp.`
  },
  {
    id: 'sprint-retro',
    title: 'QA Sprint Review & Retrospective Notes',
    icon: '📝',
    tags: ['Retro', 'Agile', 'Team'],
    summary: 'Agile sprint retrospective notes, velocity metrics, highlights, and blockers.',
    content: `# 📝 QA Sprint Review & Retrospective Notes

> ℹ️ **Sprint:** Sprint 42 | **Facilitator:** QA Lead | **Period:** Current Cycle

## 1. Sprint Goals & Achievement Score
- [x] Automation coverage for New Business quote flows (100% achieved)
- [x] Cross-browser compatibility tests across Chrome, Firefox, and Edge
- [ ] High-volume stress testing on document repository (carried over)

## 2. What Went Well 🎉
- Automated pipeline run duration reduced by 28% after parallelizing test suites.
- Rapid bug reproduction and resolution through direct Slack/Confluence triage.

## 3. Challenges & Roadblocks 🛑
- Delays in test data provisioning for complex annuity calculation scenarios.
- Ambiguity in requirement edge cases for partial policy surrenders.

## 4. Action Items & Commitments
| Action Item | Owner | Target Date | Status |
| :--- | :--- | :--- | :--- |
| Build automated mock data generator for Annuity tests | Lead Dev | Next Friday | In Progress |
| Schedule joint requirement grooming with Business SME | Product Owner | Wednesday | Confirmed |`
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getModuleIcon(iconName, size = 16, color) {
  const props = { size, color };
  switch (iconName) {
    case 'database': return <Database {...props} />;
    case 'server': return <Server {...props} />;
    case 'git-branch': return <GitBranch {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'folder': return <Folder {...props} />;
    case 'package': return <Package {...props} />;
    case 'file': return <FileText {...props} />;
    case 'refresh-cw': return <RefreshCw {...props} />;
    case 'plus': return <Plus {...props} />;
    default: return <FolderOpen {...props} />;
  }
}

function getFileIcon(mime) {
  if (!mime) return <File size={16} color="var(--text3)" />;
  if (mime.startsWith('image/')) return <Image size={16} color="#06b6d4" />;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv'))
    return <FileSpreadsheet size={16} color="#10b981" />;
  if (mime.includes('pdf') || mime.includes('text') || mime.includes('word'))
    return <FileText size={16} color="#3b82f6" />;
  return <File size={16} color="var(--text3)" />;
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return String(ts);
  }
}

function calculateReadingTime(text) {
  if (!text) return '1 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

// ═══════════════════════════════════════════════════════════════════════════
// RICH CONFLUENCE MARKDOWN RENDERER
// ═══════════════════════════════════════════════════════════════════════════

function ConfluenceMarkdownRenderer({ content, onToggleChecklist }) {
  if (!content) {
    return <div style={{ color: 'var(--text3)', fontStyle: 'italic' }}>No content available on this page.</div>;
  }

  // Parse lines into structured blocks
  const lines = content.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Markdown Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }

    // Callout / Blockquote detection
    if (line.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const rawQuote = quoteLines.join('\n');
      let calloutType = 'default';
      if (rawQuote.includes('ℹ️') || rawQuote.includes('[!NOTE]') || rawQuote.includes('[INFO]')) calloutType = 'info';
      else if (rawQuote.includes('💡') || rawQuote.includes('[!TIP]')) calloutType = 'tip';
      else if (rawQuote.includes('⚠️') || rawQuote.includes('[!WARNING]')) calloutType = 'warning';
      else if (rawQuote.includes('🚨') || rawQuote.includes('[!DANGER]') || rawQuote.includes('[!CAUTION]')) calloutType = 'danger';

      blocks.push({ type: 'callout', calloutType, text: rawQuote });
      continue;
    }

    // Code block detection
    if (line.startsWith('```')) {
      const lang = line.replace('```', '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // Checklists detection
    const checklistMatch = line.match(/^(\s*)-\s\[([ xX])\]\s(.*)$/);
    if (checklistMatch) {
      blocks.push({
        type: 'checklist',
        lineIndex: i,
        indent: checklistMatch[1].length,
        checked: checklistMatch[2].toLowerCase() === 'x',
        text: checklistMatch[3]
      });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.replace('# ', '') });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.replace('## ', '') });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.replace('### ', '') });
      i++;
      continue;
    }

    // Divider
    if (line.trim() === '---' || line.trim() === '***') {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Unordered List item
    if (line.match(/^(\s*)-\s(.*)$/)) {
      const match = line.match(/^(\s*)-\s(.*)$/);
      blocks.push({ type: 'list-item', indent: match[1].length, text: match[2] });
      i++;
      continue;
    }

    // Paragraph
    if (line.trim() !== '') {
      blocks.push({ type: 'p', text: line });
    } else {
      blocks.push({ type: 'empty' });
    }
    i++;
  }

  // Helper for inline markdown: bold, italic, code
  const renderInline = (str) => {
    if (!str) return null;
    const parts = [];
    let remaining = str;

    // Quick regex tokenizer for bold, code, and links
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index} style={{ fontWeight: 650, color: 'var(--text1)' }}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index} style={{ fontStyle: 'italic' }}>{token.slice(1, -1)}</em>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} style={{
            background: 'var(--bg-raised)',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: '0.88em',
            color: 'var(--accent)',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts.length > 0 ? parts : str;
  };

  return (
    <div className="confluence-body" style={{ lineHeight: 1.7, fontSize: 14.5, color: 'var(--text1)' }}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1
                key={idx}
                id={`heading-${idx}`}
                style={{
                  fontSize: 26,
                  fontWeight: 750,
                  marginTop: 28,
                  marginBottom: 16,
                  color: 'var(--text1)',
                  letterSpacing: '-0.02em',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 8,
                }}
              >
                {renderInline(block.text)}
              </h1>
            );
          case 'h2':
            return (
              <h2
                key={idx}
                id={`heading-${idx}`}
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  marginTop: 24,
                  marginBottom: 12,
                  color: 'var(--text1)',
                  letterSpacing: '-0.01em',
                }}
              >
                {renderInline(block.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3
                key={idx}
                id={`heading-${idx}`}
                style={{
                  fontSize: 16,
                  fontWeight: 650,
                  marginTop: 18,
                  marginBottom: 8,
                  color: 'var(--text2)',
                }}
              >
                {renderInline(block.text)}
              </h3>
            );
          case 'p':
            return (
              <p key={idx} style={{ marginBottom: 12, color: 'var(--text2)' }}>
                {renderInline(block.text)}
              </p>
            );
          case 'hr':
            return <hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />;
          case 'list-item':
            return (
              <div key={idx} style={{ display: 'flex', gap: 8, marginLeft: block.indent + 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span>
                <span style={{ color: 'var(--text2)' }}>{renderInline(block.text)}</span>
              </div>
            );
          case 'checklist':
            return (
              <div
                key={idx}
                onClick={() => onToggleChecklist && onToggleChecklist(block.lineIndex)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginLeft: block.indent + 8,
                  marginBottom: 6,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {block.checked ? (
                  <CheckSquare size={17} color="var(--green)" style={{ flexShrink: 0 }} />
                ) : (
                  <Square size={17} color="var(--text3)" style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  color: block.checked ? 'var(--text3)' : 'var(--text1)',
                  textDecoration: block.checked ? 'line-through' : 'none',
                }}>
                  {renderInline(block.text)}
                </span>
              </div>
            );
          case 'callout': {
            const config = {
              info: {
                bg: 'rgba(59, 130, 246, 0.08)',
                border: '#3b82f6',
                icon: <Info size={18} color="#3b82f6" />,
                title: 'Note'
              },
              tip: {
                bg: 'rgba(16, 185, 129, 0.08)',
                border: '#10b981',
                icon: <Lightbulb size={18} color="#10b981" />,
                title: 'Tip'
              },
              warning: {
                bg: 'rgba(245, 158, 11, 0.08)',
                border: '#f59e0b',
                icon: <AlertTriangle size={18} color="#f59e0b" />,
                title: 'Warning'
              },
              danger: {
                bg: 'rgba(239, 68, 68, 0.08)',
                border: '#ef4444',
                icon: <AlertOctagon size={18} color="#ef4444" />,
                title: 'Caution'
              },
              default: {
                bg: 'var(--bg-raised)',
                border: 'var(--accent)',
                icon: <Quote size={18} color="var(--accent)" />,
                title: 'Info'
              }
            }[block.calloutType];

            return (
              <div
                key={idx}
                style={{
                  background: config.bg,
                  borderLeft: `4px solid ${config.border}`,
                  borderRadius: '0 8px 8px 0',
                  padding: '12px 16px',
                  margin: '16px 0',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>{config.icon}</div>
                <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text1)' }}>
                  {block.text.split('\n').map((l, lIdx) => (
                    <div key={lIdx} style={{ marginBottom: lIdx === 0 ? 2 : 0 }}>
                      {renderInline(l)}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          case 'table': {
            const rawRows = block.lines.filter(l => !l.match(/^\|(?:\s*:?-+:?\s*\|)+$/)); // filter out separator row
            const rows = rawRows.map(r =>
              r.split('|').map(c => c.trim()).filter((c, cIdx, arr) => cIdx !== 0 && cIdx !== arr.length - 1)
            );
            if (rows.length === 0) return null;
            const headers = rows[0];
            const body = rows.slice(1);

            return (
              <div key={idx} style={{ overflowX: 'auto', margin: '18px 0' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  fontSize: 13.5,
                }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-raised)' }}>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontWeight: 650,
                          color: 'var(--text1)',
                          borderBottom: '2px solid var(--border)',
                        }}>
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        style={{
                          background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: '9px 14px', color: 'var(--text2)' }}>
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          case 'code':
            return (
              <div key={idx} style={{
                background: '#0f172a',
                color: '#e2e8f0',
                borderRadius: 8,
                padding: '14px 18px',
                margin: '16px 0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                overflowX: 'auto',
                position: 'relative'
              }}>
                {block.lang && (
                  <span style={{
                    position: 'absolute',
                    top: 6, right: 12,
                    fontSize: 11,
                    color: '#64748b',
                    textTransform: 'uppercase'
                  }}>
                    {block.lang}
                  </span>
                )}
                <pre style={{ margin: 0, whiteSpace: 'pre' }}>{block.code}</pre>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN REPOSITORY CONFLUENCE PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RepositoryPage() {
  const { user } = useAuth();

  // Spaces & Nodes State
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState('agilic');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeName, setSelectedNodeName] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [starredSet, setStarredSet] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'starred' | 'recent'
  const [recentNodes, setRecentNodes] = useState([]);

  // Living Page Content State
  const [pageData, setPageData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [editorMode, setEditorMode] = useState('split'); // 'edit' | 'split' | 'preview'
  const [isSaving, setIsSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  // Revisions & Versions Drawer
  const [showHistory, setShowHistory] = useState(false);
  const [versionsList, setVersionsList] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Template Picker Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Comments Stream
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Document Attachments
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Create Sub-Page Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentId, setCreateParentId] = useState(null);
  const [createTitle, setCreateTitle] = useState('');

  // Toast / Feedback message
  const [msg, setMsg] = useState(null);
  const showToast = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. LOAD SPACES & MODULES
  // ──────────────────────────────────────────────────────────────────────────

  const loadModuleTree = useCallback(async () => {
    try {
      const res = await repositoryModuleApi.getAllModules();
      const modules = res.data?.data || res.data || [];

      if (modules && modules.length > 0) {
        // Fetch full tree
        const treeRes = await repositoryModuleApi.getTree();
        const treeData = treeRes.data?.data?.modules || treeRes.data?.modules || [];
        if (treeData.length > 0) {
          const mapped = treeData.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            icon: m.icon || 'database',
            color: m.color || '#3b82f6',
            categories: m.children || []
          }));
          setSpaces(mapped);
          if (!activeSpaceId || !mapped.some(s => s.id === activeSpaceId)) {
            setActiveSpaceId(mapped[0].id);
          }
          return;
        }
      }
      // Fallback to DEFAULT_SPACES
      setSpaces(DEFAULT_SPACES);
    } catch (err) {
      console.warn('Backend module load failed, using local spaces:', err);
      setSpaces(DEFAULT_SPACES);
    }
  }, [activeSpaceId]);

  useEffect(() => {
    loadModuleTree();
  }, [loadModuleTree]);

  // Load Starred Nodes
  const loadUserStars = useCallback(async () => {
    try {
      const res = await repositoryModuleApi.getStars();
      const stars = res.data?.data || res.data || [];
      setStarredSet(new Set(stars));
    } catch {
      // Local fallback
      const saved = localStorage.getItem('starred_pages');
      if (saved) {
        try { setStarredSet(new Set(JSON.parse(saved))); } catch {}
      }
    }
  }, []);

  useEffect(() => {
    loadUserStars();
  }, [loadUserStars]);

  // Active Space Object
  const currentSpace = useMemo(() => {
    return spaces.find(s => s.id === activeSpaceId) || spaces[0] || DEFAULT_SPACES[0];
  }, [spaces, activeSpaceId]);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. LOAD SELECTED PAGE CONTENT
  // ──────────────────────────────────────────────────────────────────────────

  const loadPageContent = useCallback(async (nodeId, nodeName) => {
    if (!nodeId) return;
    setPageLoading(true);
    setIsEditing(false);

    try {
      const res = await repositoryModuleApi.getPage(nodeId);
      const data = res.data?.data || res.data;
      if (data) {
        setPageData(data);
        setEditTitle(data.title || nodeName);
        setEditContent(data.content || '');
        setEditTags(data.tags || []);
      }
    } catch (err) {
      console.warn('Could not fetch remote page, generating clean template:', err);
      // Generate clean default page
      const defaultPage = {
        nodeId,
        title: nodeName,
        description: `Documentation for ${nodeName}`,
        tags: ['Documentation', 'Test Genii'],
        version: 1,
        lastModifiedBy: user?.username || 'User',
        lastModifiedAt: new Date().toISOString(),
        content: `# ${nodeName}\n\n> ℹ️ **About this Page**\n> This page is part of the **${currentSpace.name}** knowledge base.\n\n## 📋 Overview\nDocument system architecture, functional test scenarios, test matrices, and SME review notes here.\n\n## 🚀 Acceptance Criteria & Checklists\n- [ ] Review functional scope\n- [ ] Execute automated test suite\n- [ ] Obtain QA Lead & SME sign-off\n\n## 💡 Key Highlights\n| Item | Status | Priority | Notes |\n| :--- | :--- | :--- | :--- |\n| Sanity Check | Completed | High | Verified in staging |\n| Regression Run | In Progress | Medium | Awaiting test results |`
      };
      setPageData(defaultPage);
      setEditTitle(defaultPage.title);
      setEditContent(defaultPage.content);
      setEditTags(defaultPage.tags);
    } finally {
      setPageLoading(false);
    }

    // Load Comments
    try {
      const cRes = await repositoryModuleApi.getComments(nodeId);
      setComments(cRes.data?.data || cRes.data || []);
    } catch {
      setComments([]);
    }

    // Load Document Attachments
    try {
      setDocsLoading(true);
      const dRes = await repositoryModuleApi.getDocuments(nodeId);
      setDocuments(dRes.data?.data || dRes.data || []);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }

    // Track Recent Pages
    setRecentNodes(prev => {
      const next = [{ id: nodeId, name: nodeName, spaceName: currentSpace.name }, ...prev.filter(p => p.id !== nodeId)];
      return next.slice(0, 8);
    });
  }, [currentSpace, user]);

  // Select initial node on first space load
  useEffect(() => {
    if (!selectedNodeId && currentSpace) {
      const firstCat = currentSpace.categories?.[0];
      if (firstCat) {
        const firstNode = firstCat.children?.[0] || firstCat;
        setSelectedNodeId(firstNode.id);
        setSelectedNodeName(firstNode.name);
        setExpandedNodes(new Set([firstCat.id]));
        loadPageContent(firstNode.id, firstNode.name);
      }
    }
  }, [currentSpace, selectedNodeId, loadPageContent]);

  // Handle node selection
  const handleSelectNode = (node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeName(node.name);
    loadPageContent(node.id, node.name);
  };

  const toggleNodeExpand = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 3. PAGE ACTIONS: SAVE, STAR, SHARE, PRINT, CHECKLIST TOGGLE
  // ──────────────────────────────────────────────────────────────────────────

  const handleSavePage = async () => {
    if (!selectedNodeId) return;
    setIsSaving(true);
    try {
      const payload = {
        title: editTitle.trim() || selectedNodeName,
        content: editContent,
        tags: editTags,
      };
      const res = await repositoryModuleApi.savePage(selectedNodeId, payload);
      const updated = res.data?.data || res.data;
      setPageData(updated || { ...pageData, ...payload, version: (pageData?.version || 1) + 1 });
      setIsEditing(false);
      showToast('success', 'Page published and saved successfully!');
    } catch (err) {
      // Offline / optimistic update
      setPageData(prev => ({
        ...prev,
        title: editTitle,
        content: editContent,
        tags: editTags,
        version: (prev?.version || 1) + 1,
        lastModifiedAt: new Date().toISOString()
      }));
      setIsEditing(false);
      showToast('success', 'Page saved (local state)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStar = async () => {
    if (!selectedNodeId) return;
    const isStarred = starredSet.has(selectedNodeId);
    const newSet = new Set(starredSet);
    if (isStarred) newSet.delete(selectedNodeId);
    else newSet.add(selectedNodeId);
    setStarredSet(newSet);
    localStorage.setItem('starred_pages', JSON.stringify([...newSet]));

    try {
      await repositoryModuleApi.toggleStar(selectedNodeId);
      showToast('success', isStarred ? 'Removed from starred' : 'Page starred!');
    } catch {
      showToast('success', isStarred ? 'Removed from starred' : 'Page starred!');
    }
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    showToast('success', 'Page link copied to clipboard!');
  };

  const handlePrintExport = () => {
    window.print();
  };

  // Interactive Checklist Toggle in Reading View
  const handleToggleChecklist = (lineIndex) => {
    if (!pageData?.content) return;
    const lines = pageData.content.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const target = lines[lineIndex];
      if (target.includes('- [ ]')) {
        lines[lineIndex] = target.replace('- [ ]', '- [x]');
      } else if (target.includes('- [x]') || target.includes('- [X]')) {
        lines[lineIndex] = target.replace(/- \[[xX]\]/, '- [ ]');
      }
      const newContent = lines.join('\n');
      setPageData(prev => ({ ...prev, content: newContent }));
      setEditContent(newContent);
      // Auto-save silently
      repositoryModuleApi.savePage(selectedNodeId, {
        title: pageData.title,
        content: newContent,
        tags: pageData.tags
      }).catch(() => {});
    }
  };

  // Revision History
  const handleOpenHistory = async () => {
    setShowHistory(true);
    setLoadingVersions(true);
    try {
      const res = await repositoryModuleApi.getVersions(selectedNodeId);
      setVersionsList(res.data?.data || res.data || []);
    } catch {
      setVersionsList([
        { version: pageData?.version || 1, savedAt: pageData?.lastModifiedAt, savedBy: pageData?.lastModifiedBy, title: pageData?.title }
      ]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (version) => {
    if (!window.confirm(`Restore version v${version}? This will become the current page draft.`)) return;
    try {
      const res = await repositoryModuleApi.restoreVersion(selectedNodeId, version);
      const restored = res.data?.data || res.data;
      setPageData(restored);
      setEditTitle(restored.title);
      setEditContent(restored.content);
      setShowHistory(false);
      showToast('success', `Version v${version} restored successfully!`);
    } catch (err) {
      showToast('error', 'Failed to restore version: ' + (err.response?.data?.message || err.message));
    }
  };

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedNodeId) return;
    setSubmittingComment(true);
    const newComment = {
      id: Date.now().toString(),
      text: commentText.trim(),
      author: user?.username || 'You',
      authorRole: user?.role || 'TESTER',
      createdAt: new Date().toISOString()
    };
    try {
      const res = await repositoryModuleApi.addComment(selectedNodeId, commentText.trim());
      const saved = res.data?.data || res.data;
      setComments(prev => [...prev, saved || newComment]);
      setCommentText('');
      showToast('success', 'Comment added');
    } catch {
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      showToast('success', 'Comment added');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Document Uploads & Downloads
  const handleUploadDocument = async () => {
    if (uploadFiles.length === 0 || !selectedNodeId) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      uploadFiles.forEach(f => fd.append('file', f));
      if (uploadDesc) fd.append('description', uploadDesc);

      const res = await repositoryModuleApi.uploadDocument(selectedNodeId, fd);
      const newDoc = res.data?.data || res.data;
      setDocuments(prev => [newDoc, ...prev]);
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDesc('');
      showToast('success', 'File attached successfully');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Attachment upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDoc = async (doc) => {
    try {
      const res = await repositoryApi.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || doc.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast('error', 'Download failed');
    }
  };

  const handleArchiveDoc = async (docId) => {
    if (!window.confirm('Archive this document?')) return;
    try {
      await repositoryModuleApi.archiveDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      showToast('success', 'Document archived');
    } catch (err) {
      showToast('error', 'Archive failed');
    }
  };

  // Create Sub-Page
  const handleCreateSubPage = async () => {
    if (!createTitle.trim()) return;
    const newId = `node-${Date.now()}`;
    const newNode = {
      id: newId,
      name: createTitle.trim(),
      icon: 'file',
      children: []
    };

    try {
      // Call backend createNode if available
      await repositoryModuleApi.createNode({
        moduleId: currentSpace.id,
        parentId: createParentId,
        name: createTitle.trim(),
        nodeType: 'DOCUMENT_CONTAINER'
      });
    } catch {
      // Local addition to space
      currentSpace.categories = currentSpace.categories || [];
      if (createParentId) {
        const findAndAdd = (nodes) => {
          for (let n of nodes) {
            if (n.id === createParentId) {
              n.children = n.children || [];
              n.children.push(newNode);
              return true;
            }
            if (n.children && findAndAdd(n.children)) return true;
          }
          return false;
        };
        findAndAdd(currentSpace.categories);
      } else {
        currentSpace.categories.push(newNode);
      }
      setSpaces([...spaces]);
    }

    setShowCreateModal(false);
    setCreateTitle('');
    setSelectedNodeId(newId);
    setSelectedNodeName(newNode.name);
    loadPageContent(newId, newNode.name);
    showToast('success', `Page "${newNode.name}" created!`);
  };

  // Template Insertion
  const handleInsertTemplate = (tpl) => {
    setEditTitle(tpl.title);
    setEditContent(tpl.content);
    setEditTags(tpl.tags);
    setShowTemplateModal(false);
    showToast('success', `Template "${tpl.title}" applied!`);
  };

  // Seed default modules (Admin)
  const handleSeedDefaults = async () => {
    try {
      await repositoryModuleApi.seedModules();
      showToast('success', 'Default Confluence modules seeded!');
      loadModuleTree();
    } catch (err) {
      showToast('error', 'Failed to seed modules: ' + (err.response?.data?.message || err.message));
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 4. TABLE OF CONTENTS EXTRACTOR
  // ──────────────────────────────────────────────────────────────────────────

  const tableOfContents = useMemo(() => {
    const text = isEditing ? editContent : pageData?.content;
    if (!text) return [];
    const headings = [];
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if (line.startsWith('# ')) {
        headings.push({ level: 1, text: line.replace('# ', '').replace(/[*_`]/g, ''), id: `heading-${idx}` });
      } else if (line.startsWith('## ')) {
        headings.push({ level: 2, text: line.replace('## ', '').replace(/[*_`]/g, ''), id: `heading-${idx}` });
      } else if (line.startsWith('### ')) {
        headings.push({ level: 3, text: line.replace('### ', '').replace(/[*_`]/g, ''), id: `heading-${idx}` });
      }
    });
    return headings;
  }, [isEditing, editContent, pageData?.content]);

  // Filtered Tree Nodes based on search
  const filterNodes = (nodes) => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.reduce((acc, node) => {
      const matchSelf = node.name.toLowerCase().includes(q);
      const filteredChildren = node.children ? filterNodes(node.children) : [];
      if (matchSelf || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  // Filtered tree for current space
  const visibleCategories = useMemo(() => {
    if (activeTab === 'starred') {
      const collectStarred = (nodes) => {
        let list = [];
        for (let n of nodes) {
          if (starredSet.has(n.id)) list.push(n);
          if (n.children) list = list.concat(collectStarred(n.children));
        }
        return list;
      };
      return [{ id: 'starred-cat', name: 'Starred Pages', icon: 'folder', children: collectStarred(currentSpace.categories || []) }];
    }
    return filterNodes(currentSpace.categories || []);
  }, [currentSpace, activeTab, starredSet, searchQuery]);

  // Permissions
  const canEdit = ['TESTER', 'MANAGER', 'ADMIN', 'SME'].includes(user?.role);
  const isAdmin = user?.role === 'ADMIN';

  // ═══════════════════════════════════════════════════════════════════════════
  // RECURSIVE TREE ITEM COMPONENT
  // ═══════════════════════════════════════════════════════════════════════════

  const renderTreeItem = (node, depth = 0) => {
    const hasKids = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const isStarred = starredSet.has(node.id);

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          onClick={() => {
            if (hasKids) toggleNodeExpand(node.id);
            handleSelectNode(node);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            paddingLeft: 12 + depth * 14,
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
            color: isSelected ? 'var(--accent)' : 'var(--text1)',
            background: isSelected ? 'var(--accent-dim)' : 'transparent',
            fontWeight: isSelected ? 600 : 400,
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
          className="tree-node-row"
          onMouseEnter={e => {
            if (!isSelected) e.currentTarget.style.background = 'var(--bg-raised)';
          }}
          onMouseLeave={e => {
            if (!isSelected) e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hasKids ? (
              <span
                onClick={e => {
                  e.stopPropagation();
                  toggleNodeExpand(node.id);
                }}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--text3)' }}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            ) : (
              <span style={{ width: 14 }} />
            )}

            {getModuleIcon(node.icon || 'file', 14, isSelected ? 'var(--accent)' : currentSpace.color)}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isStarred && <Star size={11} fill="#f59e0b" color="#f59e0b" />}
            {canEdit && (
              <button
                title="Add Sub-Page"
                onClick={e => {
                  e.stopPropagation();
                  setCreateParentId(node.id);
                  setShowCreateModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text3)',
                  cursor: 'pointer',
                  padding: 2,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.6,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
              >
                <Plus size={13} />
              </button>
            )}
          </div>
        </div>

        {hasKids && isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {node.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER MAIN LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ display: 'flex', gap: 20, minHeight: 'calc(100vh - 110px)', position: 'relative' }}>
      {/* Toast Notification */}
      {msg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: msg.type === 'error' ? 'var(--red)' : 'var(--green)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontSize: 13.5,
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {msg.type === 'error' ? <AlertOctagon size={16} /> : <Check size={16} />}
          {msg.text}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          LEFT SIDEBAR: CONFLUENCE SPACES & PAGE TREE
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        width: 300,
        flexShrink: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        height: 'calc(100vh - 130px)',
        position: 'sticky',
        top: 80,
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Space Selector & Create Page Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {getModuleIcon(currentSpace.icon, 20, currentSpace.color)}
              <span style={{ fontWeight: 750, fontSize: 15, color: 'var(--text1)' }}>
                {currentSpace.name} Space
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={handleSeedDefaults}
                className="btn btn-ghost btn-sm"
                title="Reset/Seed Default Knowledge Base Spaces"
                style={{ padding: '3px 6px', fontSize: 11 }}
              >
                <Sparkles size={13} color="var(--accent)" />
              </button>
            )}
          </div>

          {/* Space Switcher Dropdown */}
          <select
            value={activeSpaceId}
            onChange={e => {
              setActiveSpaceId(e.target.value);
              setSelectedNodeId(null);
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-raised)',
              color: 'var(--text1)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {spaces.map(s => (
              <option key={s.id} value={s.id}>
                📁 {s.name} — {s.description || 'Knowledge Hub'}
              </option>
            ))}
          </select>

          {/* Primary "+ Create Page" Action */}
          <button
            onClick={() => {
              setCreateParentId(null);
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 8,
            }}
          >
            <Plus size={15} />
            Create Page
          </button>
        </div>

        {/* Navigation Tabs (Pages / Starred / Templates) */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-raised)',
          borderRadius: 8,
          padding: 3,
          gap: 2
        }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              border: 'none',
              background: activeTab === 'all' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'all' ? 'var(--text1)' : 'var(--text3)',
              fontWeight: activeTab === 'all' ? 650 : 500,
              padding: '5px 0',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <BookOpen size={12} /> Pages
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            style={{
              flex: 1,
              border: 'none',
              background: activeTab === 'starred' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'starred' ? '#f59e0b' : 'var(--text3)',
              fontWeight: activeTab === 'starred' ? 650 : 500,
              padding: '5px 0',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <Star size={12} fill={activeTab === 'starred' ? '#f59e0b' : 'none'} /> Starred ({starredSet.size})
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--accent)',
              fontWeight: 600,
              padding: '5px 0',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}
          >
            <Sparkles size={12} /> Templates
          </button>
        </div>

        {/* Live Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Search pages in space..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--bg-raised)',
              fontSize: 12.5,
              color: 'var(--text1)'
            }}
          />
          {searchQuery && (
            <X
              size={12}
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 8, top: 9, cursor: 'pointer', color: 'var(--text3)' }}
            />
          )}
        </div>

        {/* Tree Container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {visibleCategories.length === 0 ? (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text3)', fontSize: 12.5 }}>
              No matching pages found in this space.
            </div>
          ) : (
            visibleCategories.map(cat => renderTreeItem(cat))
          )}
        </div>

        {/* Recent Pages Quick Pill Carousel at Sidebar Bottom */}
        {recentNodes.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 6 }}>
              Recently Viewed
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {recentNodes.slice(0, 3).map(r => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedNodeId(r.id);
                    setSelectedNodeName(r.name);
                    loadPageContent(r.id, r.name);
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 12,
                    background: 'var(--bg-raised)',
                    fontSize: 11,
                    color: 'var(--text2)',
                    cursor: 'pointer',
                    maxWidth: 240,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={r.name}
                >
                  📄 {r.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          CENTER CANVAS: LIVING PAGE VIEWER / WRITING MODE
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '28px 32px',
        boxShadow: 'var(--shadow-sm)',
        minWidth: 0,
        overflowY: 'auto',
      }}>
        {pageLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 10, color: 'var(--text2)' }}>
            <RefreshCw size={20} className="spin" color="var(--accent)" />
            <span>Loading Confluence Page...</span>
          </div>
        ) : !selectedNodeId ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text3)' }}>
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, color: 'var(--text1)' }}>Select a page from the tree</h3>
            <p style={{ fontSize: 13 }}>Choose any topic or module in the left sidebar to read or edit its living documentation.</p>
          </div>
        ) : (
          <>
            {/* ── Breadcrumb & Top Action Toolbar ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
              {/* Breadcrumb Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text3)' }}>
                <span style={{ fontWeight: 600, color: currentSpace.color }}>{currentSpace.name}</span>
                <span>/</span>
                <span>Knowledge</span>
                <span>/</span>
                <span style={{ color: 'var(--text1)', fontWeight: 600 }}>{selectedNodeName}</span>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!isEditing ? (
                  <>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7 }}
                      >
                        <Edit3 size={14} /> Edit Page
                      </button>
                    )}
                    <button
                      onClick={handleToggleStar}
                      className="btn btn-secondary btn-sm"
                      title={starredSet.has(selectedNodeId) ? 'Unstar' : 'Star page'}
                      style={{ padding: '6px 10px', borderRadius: 7 }}
                    >
                      <Star size={14} fill={starredSet.has(selectedNodeId) ? '#f59e0b' : 'none'} color={starredSet.has(selectedNodeId) ? '#f59e0b' : 'currentColor'} />
                    </button>
                    <button
                      onClick={handleShareLink}
                      className="btn btn-secondary btn-sm"
                      title="Copy shareable link"
                      style={{ padding: '6px 10px', borderRadius: 7 }}
                    >
                      <Share2 size={14} />
                    </button>
                    <button
                      onClick={handlePrintExport}
                      className="btn btn-secondary btn-sm"
                      title="Print or export page"
                      style={{ padding: '6px 10px', borderRadius: 7 }}
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      onClick={handleOpenHistory}
                      className="btn btn-secondary btn-sm"
                      title="Revision History"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7 }}
                    >
                      <History size={14} /> v{pageData?.version || 1}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 6, padding: 2, marginRight: 6 }}>
                      <button
                        onClick={() => setEditorMode('edit')}
                        style={{
                          border: 'none',
                          background: editorMode === 'edit' ? 'var(--bg-card)' : 'transparent',
                          color: editorMode === 'edit' ? 'var(--accent)' : 'var(--text3)',
                          padding: '4px 8px', borderRadius: 5, fontSize: 11.5, cursor: 'pointer'
                        }}
                      >
                        Write
                      </button>
                      <button
                        onClick={() => setEditorMode('split')}
                        style={{
                          border: 'none',
                          background: editorMode === 'split' ? 'var(--bg-card)' : 'transparent',
                          color: editorMode === 'split' ? 'var(--accent)' : 'var(--text3)',
                          padding: '4px 8px', borderRadius: 5, fontSize: 11.5, cursor: 'pointer'
                        }}
                      >
                        Split
                      </button>
                      <button
                        onClick={() => setEditorMode('preview')}
                        style={{
                          border: 'none',
                          background: editorMode === 'preview' ? 'var(--bg-card)' : 'transparent',
                          color: editorMode === 'preview' ? 'var(--accent)' : 'var(--text3)',
                          padding: '4px 8px', borderRadius: 5, fontSize: 11.5, cursor: 'pointer'
                        }}
                      >
                        Preview
                      </button>
                    </div>

                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7 }}
                    >
                      <Sparkles size={13} color="var(--accent)" /> Templates
                    </button>

                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditTitle(pageData?.title || selectedNodeName);
                        setEditContent(pageData?.content || '');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', borderRadius: 7 }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSavePage}
                      disabled={isSaving}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 7 }}
                    >
                      {isSaving ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                      Publish Changes
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MODE A: READING VIEW
                ══════════════════════════════════════════════════════════════ */}
            {!isEditing ? (
              <div style={{ display: 'flex', gap: 32, position: 'relative' }}>
                {/* Article Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Page Title & Metadata Header */}
                  <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em', marginBottom: 10 }}>
                      {pageData?.title || selectedNodeName}
                    </h1>

                    {/* Metadata Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14, fontSize: 12.5, color: 'var(--text3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: currentSpace.color,
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700
                        }}>
                          {(pageData?.lastModifiedBy || 'U')[0].toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text2)', fontWeight: 550 }}>
                          {pageData?.lastModifiedBy || 'QA Lead'}
                        </span>
                      </div>

                      <span>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} />
                        <span>Updated {formatDate(pageData?.lastModifiedAt)}</span>
                      </div>

                      <span>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>⏱️ {calculateReadingTime(pageData?.content)}</span>
                      </div>

                      <span>•</span>
                      <span style={{
                        background: 'var(--bg-raised)',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--accent)'
                      }}>
                        v{pageData?.version || 1}
                      </span>
                    </div>

                    {/* Tags */}
                    {pageData?.tags && pageData.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                        {pageData.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            style={{
                              background: 'var(--bg-raised)',
                              color: 'var(--text2)',
                              fontSize: 11.5,
                              padding: '2px 8px',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Hash size={11} color="var(--accent)" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rendered Confluence Content */}
                  <ConfluenceMarkdownRenderer
                    content={pageData?.content}
                    onToggleChecklist={handleToggleChecklist}
                  />

                  {/* ──────────────────────────────────────────────────────────
                      PAGE ATTACHMENTS & TEST EVIDENCE
                      ────────────────────────────────────────────────────────── */}
                  <div style={{ marginTop: 44, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Paperclip size={18} color="var(--accent)" />
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>
                          Page Attachments & Test Evidence ({documents.length})
                        </h3>
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => setShowUploadModal(true)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7 }}
                        >
                          <Upload size={13} /> Attach File
                        </button>
                      )}
                    </div>

                    {docsLoading ? (
                      <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading attachments...</div>
                    ) : documents.length === 0 ? (
                      <div style={{
                        padding: '24px 16px',
                        borderRadius: 8,
                        background: 'var(--bg-raised)',
                        textAlign: 'center',
                        color: 'var(--text3)',
                        fontSize: 13
                      }}>
                        No files or test evidence attached to this page yet. Click "Attach File" above to upload spreadsheets, PDFs, or screenshots.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)', textAlign: 'left' }}>
                              <th style={{ padding: '8px 10px' }}>Filename</th>
                              <th style={{ padding: '8px 10px' }}>Size</th>
                              <th style={{ padding: '8px 10px' }}>Uploaded By</th>
                              <th style={{ padding: '8px 10px' }}>Date</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map(doc => (
                              <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text1)', fontWeight: 500 }}>
                                  {getFileIcon(doc.contentType)}
                                  <span>{doc.originalName || doc.fileName}</span>
                                </td>
                                <td style={{ padding: '10px', color: 'var(--text3)' }}>{formatBytes(doc.fileSize)}</td>
                                <td style={{ padding: '10px', color: 'var(--text2)' }}>{doc.uploadedBy?.username || doc.uploadedBy || 'User'}</td>
                                <td style={{ padding: '10px', color: 'var(--text3)' }}>{formatDate(doc.uploadedAt)}</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                    <button
                                      onClick={() => handleDownloadDoc(doc)}
                                      className="btn btn-ghost btn-sm"
                                      title="Download File"
                                      style={{ padding: 4 }}
                                    >
                                      <Download size={14} />
                                    </button>
                                    {isAdmin && (
                                      <button
                                        onClick={() => handleArchiveDoc(doc.id)}
                                        className="btn btn-ghost btn-sm"
                                        title="Archive"
                                        style={{ padding: 4, color: 'var(--red)' }}
                                      >
                                        <Archive size={14} />
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

                  {/* ──────────────────────────────────────────────────────────
                      COLLABORATION & COMMENTS STREAM
                      ────────────────────────────────────────────────────────── */}
                  <div style={{ marginTop: 44, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <MessageSquare size={18} color="var(--accent)" />
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>
                        Comments & Collaboration ({comments.length})
                      </h3>
                    </div>

                    {/* New Comment Form */}
                    <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      <textarea
                        rows={3}
                        placeholder="Write a QA review note, approval comment, or question on this page..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-raised)',
                          color: 'var(--text1)',
                          fontSize: 13,
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="submit"
                          disabled={submittingComment || !commentText.trim()}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 7 }}
                        >
                          <Send size={13} /> Add Comment
                        </button>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {comments.map((c, cIdx) => (
                        <div
                          key={c.id || cIdx}
                          style={{
                            background: 'var(--bg-raised)',
                            borderRadius: 10,
                            padding: '12px 16px',
                            display: 'flex',
                            gap: 12
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'var(--accent)',
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0
                          }}>
                            {(c.author || 'A')[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 650, fontSize: 13, color: 'var(--text1)' }}>{c.author}</span>
                              <span style={{
                                fontSize: 10.5,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: 'var(--accent-dim)',
                                color: 'var(--accent)',
                                fontWeight: 600
                              }}>
                                {c.authorRole || 'TESTER'}
                              </span>
                              <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{formatDate(c.createdAt)}</span>
                            </div>
                            <div style={{ fontSize: 13.5, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>
                              {c.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Right-Side Table of Contents (Sticky) ── */}
                {tableOfContents.length > 0 && (
                  <div style={{
                    width: 220,
                    flexShrink: 0,
                    position: 'sticky',
                    top: 20,
                    height: 'fit-content',
                    borderLeft: '1px solid var(--border)',
                    paddingLeft: 16,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.04em' }}>
                      On this page
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                      {tableOfContents.map((h, hIdx) => (
                        <a
                          key={hIdx}
                          href={`#${h.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(h.id);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          style={{
                            color: h.level === 1 ? 'var(--text1)' : 'var(--text3)',
                            fontWeight: h.level === 1 ? 600 : 400,
                            paddingLeft: (h.level - 1) * 10,
                            textDecoration: 'none',
                            lineHeight: 1.4,
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = h.level === 1 ? 'var(--text1)' : 'var(--text3)'}
                        >
                          {h.text}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ══════════════════════════════════════════════════════════════
                  MODE B: CONFLUENCE WRITING / EDITING MODE
                  ══════════════════════════════════════════════════════════════ */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Title Input */}
                <input
                  type="text"
                  placeholder="Page Title..."
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  style={{
                    fontSize: 24,
                    fontWeight: 750,
                    color: 'var(--text1)',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    width: '100%'
                  }}
                />

                {/* Tags Management */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  {editTags.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        background: 'var(--bg-raised)',
                        color: 'var(--accent)',
                        fontSize: 12,
                        padding: '3px 8px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      #{tag}
                      <X
                        size={11}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setEditTags(editTags.filter((_, idx) => idx !== tIdx))}
                      />
                    </span>
                  ))}

                  <input
                    type="text"
                    placeholder="+ Add tag (Enter)"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        if (!editTags.includes(tagInput.trim())) {
                          setEditTags([...editTags, tagInput.trim()]);
                        }
                        setTagInput('');
                      }
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text1)',
                      fontSize: 12,
                      padding: '4px 8px',
                      outline: 'none',
                      width: 130
                    }}
                  />
                </div>

                {/* Rich Formatting Toolbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 4,
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 10px'
                }}>
                  {/* Headings */}
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n# Heading 1\n')}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontWeight: 700, fontSize: 13 }}
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n## Heading 2\n')}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontWeight: 700, fontSize: 12 }}
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n### Heading 3\n')}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 8px', fontWeight: 700, fontSize: 11 }}
                  >
                    H3
                  </button>

                  <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

                  {/* Formatting buttons */}
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '**bold text**')}
                    className="btn btn-ghost btn-sm"
                    title="Bold"
                    style={{ padding: '4px 7px' }}
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '*italic text*')}
                    className="btn btn-ghost btn-sm"
                    title="Italic"
                    style={{ padding: '4px 7px' }}
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '`inline code`')}
                    className="btn btn-ghost btn-sm"
                    title="Inline Code"
                    style={{ padding: '4px 7px' }}
                  >
                    <Code size={14} />
                  </button>

                  <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

                  {/* Callout Inserts */}
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n> ℹ️ **Info:** Add detailed contextual notes here.\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Info Callout"
                    style={{ padding: '4px 7px', color: '#3b82f6' }}
                  >
                    <Info size={14} /> Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n> 💡 **Tip:** Helpful advice or recommended best practice.\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Tip Callout"
                    style={{ padding: '4px 7px', color: '#10b981' }}
                  >
                    <Lightbulb size={14} /> Tip
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n> ⚠️ **Warning:** Critical condition or prerequisite notice.\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Warning Callout"
                    style={{ padding: '4px 7px', color: '#f59e0b' }}
                  >
                    <AlertTriangle size={14} /> Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n> 🚨 **Danger:** High-risk impact or breaking changes.\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Danger Callout"
                    style={{ padding: '4px 7px', color: '#ef4444' }}
                  >
                    <AlertOctagon size={14} /> Caution
                  </button>

                  <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

                  {/* Structure Inserts */}
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n- [ ] Task to verify\n- [ ] Acceptance criteria sign-off\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Checklist"
                    style={{ padding: '4px 7px' }}
                  >
                    <ListTodo size={14} /> Checklist
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n| Column 1 | Column 2 | Status |\n| :--- | :--- | :--- |\n| Sample Data | Description | Active |\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Confluence Table"
                    style={{ padding: '4px 7px' }}
                  >
                    <Table size={14} /> Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n```javascript\n// Write code here\n```\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Code Block"
                    style={{ padding: '4px 7px' }}
                  >
                    <FileText size={14} /> Code Block
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent(prev => prev + '\n---\n')}
                    className="btn btn-ghost btn-sm"
                    title="Insert Divider"
                    style={{ padding: '4px 7px' }}
                  >
                    <Minus size={14} /> Divider
                  </button>
                </div>

                {/* Editor Content Area (Split / Full View) */}
                <div style={{
                  display: 'flex',
                  gap: 16,
                  height: 'calc(100vh - 360px)',
                  minHeight: 450
                }}>
                  {(editorMode === 'edit' || editorMode === 'split') && (
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      placeholder="Start typing Confluence documentation in markdown... Use the toolbar above to add tables, callouts, and checklists."
                      style={{
                        flex: 1,
                        padding: 16,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        color: 'var(--text1)',
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        resize: 'none'
                      }}
                    />
                  )}

                  {(editorMode === 'preview' || editorMode === 'split') && (
                    <div style={{
                      flex: 1,
                      padding: 20,
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      overflowY: 'auto',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 12 }}>
                        Live Markdown Preview
                      </div>
                      <ConfluenceMarkdownRenderer content={editContent} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: TEMPLATE PICKER DRAWER
          ════════════════════════════════════════════════════════════════════════ */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            width: 720,
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 22px', borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text1)' }}>
                  Confluence Knowledge Hub Templates
                </h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {CONFLUENCE_TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleInsertTemplate(tpl)}
                  style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{tpl.icon}</span>
                    <span style={{ fontWeight: 650, fontSize: 14, color: 'var(--text1)' }}>{tpl.title}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text3)', margin: 0, lineHeight: 1.4 }}>
                    {tpl.summary}
                  </p>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {tpl.tags.map((t, idx) => (
                      <span key={idx} style={{
                        fontSize: 10.5,
                        background: 'var(--bg-card)',
                        color: 'var(--text2)',
                        padding: '1px 6px',
                        borderRadius: 4
                      }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: REVISION HISTORY DRAWER
          ════════════════════════════════════════════════════════════════════════ */}
      {showHistory && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex', justifyContent: 'flex-end',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border)',
            width: 380,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px', borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={18} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text1)' }}>
                  Page Revisions
                </h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 18, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingVersions ? (
                <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading version history...</div>
              ) : versionsList.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: 13 }}>No historical snapshots found.</div>
              ) : (
                versionsList.map((ver, vIdx) => (
                  <div
                    key={vIdx}
                    style={{
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        Version v{ver.version}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{formatDate(ver.savedAt)}</span>
                    </div>

                    <div style={{ fontSize: 12.5, color: 'var(--text2)' }}>
                      Saved by: <strong>{ver.savedBy || 'User'}</strong>
                    </div>

                    {ver.title && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                        "{ver.title}"
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                      <button
                        onClick={() => handleRestoreVersion(ver.version)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 6 }}
                      >
                        Restore Snapshot
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 3: CREATE PAGE / SUB-PAGE MODAL
          ════════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            width: 440,
            padding: 24,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FilePlus size={18} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text1)' }}>
                  {createParentId ? 'Create Child Page' : 'Create New Confluence Page'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                  Page Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Underwriting Engine Specifications"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-raised)',
                    fontSize: 13.5,
                    color: 'var(--text1)'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateSubPage();
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubPage}
                  disabled={!createTitle.trim()}
                  className="btn btn-primary btn-sm"
                >
                  Create Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 4: ATTACH FILE / DOCUMENT
          ════════════════════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            width: 480,
            padding: 24,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={18} color="var(--accent)" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text1)' }}>
                  Attach Files to Page
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="file"
                multiple
                onChange={e => setUploadFiles(Array.from(e.target.files || []))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: '2px dashed var(--border)',
                  background: 'var(--bg-raised)',
                  fontSize: 12.5,
                  cursor: 'pointer'
                }}
              />

              {uploadFiles.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Selected: {uploadFiles.map(f => f.name).join(', ')}
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Test execution logs, defect screenshots"
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-raised)',
                    fontSize: 13,
                    color: 'var(--text1)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={uploadFiles.length === 0 || uploadingDoc}
                  className="btn btn-primary btn-sm"
                >
                  {uploadingDoc ? 'Uploading...' : 'Upload Attachment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
