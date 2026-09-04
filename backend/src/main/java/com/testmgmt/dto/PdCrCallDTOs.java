package com.testmgmt.dto;

import com.testmgmt.enums.PdCrCallStatus;
import com.testmgmt.enums.PdCrCallType;
import com.testmgmt.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTOs for the PD/CR Call tracking module.
 */
public class PdCrCallDTOs {

    // ── Create / Update request ──────────────────────────────────────────────

    @Data
    public static class UpsertRequest {
        @NotBlank(message = "childCallId is required")
        private String childCallId;
        private String parentCallId;

        private String category;             // raw text; callType derived if not supplied
        private PdCrCallType callType;       // optional explicit override
        private String testingEnvironment;
        private String inScope;
        private String automationScope;
        private String issueDescription;
        private Priority priority;

        private String uatSpoc;
        private String responsibleSpoc;
        private String responsibleTeam;
        private String applicationOwner;
        private LocalDate dateAssignedToOwner;

        private LocalDate uatReleaseDate;
        private LocalDate uatCompletionTentative;
        private LocalDate uatCompletionActual;
        private LocalDate uatSignoffTentative;
        private LocalDate uatSignoffActual;

        private String currentJiraStatus;
        private PdCrCallStatus status;
        private String latestUpdate;
        private String openDefects;

        private UUID projectId;
    }

    // ── Response ─────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class PdCrCallResponse {
        private UUID id;
        private String childCallId;
        private String parentCallId;

        private String category;
        private PdCrCallType callType;
        private String testingEnvironment;
        private String inScope;
        private String automationScope;
        private String issueDescription;
        private Priority priority;

        private String uatSpoc;
        private String responsibleSpoc;
        private String responsibleTeam;
        private String applicationOwner;
        private LocalDate dateAssignedToOwner;

        private LocalDate uatReleaseDate;
        private LocalDate uatCompletionTentative;
        private LocalDate uatCompletionActual;
        private LocalDate uatSignoffTentative;
        private LocalDate uatSignoffActual;

        private String currentJiraStatus;
        private PdCrCallStatus status;
        private String latestUpdate;
        private String openDefects;

        private UUID projectId;
        private String projectName;

        // ── Computed ageing fields ──────────────────────────────
        /** Days between UAT release date (or created date) and sign-off/today. */
        private Long callsAgeingDays;
        private String callsAgeingBucket;
        /** Days since the call was assigned to the current owner. */
        private Long ageingWithCurrentOwnerDays;
        private String ownerAgeingBucket;
        private boolean signedOff;
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardResponse {
        private long total;
        private long open;
        private long closed;             // SIGNED_OFF + CLOSED

        /** Count keyed by call type (PD, CR, NR_CR, OTHER). */
        private Map<String, Long> byCallType;
        /** Count keyed by lifecycle status. */
        private Map<String, Long> byStatus;
        /** Count keyed by priority. */
        private Map<String, Long> byPriority;
        /** Count keyed by application owner. */
        private Map<String, Long> byApplicationOwner;
        /** Count keyed by ageing bucket (0-10, 11-21, 22-50, 51-150, 151+). */
        private Map<String, Long> byAgeingBucket;

        /** Owners with the most open, oldest calls. */
        private List<AgeingRow> topAgeing;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AgeingRow {
        private String childCallId;
        private String applicationOwner;
        private String status;
        private Long ageingDays;
        private String ageingBucket;
    }
}
