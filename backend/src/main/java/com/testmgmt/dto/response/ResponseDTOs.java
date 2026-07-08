package com.testmgmt.dto.response;

import com.testmgmt.enums.*;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// import com.testmgmt.enums.*;
// import lombok.Builder;
// import lombok.Data;

// import java.time.Instant;
// import java.util.List;
// import java.util.UUID;

/**
 * Central response DTO class.
 *
 * Execution-specific DTOs → ExecutionResponseDTOs.java
 * Productivity/tracking DTOs → TesterProductivityDTOs.java
 *
 * All other response types live here.
 */
public class ResponseDTOs {

    // ── Auth ─────────────────────────────────────────────────────────────────

    @Data @Builder
    public static class AuthResponse {
        private String token;
        private String tokenType;
        private UserResponse user;
    }

    // ── User ─────────────────────────────────────────────────────────────────

    @Data @Builder
    public static class UserResponse {
        private UUID     id;
        private String   username;
        private String   email;
        private String   fullName;
        private UserRole role;
        private String   team;
        private Boolean  active;
        private Instant  createdAt;
    }

    // ── Project / Module / Tags ───────────────────────────────────────────────

    @Data @Builder
    public static class ProjectResponse {
        private UUID                  id;
        private String                name;
        private String                description;
        private Boolean               active;
        private Instant               createdAt;
        private UserResponse          owner;
        private UUID                  parentProjectId;
        private String                parentProjectName;
        private List<ProjectResponse> subProjects;
    }

    @Data @Builder
    public static class ModuleResponse {
        private UUID   id;
        private String name;
        private UUID   projectId;
        private String projectName;
        private UUID   parentModuleId;
        private String parentModuleName;
    }

    @Data @Builder
    public static class TagResponse {
        private UUID   id;
        private String name;
        private UUID   projectId;
    }

    // ── Requirements ─────────────────────────────────────────────────────────

    @Data @Builder
    public static class RequirementResponse {
        private UUID            id;
        private String          code;
        private String          title;
        private String          description;
        private RequirementType type;
        private UUID            projectId;
        private String          projectName;
        private Instant         createdAt;
    }

    // ── Test Case ────────────────────────────────────────────────────────────

    @Data @Builder
    public static class TestStepResponse {
        private UUID    id;
        private Integer stepNumber;
        private String  stepAction;
        private String  expectedResult;
        private String  actualResult;
    }

    @Data @Builder
    public static class TestCaseResponse {
        private UUID             id;
        private String           code;
        private String           title;
        private String           description;
        private String           preconditions;
        private Priority         priority;
        private TestStatus       status;
        private Integer          versionNumber;
        private Boolean          isRegression;
        private Boolean          isTemplate;
        private ProjectResponse  project;
        private ModuleResponse   module;
        private UserResponse     createdBy;
        private UserResponse     reviewedBy;
        private UserResponse     assignedTo;
        private List<TestStepResponse>    steps;
        private List<TagResponse>         tags;
        private List<RequirementResponse> requirements;
        private Instant          createdAt;
        private Instant          updatedAt;
    }

    @Data @Builder
    public static class TestCaseVersionResponse {
        private UUID    id;
        private Integer versionNumber;
        private String  snapshot;
        private String  changeSummary;
        private String  changedByName;
        private Instant createdAt;
    }

    // ── Attachments ──────────────────────────────────────────────────────────

    @Data @Builder
    public static class AttachmentResponse {
        private UUID                 id;
        private AttachmentEntityType entityType;
        private UUID                 entityId;
        private String               fileName;
        private String               mimeType;
        private Long                 fileSizeBytes;
        private String               uploadedByName;
        private Instant              createdAt;
        private String               downloadUrl;
    }

    // ── Notifications ─────────────────────────────────────────────────────────

    @Data @Builder
    public static class NotificationResponse {
        private UUID             id;
        private NotificationType type;
        private String           title;
        private String           message;
        private String           entityType;
        private UUID             entityId;
        private Boolean          isRead;
        private Instant          createdAt;
    }

    // ── Defects ──────────────────────────────────────────────────────────────

    @Data @Builder
    public static class DefectResponse {
        private UUID           id;
        private String         code;
        private String         title;
        private String         description;
        private DefectSeverity severity;
        private DefectPriority priority;
        private DefectStatus   status;
        private String         jiraIssueKey;
        private ProjectResponse project;
        private UserResponse    reportedBy;
        private UserResponse    assignedTo;
        private UUID            testCaseId;
        private String          testCaseCode;
        private Instant         createdAt;
        private Instant         updatedAt;
    }

    // ── Sign-Off ─────────────────────────────────────────────────────────────

    @Data @Builder
    public static class SignOffResponse {
        private UUID         id;
        private UUID         projectId;
        private String       projectName;
        private UserResponse signedOffBy;
        private Integer      passedCaseCount;
        private String       exportedDocPath;
        private Instant      signedOffAt;
        private String       notes;
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    @Data @Builder
    public static class ManagerDashboardResponse {
        private UUID   projectId;
        private String projectName;
        // Totals
        private long   totalTestCases;
        // Workflow states
        private long   draft;
        private long   pendingReview;
        private long   pendingSmeReview;
        private long   smeApproved;
        private long   assigned;
        private long   inProgress;
        // Execution states
        private long   passed;
        private long   failed;
        private long   defectRaised;
        private long   naCount;
        private long   notReleased;
        private long   releaseRequested;
        private long   released;
        // Post-execution
        private long   underReview;
        private long   signedOff;
        private long   uatPending;
        private long   uatPassed;
        private long   redevelopment;
        private long   retest;
        // Defect summary
        private long   totalDefects;
        private long   openDefects;
        // Rates
        private double passRate;
        private double executionRate;
    }

