package com.testmgmt.entity;

import com.testmgmt.enums.RepositoryCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "repository_documents",
        indexes = {
            @Index(name = "idx_repo_project",  columnList = "project_id"),
            @Index(name = "idx_repo_category", columnList = "category"),
            @Index(name = "idx_repo_uploader", columnList = "uploaded_by_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RepositoryDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private RepositoryCategory category;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "description", length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "ACTIVE";

    @PrePersist
    protected void prePersist() {
        if (uploadedAt == null) uploadedAt = Instant.now();
    }
}
