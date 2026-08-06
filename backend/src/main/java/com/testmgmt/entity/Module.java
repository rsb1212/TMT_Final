package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "modules",
        indexes = {
            @Index(name = "idx_modules_project", columnList = "project_id"),
            @Index(name = "idx_modules_parent",  columnList = "parent_module_id"),
            @Index(name = "idx_modules_tenant", columnList = "tenant_id"),
            @Index(name = "idx_modules_channel", columnList = "channel"),
            @Index(name = "idx_modules_department", columnList = "department")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Module extends BaseEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** Supports sub-module hierarchy: Module → SubModule → SubModule1 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_module_id")
    private Module parentModule;

    /** Channel mapping (e.g., Branch, Digital, RM Channel, Call Center, Partner Channel) */
    @Column(name = "channel", length = 50)
    private String channel;

    /** Department/Function mapping (e.g., Operations, Sales, IT, Compliance) */
    @Column(name = "department", length = 50)
    private String department;

    /** Module type (e.g., REPO, BAU_PROJECT, PRODUCT, MODIFICATION) */
    @Column(name = "module_type", length = 30)
    private String moduleType;

    /** Display order within parent */
    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    /** Whether this module is active */
    @Column(name = "active", nullable = false, columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean active = true;
}
