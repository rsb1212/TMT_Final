package com.testmgmt.entity;

import com.testmgmt.enums.ReleaseReason;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "test_case_releases",
        indexes = {
            @Index(name = "idx_tcr_testcase",  columnList = "test_case_id"),
            @Index(name = "idx_tcr_requester", columnList = "requested_by_id"),
            @Index(name = "idx_tcr_status",    columnList = "status")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TestCaseRelease extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_id", nullable = false)
    private TestCase testCase;

    /** Tester who requested the release */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, length = 40)
    private ReleaseReason reason;

    /** Optional free-text detail (required when reason = OTHER) */
    @Column(name = "reason_detail", length = 500)
    private String reasonDetail;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    /** PENDING → APPROVED / REJECTED by manager */
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    /** Manager who actioned the request */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actioned_by_id")
    private User actionedBy;

    @Column(name = "actioned_at")
    private Instant actionedAt;

    /** Manager's note when approving or rejecting */
    @Column(name = "manager_note", length = 500)
    private String managerNote;

    @PrePersist
    protected void prePersist() {
        if (requestedAt == null) requestedAt = Instant.now();
    }
}
