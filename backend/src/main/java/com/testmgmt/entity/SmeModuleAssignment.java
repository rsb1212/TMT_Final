package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Maps SME users to their assigned modules.
 * An SME can only view/review test cases from their assigned modules.
 */
@Entity
@Table(name = "sme_module_assignments",
        indexes = {
            @Index(name = "idx_sma_sme", columnList = "sme_id"),
            @Index(name = "idx_sma_module", columnList = "module_id"),
            @Index(name = "idx_sma_tenant", columnList = "tenant_id")
        },
        uniqueConstraints = {
            @UniqueConstraint(name = "uk_sme_module", columnNames = {"sme_id", "module_id"})
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SmeModuleAssignment extends BaseEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    /** The SME user */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sme_id", nullable = false)
    private User sme;

    /** The module assigned to the SME */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    /** Optional: specific channel this SME handles for this module */
    @Column(name = "channel", length = 50)
    private String channel;

    /** Optional: specific department/function this SME handles */
    @Column(name = "department", length = 50)
    private String department;

    /** Whether this assignment is active */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}
