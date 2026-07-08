package com.testmgmt.entity;

import com.testmgmt.enums.CallStatus;
import com.testmgmt.enums.CallType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * QACall — tracks QA meetings/calls (standup, defect triage, UAT review, etc.)
 * linked to a project, optional module, and optional test case(s).
 */
@Entity
@Table(name = "qa_calls",
        indexes = {
            @Index(name = "idx_qacall_project",    columnList = "project_id"),
            @Index(name = "idx_qacall_status",     columnList = "status"),
            @Index(name = "idx_qacall_type",       columnList = "call_type"),
            @Index(name = "idx_qacall_scheduled",  columnList = "scheduled_at"),
            @Index(name = "idx_qacall_organiser",  columnList = "organiser_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@SuppressWarnings({"all"})
public class QACall extends BaseEntity {

    /** Unique human-readable call code: CALL-0001, CALL-0002 … */
    @Column(name = "code", unique = true, nullable = false, length = 20)
    private String code;

    /** Short title / agenda */
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    /** Full agenda / description */
    @Column(name = "agenda", columnDefinition = "TEXT")
    private String agenda;

    @Enumerated(EnumType.STRING)
    @Column(name = "call_type", nullable = false, length = 30)
    private CallType callType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CallStatus status = CallStatus.SCHEDULED;

    /** When the call is planned to start */
    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    /** When it actually started */
    @Column(name = "started_at")
    private Instant startedAt;

    /** When it actually ended */
    @Column(name = "ended_at")
    private Instant endedAt;

    /** Duration in minutes (computed or manually set) */
    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    /** Meeting URL (Google Meet / Teams / Zoom) */
    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    /** Meeting platform label */
    @Column(name = "platform", length = 50)
    private String platform;

    // ── Relations ────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Optional: which module this call is about */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id")
    private Module module;

    /** Who organised the call */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organiser_id", nullable = false)
    private User organiser;

    /** All participants */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "qa_call_participants",
            joinColumns        = @JoinColumn(name = "call_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    @Builder.Default
    private List<User> participants = new ArrayList<>();

    /** Test cases discussed in this call */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "qa_call_test_cases",
            joinColumns        = @JoinColumn(name = "call_id"),
            inverseJoinColumns = @JoinColumn(name = "test_case_id"))
    @Builder.Default
    private List<TestCase> testCases = new ArrayList<>();

    /** Defects discussed */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "qa_call_defects",
            joinColumns        = @JoinColumn(name = "call_id"),
            inverseJoinColumns = @JoinColumn(name = "defect_id"))
    @Builder.Default
    private List<Defect> defects = new ArrayList<>();

    // ── Post-call notes ──────────────────────────────────────────────────────

    /** Minutes of the meeting / MoM */
    @Column(name = "minutes", columnDefinition = "TEXT")
    private String minutes;

    /** Action items captured during call */
    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems;

    /** Key decisions made */
    @Column(name = "decisions", columnDefinition = "TEXT")
    private String decisions;

    /** Who recorded the notes */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notes_recorded_by_id")
    private User notesRecordedBy;

    /** Attachments: meeting recordings, screenshots, docs */
    @OneToMany(mappedBy = "qaCall", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CallAttachment> attachments = new ArrayList<>();

    /** Is this a recurring call? */
    @Column(name = "is_recurring")
    @Builder.Default
    private Boolean isRecurring = false;

    /** Recurrence pattern (DAILY / WEEKLY / BIWEEKLY) */
    @Column(name = "recurrence_pattern", length = 20)
    private String recurrencePattern;

    /** Parent call if this is a recurring instance */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_call_id")
    private QACall parentCall;
}
