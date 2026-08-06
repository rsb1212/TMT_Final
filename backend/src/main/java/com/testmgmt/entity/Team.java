package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Team entity - represents teams/departments within an organization (Tenant).
 * Multiple teams can exist within the same tenant/organization.
 */
@Entity
@Table(name = "teams",
        indexes = {
            @Index(name = "idx_teams_tenant", columnList = "tenant_id"),
            @Index(name = "idx_teams_code", columnList = "code"),
            @Index(name = "idx_teams_active", columnList = "active")
        },
        uniqueConstraints = {
            @UniqueConstraint(name = "uk_team_code_tenant", columnNames = {"code", "tenant_id"})
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "code", nullable = false, length = 50)
    private String code;  // Short unique code like "QA_TEAM1", "DEV_TEAM"

    @Column(name = "name", nullable = false, length = 255)
    private String name;  // Full team name like "Quality Assurance Team 1"

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Team type: QA, DEV, UAT, SUPPORT, etc. */
    @Column(name = "team_type", length = 50)
    private String teamType;

    /** Department this team belongs to */
    @Column(name = "department", length = 100)
    private String department;

    /** Channel this team handles */
    @Column(name = "channel", length = 100)
    private String channel;

    /** Team lead user ID */
    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    /** Display order */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