    @Data @Builder
    public static class ModuleStatusSummary {
        private UUID   moduleId;
        private String moduleName;
        private long   total;
        private long   passed;
        private long   failed;
        private long   inProgress;
        private long   naCount;
        private long   notReleased;
        private long   defectRaised;
        private long   releaseRequested;
        private double passRate;
    }

    // ── Import ───────────────────────────────────────────────────────────────

    @Data @Builder
    public static class ImportErrorItem {
        private int    row;
        private String column;
        private String message;
    }

    @Data @Builder
    public static class ImportResultResponse {
        private UUID                  importLogId;
        private int                   totalRows;
        private int                   successCount;
        private int                   errorCount;
        private List<ImportErrorItem> errors;
    }

    // ── Generic API envelope ─────────────────────────────────────────────────

    @Data @Builder
    public static class ApiResponse<T> {
        private boolean success;
        private String  message;
        private T       data;

        public static <T> ApiResponse<T> success(T data) {
            return ApiResponse.<T>builder().success(true).data(data).build();
        }
        public static <T> ApiResponse<T> success(String message, T data) {
            return ApiResponse.<T>builder().success(true).message(message).data(data).build();
        }
        public static ApiResponse<Void> ok(String message) {
            return ApiResponse.<Void>builder().success(true).message(message).build();
        }
        public static <T> ApiResponse<T> error(String message) {
            return ApiResponse.<T>builder().success(false).message(message).build();
        }
    }

    // ── Workload ─────────────────────────────────────────────────────────────

    @Data @Builder
    public static class WorkloadResponse {
        private UUID   userId;
        private String fullName;
        private String team;
        private long   pendingCases;
        private long   inProgressCases;
        private long   releasedCases;     // RELEASED — awaiting reassignment
        private double avgDailyVelocity;
        private String loadStatus;        // NORMAL / HIGH / OVERLOADED
    }

    // ── Search ───────────────────────────────────────────────────────────────

    @Data @Builder
    public static class SearchResultResponse {
        private String type;         // TEST_CASE / DEFECT
        private UUID   id;
        private String code;
        private String title;
        private String status;
        private String projectName;
        private String moduleName;
    }

    // ── Release Management ───────────────────────────────────────────────────

    @Data @Builder
    public static class TestCaseReleaseResponse {
        private UUID    id;
        private UUID    testCaseId;
        private String  testCaseCode;
        private String  testCaseTitle;
        private String  requestedBy;
        private String  requestedByName;
        private String  reason;
        private String  reasonDetail;
        private String  status;           // PENDING / APPROVED / REJECTED
        private String  actionedBy;
        private String  managerNote;
        private UUID    reassignedToUserId;
        private String  reassignedToName;
        private Instant requestedAt;
        private Instant actionedAt;
    }

    // ── Central Repository ───────────────────────────────────────────────────

    @Data @Builder
    public static class RepositoryDocumentResponse {
        private UUID    id;
        private UUID    projectId;
        private String  projectName;
        private String  category;
        private String  originalName;
        private String  fileName;
        private Long    fileSize;
        private String  mimeType;
        private Integer version;
        private String  description;
        private String  status;
        private String  uploadedBy;
        private String  uploadedByName;
        private Instant uploadedAt;
        private Instant createdAt;
    }

    // ── QA Calls ─────────────────────────────────────────────────────────────

    @Data @Builder
    public static class QACallResponse {
        private UUID            id;
        private String          code;
        private String          title;
        private String          agenda;
        private String          callType;
        private String          status;
        private Instant         scheduledAt;
        private Instant         startedAt;
        private Instant         endedAt;
        private Integer         durationMinutes;
        private String          meetingUrl;
        private String          platform;
        private ProjectResponse project;
        private ModuleResponse  module;
        private UserResponse    organiser;
        private List<UserResponse>     participants;
        private List<TestCaseResponse> testCases;
        private List<String>           defectCodes;
        private String          minutes;
        private String          actionItems;
        private String          decisions;
        private UserResponse    notesRecordedBy;
        private Boolean         isRecurring;
        private String          recurrencePattern;
        private int             attachmentCount;
        private Instant         createdAt;
    }

    @Data @Builder
    public static class CallSummaryResponse {
        private UUID    projectId;
        private String  projectName;
        private long    totalCalls;
        private long    scheduled;
        private long    completed;
        private long    cancelled;
        private long    inProgress;
        private long    standups;
        private long    defectTriages;
        private long    uatReviews;
        private long    testPlannings;
        private long    smeReviews;
        private long    totalMinutesSpent;
        private List<QACallResponse> upcomingCalls;
        private List<QACallResponse> recentCalls;
    }
}
