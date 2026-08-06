import axios from 'axios';

// Use environment variable - NO hardcoded fallback for production security
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and tenant to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('tenantId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (data) => api.post(`/auth/login`, data),
  register:       (data) => api.post(`/auth/register`, data),
  changePassword: (data) => api.post(`/auth/change-password`, data),
};

// ── Tenants (Organizations) ───────────────────────────────────────────────────
export const tenantApi = {
  list:       ()           => api.get(`/tenants`),
  get:        (id)         => api.get(`/tenants/${id}`),
  create:     (data)       => api.post(`/tenants`, data),
  update:     (id, data)   => api.put(`/tenants/${id}`, data),
  delete:     (id)         => api.delete(`/tenants/${id}`),
  deactivate: (id)         => api.post(`/tenants/${id}/deactivate`),
};

// ── Teams (within Organization) ───────────────────────────────────────────────
export const teamApi = {
  list:           ()              => api.get(`/teams`),
  listPaged:      (params)        => api.get(`/teams/paged`, { params }),
  get:            (id)            => api.get(`/teams/${id}`),
  create:         (data)          => api.post(`/teams`, data),
  update:         (id, data)      => api.put(`/teams/${id}`, data),
  delete:         (id)            => api.delete(`/teams/${id}`),
  byDepartment:   (department)    => api.get(`/teams/by-department/${department}`),
  byChannel:      (channel)       => api.get(`/teams/by-channel/${channel}`),
  search:         (query)         => api.get(`/teams/search`, { params: { q: query } }),
  memberCount:    (id)            => api.get(`/teams/${id}/member-count`),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectApi = {
  list:           ()           => api.get(`/projects`),             // nested (root + subs)
  listFlat:       ()           => api.get(`/projects/flat`),        // flat list for dropdowns
  subProjects:    (id)         => api.get(`/projects/${id}/sub-projects`),
  get:            (id)         => api.get(`/projects/${id}`),
  create:         (data)       => api.post(`/projects`, data),
  update:         (id, data)   => api.put(`/projects/${id}`, data),
  deactivate:     (id)         => api.delete(`/projects/${id}`),
};

// ── Modules ───────────────────────────────────────────────────────────────────
export const moduleApi = {
  listByProject: (projectId) => api.get(`/modules`, { params: { projectId } }),
};

// ── Test Cases ────────────────────────────────────────────────────────────────
export const testCaseApi = {
  list:           (params)       => api.get(`/testcases`, { params }),
  get:            (id)           => api.get(`/testcases/${id}`),
  create:         (data)         => api.post(`/testcases`, data),
  update:         (id, data)     => api.put(`/testcases/${id}`, data),
  delete:         (id)           => api.delete(`/testcases/${id}`),
  editTestCase:   (id, data)     => api.put(`/testcases/${id}/edit`, data),
  forwardToSME:   (id, smeId)    => api.patch(`/testcases/${id}/forward-sme`, null, { params: smeId ? { smeId } : {} }),
  smeQueue:       (projectId)    => api.get(`/testcases/sme-queue`, { params: { projectId } }),
  smeReview:      (id, data)     => api.put(`/testcases/${id}/sme-review`, data),
  bulkApprove:    (data)         => api.post(`/testcases/bulk-approve`, data),
  requestChanges: (id, data)     => api.post(`/testcases/${id}/request-changes`, data),
  // Assign by explicit ID list
  assign:         (data)         => api.post(`/testcases/assign`, data),
  // NEW Feature 2 — assign ALL SME_APPROVED cases in a module to a tester
  assignByModule: (data)         => api.post(`/testcases/assign-by-module`, data),
  signOff:        (projectId, data) => api.post(`/testcases/signoff/${projectId}`, data),
  importExcel: (projectId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/testcases/import`, form, {
      params: { projectId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadTemplate: () =>
    api.get(`/testcases/import/template`, { responseType: 'blob' }),
  exportTestCases: (projectId) =>
    api.get(`/testcases/export`, { params: { projectId }, responseType: 'blob' }),
};

// ── Defects ───────────────────────────────────────────────────────────────────
export const defectApi = {
  list:         (projectId) => api.get(`/defects`, { params: { projectId } }),
  create:       (data)      => api.post(`/defects`, data),
  updateStatus: (id, status) =>
    api.patch(`/defects/${id}/status`, null, { params: { status } }),
};

// ── JIRA Integration ──────────────────────────────────────────────────────────
export const jiraApi = {
  createIssue:  (defectId)         => api.post(`/jira/defects/${defectId}/create-issue`),
  getIssue:     (issueKey)         => api.get(`/jira/issues/${issueKey}`),
  transition:   (issueKey, status) => api.post(`/jira/issues/${issueKey}/transition`, null, { params: { targetStatus: status } }),
  addComment:   (issueKey, comment) => api.post(`/jira/issues/${issueKey}/comment`, null, { params: { comment } }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportApi = {
  dashboard:       (projectId) =>
    api.get(`/reports/manager-dashboard`, { params: { projectId } }),
  allDashboards:   ()           => api.get(`/reports/manager-dashboard/all`),
  moduleBreakdown: (projectId)  =>
    api.get(`/reports/module-breakdown`,  { params: { projectId } }),
  // SME dashboard — department-wise test case bifurcation
  smeDashboard:    (projectId)  =>
    api.get(`/reports/sme-dashboard`,     { params: { projectId } }),
  // SME module dashboard — shows only assigned modules with stats
  smeModuleDashboard: (smeId) =>
    api.get(`/reports/sme-module-dashboard`, { params: { smeId } }),
  // Get modules assigned to an SME
  smeModules:      (smeId)      => api.get(`/reports/sme-modules/${smeId}`),
  // Get SMEs assigned to a module
  moduleSmes:      (moduleId)   => api.get(`/reports/module-smes/${moduleId}`),
  // Assign SME to module
  assignSmeToModule: (smeId, moduleId, channel, department) =>
    api.post(`/reports/sme-module-assignment`, null, { 
      params: { smeId, moduleId, channel, department } 
    }),
  // Remove SME from module
  removeSmeFromModule: (smeId, moduleId) =>
    api.delete(`/reports/sme-module-assignment`, { params: { smeId, moduleId } }),
};

// ── Executions ────────────────────────────────────────────────────────────────
export const executionApi = {
  submit:  (data)        => api.post(`/executions`, data),
  update:  (id, data)    => api.put(`/executions/${id}`, data),
  getById: (id)          => api.get(`/executions/${id}`),
  history: (testCaseId)  => api.get(`/executions/testcase/${testCaseId}/history`),
  list:    (params)      => api.get(`/executions`, { params }),
  summary: (projectId)   =>
    api.get(`/executions/summary`, { params: { projectId } }),
  delete:  (id)          => api.delete(`/executions/${id}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userApi = {
  list:          (activeOnly = true) =>
    api.get(`/users`, { params: { activeOnly } }),
  // NEW Feature 1 — GET /api/v1/users/testers used by assignment modals
  listTesters:   ()                  => api.get(`/users/testers`),
  listByRole:    (role)              =>
    api.get(`/users/by-role`, { params: { role } }),
  getById:       (id)                => api.get(`/users/${id}`),
  me:            ()                  => api.get(`/users/me`),
  // NEW Feature 1 — POST /api/v1/users  (manager creates tester)
  create:        (data)              => api.post(`/users`, data),
  update:        (id, data)          => api.put(`/users/${id}`, data),
  resetPassword: (id, data)          =>
    api.patch(`/users/${id}/reset-password`, data),
  activate:      (id)                => api.patch(`/users/${id}/activate`),
  deactivate:    (id)                => api.patch(`/users/${id}/deactivate`),
  updateRole:    (id, role)          =>
    api.patch(`/users/${id}/role`, { role }),
};

// ── Productivity ──────────────────────────────────────────────────────────────
export const productivityApi = {
  // Manager: team summary
  team: (projectId) =>
    api.get(`/productivity/team`, {
      params: projectId ? { projectId } : {},
    }),
  // Manager: one tester full breakdown (includes dailyHistory)
  tester: (userId, projectId) =>
    api.get(`/productivity/tester/${userId}`, {
      params: projectId ? { projectId } : {},
    }),
  // Manager: one tester's daily entries only
  testerDaily: (userId, days = 30) =>
    api.get(`/productivity/tester/${userId}/daily`, { params: { days } }),
  // NEW Feature 5 — tester views their own productivity
  me: (projectId) =>
    api.get(`/productivity/me`, {
      params: projectId ? { projectId } : {},
    }),
  // NEW Feature 3 — manager daily tracking dashboard
  dailyTracking: (date) =>
    api.get(`/productivity/daily-tracking`, {
      params: date ? { date } : {},
    }),
};

export default api;

// ── Tags ─────────────────────────────────────────────────────
export const tagApi = {
  listByProject: (projectId) => api.get(`/tags`, { params: { projectId } }),
  create:        (data)      => api.post(`/tags`, data),
  addToCase:     (tcId, tagId) => api.post(`/testcases/${tcId}/tags/${tagId}`),
  removeFromCase:(tcId, tagId) => api.delete(`/testcases/${tcId}/tags/${tagId}`),
};

// ── Requirements ─────────────────────────────────────────────
export const requirementApi = {
  listByProject: (projectId) => api.get(`/requirements`, { params: { projectId } }),
  create:        (data)      => api.post(`/requirements`, data),
  link:    (tcId, reqId) => api.post(`/requirements/testcases/${tcId}/link/${reqId}`),
  unlink:  (tcId, reqId) => api.delete(`/requirements/testcases/${tcId}/unlink/${reqId}`),
};

// ── Attachments ───────────────────────────────────────────────
export const attachmentApi = {
  uploadToExecution: (execId, file) => {
    const form = new FormData(); form.append('file', file);
    return api.post(`/executions/${execId}/attachments`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  uploadToDefect: (defectId, file) => {
    const form = new FormData(); form.append('file', file);
    return api.post(`/defects/${defectId}/attachments`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  listForExecution: (execId)  => api.get(`/executions/${execId}/attachments`),
  listForDefect:    (defectId) => api.get(`/defects/${defectId}/attachments`),
  downloadUrl:      (id)      => `/attachments/${id}/download`,
  download:         (id)      => api.get(`/attachments/${id}/download`, { responseType: 'blob' }),
  // Download as PDF - all test evidence files are converted to PDF format
  downloadPdfUrl:   (id)      => `${API_BASE_URL}/attachments/${id}/download-pdf`,
  downloadAsPdf:    (id)      => api.get(`/attachments/${id}/download-pdf`, { responseType: 'blob' }),
  delete:           (id)      => api.delete(`/attachments/${id}`),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationApi = {
  list:             ()            => api.get(`/notifications/me`),
  unreadCount:      ()            => api.get(`/notifications/me/unread-count`),
  markRead:         (id)          => api.patch(`/notifications/${id}/read`),
  markAllRead:      ()            => api.patch(`/notifications/read-all`),
  // Admin broadcast endpoints
  broadcastToAll:   (data)        => api.post(`/notifications/broadcast/all`, data),
  broadcastToRole:  (role, data)  => api.post(`/notifications/broadcast/role/${role}`, data),
  broadcastToUsers: (data)        => api.post(`/notifications/broadcast/users`, data),
  broadcastToTeam:  (teamId, data)=> api.post(`/notifications/broadcast/team/${teamId}`, data),
};

// ── Version History ───────────────────────────────────────────
export const versionApi = {
  list:   (tcId)            => api.get(`/testcases/${tcId}/versions`),
  get:    (tcId, versionNo) => api.get(`/testcases/${tcId}/versions/${versionNo}`),
};

// ── Global Search ─────────────────────────────────────────────
export const searchApi = {
  search: (q, projectId) => api.get(`/search`, { params: { q, ...(projectId ? { projectId } : {}) } }),
};

// ── Workflow extras ───────────────────────────────────────────
export const workflowApi = {
  reassign:          (id, data) => api.patch(`/testcases/${id}/reassign`, data),
  sendUAT:           (id, data) => api.patch(`/testcases/${id}/send-uat`, data),
  startUAT:          (id)       => api.patch(`/testcases/${id}/uat-start`),
  passUAT:           (id, data) => api.patch(`/testcases/${id}/uat-pass`, data),
  sendRedevelopment: (id, data) => api.patch(`/testcases/${id}/send-redevelopment`, data),
  clone:             (id, data) => api.post(`/testcases/${id}/clone`, data),
};

// ── Workload (appended) ───────────────────────────────────────
export const workloadApi = {
  team: () => api.get(`/productivity/workload`),
};

// ── QA Calls Module ────────────────────────────────────────────────────────
export const callApi = {
  list:       (projectId, params = {}) =>
    api.get(`/calls`, { params: { projectId, ...params } }),
  get:        (id)         => api.get(`/calls/${id}`),
  upcoming:   (projectId)  => api.get(`/calls/upcoming`, { params: { projectId } }),
  myCalls:    (projectId)  => api.get(`/calls/my-calls`,  { params: { projectId } }),
  summary:    (projectId)  => api.get(`/calls/summary`,   { params: { projectId } }),
  create:     (data)       => api.post(`/calls`, data),
  update:     (id, data)   => api.put(`/calls/${id}`, data),
  updateStatus:(id, data)  => api.patch(`/calls/${id}/status`, data),
  complete:   (id, data)   => api.post(`/calls/${id}/complete`, data),
  delete:     (id)         => api.delete(`/calls/${id}`),
};

// ── Central Repository Module ───────────────────────────────────────────────
export const repositoryApi = {
  list:       (projectId, category) =>
    api.get(`/repository/projects/${projectId}/documents`,
            { params: category ? { category } : {} }),
  upload:     (projectId, formData) =>
    api.post(`/repository/projects/${projectId}/documents`, formData,
             { headers: { 'Content-Type': 'multipart/form-data' } }),
  download:   (docId)    => api.get(`/repository/documents/${docId}/download`,
                                    { responseType: 'blob' }),
  archive:    (docId)    => api.patch(`/repository/documents/${docId}/archive`),
  delete:     (docId)    => api.delete(`/repository/documents/${docId}`),
  categories: ()         => api.get(`/repository/categories`),
};

// ── Release Management ──────────────────────────────────────────────────────
export const releaseApi = {
  request:    (testCaseId, data) => api.post(`/releases/testcases/${testCaseId}/request`, data),
  action:     (releaseId, data)  => api.patch(`/releases/${releaseId}/action`, data),
  pending:    ()                 => api.get(`/releases/pending`),
  history:    (testCaseId)       => api.get(`/releases/testcases/${testCaseId}/history`),
  mine:       ()                 => api.get(`/releases/mine`),
};

// ── Call Number Management ──────────────────────────────────────────────────
export const callNumberApi = {
  // Create
  create:       (data)        => api.post(`/call-numbers`, data),
  bulkCreate:   (data)        => api.post(`/call-numbers/bulk`, data),
  
  // Read
  getById:      (id)          => api.get(`/call-numbers/${id}`),
  getByCode:    (code, projectId) => 
    api.get(`/call-numbers/by-code`, { params: { code, projectId } }),
  getByProject: (projectId)   => api.get(`/call-numbers/project/${projectId}`),
  getTree:      (projectId)   => api.get(`/call-numbers/project/${projectId}/tree`),
  getParents:   (projectId)   => api.get(`/call-numbers/project/${projectId}/parents`),
  getChildren:  (parentId)    => api.get(`/call-numbers/${parentId}/children`),
  
  // Search
  search:       (projectId, query) => 
    api.get(`/call-numbers/search`, { params: { projectId, query } }),
  searchGlobal: (query, page = 0, size = 20) => 
    api.get(`/call-numbers/search/global`, { params: { query, page, size } }),
  
  // Update
  update:       (id, data)    => api.put(`/call-numbers/${id}`, data),
  deactivate:   (id)          => api.delete(`/call-numbers/${id}`),
  activate:     (id)          => api.patch(`/call-numbers/${id}/activate`),
  
  // Link test cases
  linkTestCases:   (data)     => api.post(`/call-numbers/link-test-cases`, data),
  unlinkTestCases: (testCaseIds) => api.post(`/call-numbers/unlink-test-cases`, testCaseIds),
  
  // Bulk status update (Issue #1, #2)
  bulkStatusUpdate: (data)    => api.post(`/call-numbers/bulk-status-update`, data),
};



