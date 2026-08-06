package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Call Number entity for tracking test cases under specific call numbers.
 * Supports hierarchical structure: Parent Call Number → Child Call Number (Optional)
 * 
 * Hierarchy:
 *   Project
 *   └── Parent Call Number
 *       └── Child Call Number (Optional)
 *           └── Test Cases
 */
@Entity
@Table(name = "call_numbers",
        indexes = {
            @Index(name = "idx_call_number_project", columnList = "project_id"),
            @Index(name = "idx_call_number_parent", columnList = "parent_call_number_id"),
            @Index(name = "idx_call_number_code", columnList = "code"),
            @Index(name = "idx_call_number_tenant", columnList = "tenant_id")
        },
        uniqueConstraints = {
            @UniqueConstraint(name = "uk_call_number_code_project", columnNames = {"code", "project_id"})
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CallNumber extends BaseEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    /** Unique call number code (e.g., "CALL-001", "PDT-19882") */
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    /** Human-readable name/description for the call number */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /** Detailed description of what this call number covers */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Associated project (mandatory) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Parent call number (null = root/parent call number) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_call_number_id")
    private CallNumber parentCallNumber;

    /** Child call numbers */
    @OneToMany(mappedBy = "parentCallNumber", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CallNumber> childCallNumbers = new ArrayList<>();

    /** External reference (e.g., Jira ticket key) */
    @Column(name = "external_reference", length = 100)
    private String externalReference;

    /** Jira issue key if linked */
    @Column(name = "jira_key", length = 50)
    private String jiraKey;

    /** Active status for soft delete */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    /** Sort order within parent or project */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /**
     * Check if this is a parent (root) call number
     */
    public boolean isParent() {
        return parentCallNumber == null;
    }

    /**
     * Check if this is a child call number
     */
    public boolean isChild() {
        return parentCallNumber != null;
    }

    /**
     * Get the full hierarchical path (e.g., "PARENT-001 > CHILD-001")
     */
    public String getFullPath() {
        if (parentCallNumber != null) {
            return parentCallNumber.getCode() + " > " + code;
        }
        return code;
    }
}
