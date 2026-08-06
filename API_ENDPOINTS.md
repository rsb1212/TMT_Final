# 🧪 SmartQA - Complete API Endpoint Reference

**Base URL:** `http://localhost:8080/api/v1` (Development)  
**Production:** `http://10.3.41.102/api/v1`  
**Swagger UI:** `http://localhost:8080/swagger-ui.html`

---

## 📋 Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Projects](#3-projects)
4. [Test Cases](#4-test-cases)
5. [Workflow](#5-workflow)
6. [Test Execution](#6-test-execution)
7. [Defects](#7-defects)
8. [Attachments](#8-attachments)
9. [Requirements](#9-requirements)
10. [Release Management](#10-release-management)
11. [Central Repository](#11-central-repository)
12. [Repository Modules](#12-repository-modules)
13. [Reports & Dashboard](#13-reports--dashboard)
14. [Productivity](#14-productivity)
15. [Notifications](#15-notifications)
16. [Search](#16-search)
17. [Tags](#17-tags)
18. [QA Calls](#18-qa-calls)
19. [JIRA Integration](#19-jira-integration)
20. [Health Check](#20-health-check)

---

## 1. Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | Login and receive JWT token | ❌ |
| `POST` | `/auth/register` | Register new user (TESTER role default) | ❌ |
| `POST` | `/auth/change-password` | Change own password | ✅ |

### Request/Response Examples

**Login:**
```json
POST /api/v1/auth/login
{
  "email": "admin@testmgmt.io",
  "password": "Admin@1234"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@testmgmt.io",
      "username": "admin",
      "fullName": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

---

## 2. Users

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/users/me` | Get current user's profile | All |
| `POST` | `/users` | Create a new user | MANAGER, ADMIN |
| `GET` | `/users` | List all users (optional: activeOnly=true/false) | MANAGER, ADMIN, SME |
| `GET` | `/users/testers` | List all active testers | All |
| `GET` | `/users/{id}` | Get user by ID | MANAGER, ADMIN |
| `PUT` | `/users/{id}` | Update user profile/role/status | MANAGER, ADMIN |
| `PATCH` | `/users/{id}/activate` | Activate user account | MANAGER, ADMIN |
| `PATCH` | `/users/{id}/deactivate` | Deactivate user account | MANAGER, ADMIN |
| `PATCH` | `/users/{id}/reset-password` | Reset user's password | MANAGER, ADMIN |

### Roles: `ADMIN`, `MANAGER`, `SME`, `TESTER`, `VIEWER`

---

## 3. Projects

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/projects` | Create a new project/sub-project | ADMIN, MANAGER |
| `GET` | `/projects` | List root projects with nested sub-projects | All |
| `GET` | `/projects/flat` | List all projects flat (for dropdowns) | All |
| `GET` | `/projects/{id}` | Get project by ID | All |
| `GET` | `/projects/{id}/sub-projects` | List sub-projects of a parent | All |
| `PUT` | `/projects/{id}` | Update project | ADMIN, MANAGER |
| `DELETE` | `/projects/{id}` | Deactivate project (soft delete) | ADMIN |

---

## 4. Test Cases

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/testcases` | Create a test case with steps | TESTER, MANAGER, ADMIN |
| `GET` | `/testcases` | List test cases with filters | All |
| `GET` | `/testcases/{id}` | Get test case by ID | All |
| `PUT` | `/testcases/{id}` | Update test case | TESTER, MANAGER, ADMIN |
| `DELETE` | `/testcases/{id}` | Delete test case | MANAGER, ADMIN |

### Query Parameters for List:
- `projectId` (UUID) - Filter by project
- `status` (TestStatus) - Filter by status
- `assignedToUserId` (UUID) - Filter by assigned tester
- `module` (String) - Filter by module
- `page` (int, default: 0) - Page number
- `size` (int, default: 20) - Page size

### Test Case Statuses:
`DRAFT`, `IN_REVIEW`, `SME_PENDING`, `SME_APPROVED`, `REJECTED`, `ASSIGNED`, `IN_PROGRESS`, `PASSED`, `FAILED`, `BLOCKED`, `DEFECT_RAISED`, `UAT_PENDING`, `UAT_IN_PROGRESS`, `UAT_PASSED`, `REDEVELOPMENT`, `SIGNED_OFF`, `RELEASED`, `NA`, `NOT_RELEASED`

---

## 5. Workflow

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/testcases/import` | Import test cases from Excel | TESTER, MANAGER, ADMIN |
| `GET` | `/testcases/import/template` | Download blank import template | TESTER, MANAGER, ADMIN |
| `GET` | `/testcases/export?projectId={id}` | Export test cases as Excel | TESTER, MANAGER, ADMIN, SME |
| `PUT` | `/testcases/{id}/edit` | Edit test case | TESTER, MANAGER, ADMIN, SME |
| `PATCH` | `/testcases/{id}/forward-sme` | Forward to SME for review | TESTER, MANAGER, ADMIN |
| `POST` | `/testcases/assign` | Assign test cases to testers | MANAGER, ADMIN |
| `POST` | `/testcases/assign-by-module` | Bulk-assign all cases in a module | MANAGER, ADMIN |
| `PATCH` | `/testcases/{id}/reassign` | Reassign to different tester | MANAGER, ADMIN |
| `GET` | `/testcases/sme-queue` | SME review queue | SME |
| `PUT` | `/testcases/{id}/sme-review` | SME review (approve/reject) | SME |
| `POST` | `/testcases/bulk-approve` | Bulk approve test cases | SME |
| `POST` | `/testcases/{id}/request-changes` | Request changes from tester | SME |
| `PATCH` | `/testcases/{id}/send-uat` | Send PASSED case to UAT | MANAGER, ADMIN |
| `PATCH` | `/testcases/{id}/uat-start` | Start UAT | MANAGER, ADMIN, TESTER |
| `PATCH` | `/testcases/{id}/uat-pass` | UAT passed | MANAGER, ADMIN, SME |
| `PATCH` | `/testcases/{id}/send-redevelopment` | Failed UAT → redevelopment | MANAGER, ADMIN, SME |
| `POST` | `/testcases/{id}/clone` | Clone test case to another project | MANAGER, ADMIN |
| `POST` | `/testcases/signoff/{projectId}` | Sign off project test cases | SME |

### Version History:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/testcases/{id}/versions` | List all versions | All |
| `GET` | `/testcases/{id}/versions/{versionNumber}` | Get specific version | All |

---

## 6. Test Execution

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/executions` | Submit test execution result | TESTER, MANAGER, ADMIN, SME |
| `PUT` | `/executions/{id}` | Update existing execution | TESTER, MANAGER, ADMIN, SME |
| `GET` | `/executions/{id}` | Get single execution record | All |
| `GET` | `/executions/testcase/{testCaseId}/history` | Full execution history for test case | All |
| `GET` | `/executions` | List executions with filters | All |
| `GET` | `/executions/summary?projectId={id}` | Project execution summary dashboard | TESTER, MANAGER, ADMIN, SME |
| `DELETE` | `/executions/{id}` | Delete an execution record | TESTER, MANAGER, ADMIN |

### Query Parameters for List:
- `projectId` (UUID)
- `userId` (UUID) - Filter by tester
- `result` (ExecResult) - PASSED, FAILED, BLOCKED, DEFECT_RAISED, SKIPPED
- `page` (int, default: 0)
- `size` (int, default: 25)

---

## 7. Defects

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/defects` | Report a defect | All |
| `GET` | `/defects?projectId={id}` | List defects for a project | All |
| `PATCH` | `/defects/{id}/status?status={status}` | Update defect status | All |

### Defect Statuses:
`NEW`, `OPEN`, `IN_PROGRESS`, `FIXED`, `VERIFIED`, `CLOSED`, `REOPENED`, `REJECTED`, `DEFERRED`

---

## 8. Attachments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/executions/{id}/attachments` | Upload to test execution | All |
| `POST` | `/defects/{id}/attachments` | Upload to defect | All |
| `GET` | `/executions/{id}/attachments` | List execution attachments | All |
| `GET` | `/defects/{id}/attachments` | List defect attachments | All |
| `GET` | `/attachments/{id}/download` | Download original file | All |
| `GET` | `/attachments/{id}/download-pdf` | Download as PDF (converted) | All |
| `DELETE` | `/attachments/{id}` | Delete attachment | Uploader, MANAGER, ADMIN |

---

## 9. Requirements

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/requirements?projectId={id}` | List requirements for a project | All |
| `POST` | `/requirements` | Create a new requirement | MANAGER, ADMIN |
| `POST` | `/requirements/testcases/{tcId}/link/{reqId}` | Link requirement to test case | MANAGER, ADMIN |
| `DELETE` | `/requirements/testcases/{tcId}/unlink/{reqId}` | Unlink requirement | MANAGER, ADMIN |

---

## 10. Release Management

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/releases/testcases/{testCaseId}/request` | Request release from test case | TESTER, MANAGER, ADMIN |
| `PATCH` | `/releases/{releaseId}/action` | Approve/reject release request | MANAGER, ADMIN |
| `GET` | `/releases/pending` | List pending release requests | MANAGER, ADMIN |
| `GET` | `/releases/testcases/{testCaseId}/history` | Release history for test case | TESTER, MANAGER, ADMIN, SME |
| `GET` | `/releases/mine` | My release requests | TESTER, MANAGER, ADMIN |

---

## 11. Central Repository

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/repository/projects/{projectId}/documents` | Upload document (multipart) | TESTER, MANAGER, ADMIN, SME |
| `GET` | `/repository/projects/{projectId}/documents` | List documents (optional: category) | TESTER, MANAGER, ADMIN, SME |
| `GET` | `/repository/documents/{docId}/download` | Download a document | TESTER, MANAGER, ADMIN, SME |
| `PATCH` | `/repository/documents/{docId}/archive` | Archive document (soft delete) | MANAGER, ADMIN |
| `DELETE` | `/repository/documents/{docId}` | Permanently delete document | MANAGER, ADMIN |
| `GET` | `/repository/categories` | Get all repository categories | All |

### Repository Categories:
`BUSINESS_REQUIREMENTS`, `TEST_CASES`, `TEST_DATA`, `RELEASE_NOTES`, `UAT_DOCUMENTS`, `TRAINING_MATERIALS`, `ARCHITECTURE`, `OTHER`

---

## 12. Repository Modules (Hierarchical)

### Modules:
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/repository-modules/tree` | Get full module tree structure |
| `GET` | `/repository-modules` | List all modules |
| `GET` | `/repository-modules/{id}` | Get module by ID |
| `POST` | `/repository-modules` | Create module |
| `PUT` | `/repository-modules/{id}` | Update module |
| `DELETE` | `/repository-modules/{id}` | Delete module |

### Nodes (Folders):
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/repository-modules/{moduleId}/nodes` | Get root nodes |
| `GET` | `/repository-modules/nodes/{nodeId}/children` | Get child nodes |
| `POST` | `/repository-modules/nodes` | Create node |
| `PUT` | `/repository-modules/nodes/{nodeId}` | Update node |
| `DELETE` | `/repository-modules/nodes/{nodeId}` | Delete node |

### Documents:
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/repository-modules/nodes/{nodeId}/documents` | Get documents in node |
| `POST` | `/repository-modules/nodes/{nodeId}/documents` | Upload document |
| `PUT` | `/repository-modules/documents/{documentId}/archive` | Archive document |
| `DELETE` | `/repository-modules/documents/{documentId}` | Delete document |

### Admin:
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/repository-modules/seed` | Seed default modules |

---

## 13. Reports & Dashboard

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/reports/manager-dashboard?projectId={id}` | Real-time project dashboard | MANAGER, ADMIN, TESTER, SME |
| `GET` | `/reports/manager-dashboard/all` | All projects dashboard | MANAGER, ADMIN |
| `GET` | `/reports/module-breakdown?projectId={id}` | Per-module status breakdown | MANAGER, ADMIN, TESTER, SME |

---

## 14. Productivity

### Team & Individual:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/productivity/team` | Team productivity summary | MANAGER, ADMIN |
| `GET` | `/productivity/tester/{userId}` | Individual tester productivity | MANAGER, ADMIN |
| `GET` | `/productivity/me` | My own productivity | TESTER, MANAGER, ADMIN |
| `GET` | `/productivity/tester/{userId}/daily?days={n}` | Day-by-day history | MANAGER, ADMIN |
| `GET` | `/productivity/daily-tracking?date={YYYY-MM-DD}` | Daily team tracking | MANAGER, ADMIN |

### Workload:
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/productivity/workload` | Team workload (pending cases) | MANAGER, ADMIN |

---

## 15. Notifications

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/notifications/me` | Get all my notifications | All |
| `GET` | `/notifications/me/unread-count` | Get unread count (for bell badge) | All |
| `PATCH` | `/notifications/{id}/read` | Mark notification as read | All |
| `PATCH` | `/notifications/read-all` | Mark all as read | All |

---

## 16. Search

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/search?q={query}&projectId={id}` | Global search (test cases + defects) | All |

---

## 17. Tags

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET` | `/api/v1/tags?projectId={id}` | List all tags for a project | All |
| `POST` | `/api/v1/tags` | Create a new tag | All |
| `POST` | `/api/v1/testcases/{id}/tags/{tagId}` | Add tag to test case | All |
| `DELETE` | `/api/v1/testcases/{id}/tags/{tagId}` | Remove tag from test case | All |

---

## 18. QA Calls

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/calls` | Schedule a new call/meeting | MANAGER, ADMIN, SME |
| `GET` | `/calls?projectId={id}` | List calls (optional: status, callType) | MANAGER, ADMIN, SME, TESTER |
| `GET` | `/calls/{id}` | Get call detail | MANAGER, ADMIN, SME, TESTER, VIEWER |
| `GET` | `/calls/upcoming?projectId={id}` | Get upcoming calls (next 10) | MANAGER, ADMIN, SME, TESTER |
| `GET` | `/calls/my-calls?projectId={id}` | Get my calls | MANAGER, ADMIN, SME, TESTER |
| `GET` | `/calls/summary?projectId={id}` | Call summary dashboard | MANAGER, ADMIN, SME, TESTER |
| `PUT` | `/calls/{id}` | Update call details | MANAGER, ADMIN, SME |
| `PATCH` | `/calls/{id}/status` | Update call status | MANAGER, ADMIN, SME, TESTER |
| `POST` | `/calls/{id}/complete` | Mark complete with MoM | MANAGER, ADMIN, SME, TESTER |
| `DELETE` | `/calls/{id}` | Delete a scheduled call | MANAGER, ADMIN |

### Call Types:
`DAILY_STANDUP`, `WEEKLY_REVIEW`, `SPRINT_PLANNING`, `SPRINT_REVIEW`, `UAT_CALL`, `DEFECT_TRIAGE`, `RELEASE_READINESS`, `ADHOC`

### Call Statuses:
`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

---

## 19. JIRA Integration

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/jira/defects/{defectId}/create-issue` | Create JIRA issue from defect | MANAGER, ADMIN, TESTER, SME |
| `GET` | `/jira/issues/{issueKey}` | Fetch live JIRA issue details | MANAGER, ADMIN, TESTER, SME, VIEWER |
| `POST` | `/jira/issues/{issueKey}/transition?targetStatus={status}` | Transition JIRA issue | MANAGER, ADMIN |
| `POST` | `/jira/webhook` | JIRA webhook receiver | ❌ (JIRA callback) |
| `POST` | `/jira/issues/{issueKey}/comment?comment={text}` | Add comment to JIRA issue | MANAGER, ADMIN, TESTER, SME |

---

## 20. Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Simple health check | ❌ |
| `GET` | `/health/info` | Detailed system info (memory, JVM) | ❌ |

---

## 🔐 Authentication

All endpoints (except Auth and Health) require JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📌 Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@testmgmt.io | Admin@1234 |
| Manager | manager@testmgmt.io | Manager@1234 |
| SME | sme@testmgmt.io | Sme@1234 |
| Tester | tester@testmgmt.io | Tester@1234 |

---

## 📊 Common Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-07-23T10:30:00Z"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2026-07-23T10:30:00Z"
}
```

---

## 📁 Total API Endpoints: **115+**

| Category | Count |
|----------|-------|
| Authentication | 3 |
| Users | 9 |
| Projects | 6 |
| Test Cases | 5 |
| Workflow | 18 |
| Test Execution | 6 |
| Defects | 3 |
| Attachments | 7 |
| Requirements | 4 |
| Release Management | 5 |
| Central Repository | 6 |
| Repository Modules | 15 |
| Reports & Dashboard | 3 |
| Productivity | 6 |
| Notifications | 4 |
| Search | 1 |
| Tags | 4 |
| QA Calls | 10 |
| JIRA Integration | 5 |
| Health Check | 2 |

---

*Generated for SmartQA - Testing Lifecycle Management Platform*  
*Last Updated: July 23, 2026*
