package com.testmgmt.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "tags",
       uniqueConstraints = @UniqueConstraint(name = "uq_tag_name_project", columnNames = {"name", "project_id"}),
       indexes = {
           @Index(name = "idx_tag_project", columnList = "project_id"),
           @Index(name = "idx_tag_tenant", columnList = "tenant_id")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tag extends BaseEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 60)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
}
