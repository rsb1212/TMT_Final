# SmartQA - Implementation Changes Summary

## Date: August 5, 2026

This document summarizes all the changes made to address the 34 issues from the SmartQA Issue Segregation document.

---

## 📁 Files Created

### Backend - New Files

| File | Purpose | Issues Addressed |
|------|---------|------------------|
| `CallNumber.java` | Entity for call number management with hierarchical structure | #15, #17, #20 |
| `CallNumberRepository.java` | JPA repository for call number CRUD operations | #15, #16 |
| `CallNumberService.java` | Business logic for call numbers + bulk status update | #15-20, #1, #2 |
| `CallNumberController.java` | REST endpoints for call number management | #15-20 |
| `CallNumberDTOs.java` | Request DTOs for call number operations | #15-20 |
| `V2__add_call_numbers.sql` | Database migration for call_numbers table + defects column | #15-20, #22 |

---

## 📝 Files Modified

### Backend - Modified Files

| File | Changes | Issues Addressed |
|------|---------|------------------|
| `TestCase.java` | Added `callNumber` field with index | #17, #19 |
| `Defect.java` | Added `callNumber` field with index | #22 |
| `TestCaseRepository.java` | Added call number queries + priority sorting queries | #16, #17, #25, #26 |
| `TestCaseService.java` | Updated `toResponse()` to include callNumber | #19, #21 |
| `TestCaseImportService.java` | Added priority & call number column mapping + helper methods | #7, #18 |
| `SearchService.java` | Added call number search + test case by call number search | #16, #29 |
| `ResponseDTOs.java` | Added `CallNumberResponse`, `CallNumberTreeResponse`, `BulkStatusUpdateResponse`; Updated `TestCaseResponse` | #1, #15-20 |

### Frontend - Modified Files

| File | Changes | Issues Addressed |
|------|---------|------------------|
| `api/index.js` | Added `callNumberApi` with all CRUD + search endpoints | #15-20 |
| `AssignByModulePage.jsx` | Removed DRAFT from assignable statuses; Made module mandatory | #3, #12 |
| `TestCasesPage.jsx` | Added call number column in table + detail modal | #19 |
| `ExecutionPage.jsx` | Display call number in test case info | #21 |

---

## 🔧 Issues Addressed

### ✅ Implemented

| Issue # | Description | Solution |
|---------|-------------|----------|
| **1** | Unable to upload test case statuses in bulk | Added `bulkUpdateStatus()` in CallNumberService + API endpoint |
| **2** | Dashboard not updated after bulk status upload | Added cache eviction in bulk status update |
| **3** | DRAFT test cases appear in Assign by Module | Filtered to only show SME_APPROVED, RETEST statuses |
| **7** | Priority field not in Excel upload | Added COL_PRIORITY constant for Excel import |
| **12** | Module dropdown should be mandatory | Added validation + visual indicator in AssignByModulePage |
| **15** | Project should support multiple call numbers | Created CallNumber entity with project relationship |
| **16** | Search by call number unavailable | Added search endpoints in CallNumberService/Controller |
| **17** | All test cases mapped to call number | Added callNumber field to TestCase entity |
| **18** | Call number mandatory during repository upload | Added COL_CALL_NUMBER for Excel import |
| **19** | Call number visible in test case details | Updated TestCasesPage detail modal + table |
| **21** | Call number visible during execution | Updated ExecutionPage display |
| **25** | Sort by Severity/Priority | Added `findByProjectSortedByPriority()` query |
| **26** | Critical test cases at top | Priority sorting implemented |

### 🔄 Pending / Needs Additional Work

| Issue # | Description | Status |
|---------|-------------|--------|
| **4** | Description/Expected Result read-only when Pending with SME | Needs frontend form validation |
| **5** | SME name selection missing | Already exists - needs verification |
| **6** | Bulk share with SME for sign-off | Needs new bulk forward API |
| **8** | Test Case IDs in ascending order | Needs sorting update in queries |
| **9** | Search results highlight matched description | Needs UI highlighting logic |
| **10-11** | Module mapping mismatch | Needs investigation of import logic |
| **13** | Unable to bulk assign | Already exists - needs verification |
| **14** | Access flow revision | Role configuration review needed |
| **20** | Call number mandatory for project creation | Needs project form update |
| **22-24** | Defect linked to call number | Needs Defect entity update |
| **27** | Project filters not working | Needs debugging |
| **28** | Subproject deactivation | Needs API verification |
| **29** | Search by call number (global) | Added in CallNumberService |
| **30** | Search highlight | Needs UI highlighting |
| **31-34** | SME Review issues | Partial - needs verification |

---

## 🗄️ Database Schema Changes

### New Table: `call_numbers`

```sql
CREATE TABLE call_numbers (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id),
    parent_call_number_id UUID REFERENCES call_numbers(id),
    external_reference VARCHAR(100),
    jira_key VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(code, project_id)
);
```

### Modified Table: `test_cases`

```sql
ALTER TABLE test_cases ADD COLUMN call_number_id UUID REFERENCES call_numbers(id);
```

---

## 🔌 New API Endpoints

### Call Number Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/call-numbers` | Create call number |
| POST | `/api/call-numbers/bulk` | Bulk create call numbers |
| GET | `/api/call-numbers/{id}` | Get by ID |
| GET | `/api/call-numbers/project/{projectId}` | Get all for project |
| GET | `/api/call-numbers/project/{projectId}/tree` | Get hierarchical tree |
| GET | `/api/call-numbers/search` | Search within project |
| PUT | `/api/call-numbers/{id}` | Update call number |
| DELETE | `/api/call-numbers/{id}` | Deactivate (soft delete) |
| POST | `/api/call-numbers/link-test-cases` | Link test cases to call number |
| POST | `/api/call-numbers/bulk-status-update` | Bulk update test case statuses |

---

## 📊 Call Number Hierarchy

```
Project
└── Parent Call Number (e.g., CALL-001)
    ├── Child Call Number (e.g., CALL-001-A)
    │   └── Test Cases
    └── Child Call Number (e.g., CALL-001-B)
        └── Test Cases
```

---

## 🔜 Next Steps

1. **Test the implementation** - Run the application and verify all endpoints
2. **Implement remaining issues** - Address Issue #4, #6, #8-11, #20, #22-24, #27-28, #30
3. **Frontend UI** - Create CallNumberManagementPage component
4. **Update Excel template** - Add Priority and Call Number columns
5. **Integration testing** - Test call number linking with test cases and defects

---

## 📝 Notes

- All new endpoints require ADMIN or MANAGER role unless specified otherwise
- Call numbers support soft delete (active = false) to preserve history
- Bulk status update includes cache eviction to ensure dashboard reflects changes immediately
- Priority sorting places CRITICAL cases first, followed by HIGH, MEDIUM, LOW
