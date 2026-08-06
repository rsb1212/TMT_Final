# SmartQA - Issue Segregation by Module

## 1. Test Case Repository Module

### Status Management
- Unable to upload test case statuses in bulk.
- Dashboard is not updated after bulk status upload.
- Draft status test cases should not appear in **Assign by Module**.
- Test Case Description and Expected Result should become read-only when status changes to:
  - Pending with SME
  - SME Approved
- SME name selection is missing when sending test cases for review.
- Unable to share bulk test cases to SME for sign-off.

### Test Case Attributes
- Priority not available in Excel but showing as **MEDIUM** in SmartQA.
- Test Case IDs should be displayed in ascending order.
- Search results should highlight the matched test case description.

### Data Mapping Issues
- Module in Excel is **Digi**, but SmartQA displays **Axis** sub-module.
- Module mapping mismatch during upload.

---

## 2. Assignment Module

### Assignment Functionality
- Module dropdown should be mandatory in Assign by Module.
- Unable to perform bulk assignment of test cases.
- Only Managers can upload and assign test cases. Access flow needs revision.

---

## 3. Call Number Management Module

### Mandatory Call Number Requirements
- A project can contain multiple call numbers.
- Search test cases by call number is unavailable.
- All test cases should be mapped to a call number.
- Call number should be mandatory during repository upload.
- Call number should be visible in test case details.
- Call number should be mandatory while creating a project.

### Required Hierarchy

Project
 └── Parent Call Number
      └── Child Call Number (Optional)
           └── Test Case ID
                └── Test Case Description
                └── Expected Results
                └── Test Steps
                └── Priority
                └── Created By
                └── Assigned To
                └── Reviewed By

## 4. Execution & Defect Management Module

### Execution Requirements
- Call number should be visible for each test case during execution.
- Defects should be raised under the corresponding call number.
- System should redirect users to the linked Jira call number while raising defects.
- Defect ID should be tagged to the respective test case.

### Test Case Ordering
- Test cases should be sorted based on:
  1. Severity (Highest to Lowest)
  2. Priority (Highest to Lowest)
- Critical test cases should appear at the top of the execution list.

---

## 5. Project Management Module

### Project Issues
- Project filters are not working consistently across projects.

### Subproject Issues
- Subproject deactivation is not working after confirming the action.

## 6. Search & Reporting Module

### Search Functionality
- Search by call number is unavailable.
- Search results do not highlight matched test case descriptions.

---

## 7. SME Review & Sign-off Module

### Review Workflow Issues
- SME name selection missing during review assignment.
- Status changes to **Pending with SME** without assigning an SME.
- Unable to share bulk test cases for SME sign-off.
- SME login access/details required for sign-off process.

---

## Summary

| Module | Issue Count |
|----------|------------|
| Test Case Repository | 8 |
| Assignment | 3 |
| Call Number Management | 6 |
| Execution & Defect Management | 4 |
| Project Management | 2 |
| Search & Reporting | 2 |
| SME Review & Sign-off | 4 |

**Total Consolidated Issues: 29**
