package com.testmgmt.entity;

import com.testmgmt.enums.PdCrCallStatus;
import com.testmgmt.enums.PdCrCallType;
import com.testmgmt.enums.Priority;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * PdCrCall — tracks a single PD/CR call through its UAT lifecycle.
 *
 * Columns are modelled on the "PD-CR" tracking spreadsheet. Only the
 * business-relevant columns are persisted; ageing values are computed
 * on the fly (see PdCrCallService) rather than stored, so they never
 * go stale.
 */
@Entity
@Table(name = "pd_cr_calls",
        indexes = {
            @Index(name = "idx_pdcr_project",     columnList = "project_id"),
            @Index(name = "idx_pdcr_tenant",       columnList = "tenant_id"),
            @Index(name = "idx_pdcr_call_type",    columnList = "call_type"),
            @Index(name = "idx_pdcr_status",       columnList = "status"),
            @Index(name = "idx_pdcr_child_call",   columnList = "child_call_id"),
            @Index(name = "idx_pdcr_app_owner",    columnList = "application_owner")
        },
        uniqueConstraints = {
            @UniqueConstraint(name = "uk_pdcr_child_call_project",
                    columnNames = {"child_call_id", "project_id"})
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@SuppressWarnings("all")
public class PdCrCall extends BaseEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    // ── Identity ─────────────────────────────────────────────────────────────

    /** "Child Call ID" — e.g. OPS-16290, AP-29 */
    @Column(name = "child_call_id", nullable = false, length = 60)
    private String childCallId;

    /** "Parent call ID" (optional) */
    @Column(name = "parent_call_id", length = 60)
    private String parentCallId;

    // ── Classification ───────────────────────────────────────────────────────

    /** Raw "Category" text from the sheet (NR-CR, CR, PD …) */
    @Column(name = "category", length = 40)
    private String category;

    /** Normalised call type derived from category */
    @Enumerated(EnumType.STRING)
    @Column(name = "call_type", nullable = false, length = 20)
    @Builder.Default
    private PdCrCallType callType = PdCrCallType.OTHER;

    /** "Testing Environment" */
    @Column(name = "testing_environment", length = 100)
    private String testingEnvironment;

    /** "In Scope" (Claims, NB, PS …) */
    @Column(name = "in_scope", length = 100)
    private String inScope;

    /** "Automation Scope" */
    @Column(name = "automation_scope", length = 100)
    private String automationScope;

    /** "Issue Description" */
    @Column(name = "issue_description", columnDefinition = "TEXT")
    private String issueDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 20)
    private Priority priority;

    // ── Ownership ────────────────────────────────────────────────────────────

    /** "UAT SPOC" */
    @Column(name = "uat_spoc", length = 120)
    private String uatSpoc;

    /** "Responsible SPOC" */
    @Column(name = "responsible_spoc", length = 200)
    private String responsibleSpoc;

    /** "Responsible" team */
    @Column(name = "responsible_team", length = 120)
    private String responsibleTeam;

    /** "Application owner" (PAS, LACP, Omni …) */
    @Column(name = "application_owner", length = 120)
    private String applicationOwner;

    /** "Date Assigned to current owner" — anchor for owner-ageing */
    @Column(name = "date_assigned_to_owner")
    private LocalDate dateAssignedToOwner;

    // ── UAT dates ────────────────────────────────────────────────────────────

    /** "UAT release date" — anchor for call ageing */
    @Column(name = "uat_release_date")
    private LocalDate uatReleaseDate;

    /** "UAT Completion date (Tentative)" */
    @Column(name = "uat_completion_tentative")
    private LocalDate uatCompletionTentative;

    /** "UAT completion date (Actual)" */
    @Column(name = "uat_completion_actual")
    private LocalDate uatCompletionActual;

    /** "UAT Sign off Date (Tentative)" */
    @Column(name = "uat_signoff_tentative")
    private LocalDate uatSignoffTentative;

    /** "UAT Sign off Date (Actual)" — closes ageing when set */
    @Column(name = "uat_signoff_actual")
    private LocalDate uatSignoffActual;

    // ── Status / tracking ────────────────────────────────────────────────────

    /** "Current Jira Status" (free text mirrored from Jira) */
    @Column(name = "current_jira_status", length = 120)
    private String currentJiraStatus;

    /** Management lifecycle status the dashboard groups by */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PdCrCallStatus status = PdCrCallStatus.OPEN;

    /** "Latest Update- UAT" */
    @Column(name = "latest_update", columnDefinition = "TEXT")
    private String latestUpdate;

    /** "Open defects" (comma-separated Jira keys) */
    @Column(name = "open_defects", columnDefinition = "TEXT")
    private String openDefects;

    // ── Relations ────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    /** Soft-delete flag */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}
